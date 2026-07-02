import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkOrderStatus } from '@prisma/client';
import PDFDocument = require('pdfkit');
import { Resend } from 'resend';
import { PrismaService } from '../../prisma/prisma.service';
import { FindReceiptsQueryDto } from './dto/find-receipts-query.dto';
import { IssueReceiptDto } from './dto/issue-receipt.dto';
import { SendReceiptEmailDto } from './dto/send-receipt-email.dto';

const INITIAL_RECEIPT_NUMBER = 1;
const CREATE_RECEIPT_MAX_ATTEMPTS = 3;

const receiptInclude = {
  workshop: {
    select: {
      id: true,
      name: true,
    },
  },
  workOrder: {
    select: {
      id: true,
      orderNumber: true,
    },
  },
  issuedByUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.ReceiptInclude;

const workOrderReceiptInclude = {
  workshop: {
    select: {
      id: true,
      name: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      licensePlate: true,
      brand: true,
      model: true,
      year: true,
      mileage: true,
      customer: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
    },
  },
} satisfies Prisma.WorkOrderInclude;

type ReceiptWithRelations = Prisma.ReceiptGetPayload<{
  include: typeof receiptInclude;
}>;

type WorkOrderForReceipt = Prisma.WorkOrderGetPayload<{
  include: typeof workOrderReceiptInclude;
}>;

type ReceiptsPrismaClient = PrismaService | Prisma.TransactionClient;

type CustomerSnapshot = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
};

type VehicleSnapshot = {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number | null;
  mileage: number | null;
};

type WorkSnapshot = {
  id: string;
  orderNumber: number;
  reportedIssue: string;
  diagnosis: string | null;
  workDone: string | null;
  partsUsed: string | null;
  entryMileage: number | null;
  status: WorkOrderStatus;
  entryDate: string;
  deliveryDate: string | null;
};

/**
 * Handles internal receipt issuing, PDF generation and email delivery.
 */
@Injectable()
export class ReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lists receipts for the authenticated workshop.
   */
  async findAll(workshopId: string, query: FindReceiptsQueryDto = {}) {
    return this.prisma.receipt.findMany({
      where: {
        workshopId,
        ...(query.workOrderId ? { workOrderId: query.workOrderId } : {}),
      },
      orderBy: {
        issuedAt: 'desc',
      },
      include: receiptInclude,
    });
  }

  /**
   * Returns one receipt if it belongs to the authenticated workshop.
   */
  async findOne(workshopId: string, id: string) {
    const receipt = await this.prisma.receipt.findFirst({
      where: {
        id,
        workshopId,
      },
      include: receiptInclude,
    });

    if (!receipt) {
      throw new NotFoundException('Recibo no encontrado.');
    }

    return receipt;
  }

  /**
   * Issues an immutable internal receipt from a work order snapshot.
   *
   * If the work order already has a receipt, the existing receipt is returned.
   */
  async issueFromWorkOrder(
    workshopId: string,
    userId: string,
    workOrderId: string,
    dto: IssueReceiptDto,
  ) {
    for (
      let attempt = 1;
      attempt <= CREATE_RECEIPT_MAX_ATTEMPTS;
      attempt += 1
    ) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const existingReceipt = await tx.receipt.findFirst({
            where: {
              workshopId,
              workOrderId,
            },
            include: receiptInclude,
          });

          if (existingReceipt) {
            return existingReceipt;
          }

          const workOrder = await tx.workOrder.findFirst({
            where: {
              id: workOrderId,
              workshopId,
            },
            include: workOrderReceiptInclude,
          });

          if (!workOrder) {
            throw new NotFoundException('Orden de trabajo no encontrada.');
          }

          if (workOrder.status === WorkOrderStatus.CANCELLED) {
            throw new BadRequestException(
              'No se puede emitir un recibo para una orden anulada.',
            );
          }

          const receiptNumber = await this.getNextReceiptNumber(workshopId, tx);
          const total = this.resolveReceiptTotal(workOrder);
          const notes = this.normalizeOptionalText(dto.notes, 800);

          return tx.receipt.create({
            data: {
              workshopId,
              workOrderId: workOrder.id,
              receiptNumber,
              issuedByUserId: userId,
              customerSnapshot: this.buildCustomerSnapshot(workOrder),
              vehicleSnapshot: this.buildVehicleSnapshot(workOrder),
              workSnapshot: this.buildWorkSnapshot(workOrder),
              laborCost: workOrder.laborCost,
              partsCost: workOrder.partsCost,
              total,
              notes,
            },
            include: receiptInclude,
          });
        });
      } catch (error) {
        if (
          this.isUniqueConstraintError(error) &&
          attempt < CREATE_RECEIPT_MAX_ATTEMPTS
        ) {
          continue;
        }

        this.handlePrismaWriteError(error);
      }
    }

    throw new BadRequestException(
      'No se pudo emitir el recibo. Intentá nuevamente.',
    );
  }

  /**
   * Builds the receipt PDF as a Buffer.
   */
  async buildPdf(
    workshopId: string,
    id: string,
  ): Promise<{
    filename: string;
    buffer: Buffer;
  }> {
    const receipt = await this.findOne(workshopId, id);
    const buffer = await this.renderReceiptPdf(receipt);

    return {
      filename: this.buildReceiptPdfFilename(receipt),
      buffer,
    };
  }

  /**
   * Sends the receipt PDF by email using Resend.
   */
  async sendEmail(
    workshopId: string,
    id: string,
    dto: SendReceiptEmailDto,
  ): Promise<ReceiptWithRelations> {
    const receipt = await this.findOne(workshopId, id);
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RECEIPTS_EMAIL_FROM ?? process.env.EMAIL_FROM;

    if (!apiKey) {
      throw new BadRequestException('Falta configurar RESEND_API_KEY.');
    }

    if (!from) {
      throw new BadRequestException(
        'Falta configurar RECEIPTS_EMAIL_FROM o EMAIL_FROM.',
      );
    }

    const pdfBuffer = await this.renderReceiptPdf(receipt);
    const resend = new Resend(apiKey);
    const customer = this.getCustomerSnapshot(receipt);
    const work = this.getWorkSnapshot(receipt);
    const receiptLabel = this.formatReceiptNumber(receipt.receiptNumber);

    const { error } = await resend.emails.send({
      from,
      to: dto.to,
      subject: `Recibo interno ${receiptLabel} - Orden #${work.orderNumber}`,
      html: this.buildReceiptEmailHtml({
        receipt,
        customerName: customer.fullName,
        message: dto.message,
      }),
      attachments: [
        {
          filename: this.buildReceiptPdfFilename(receipt),
          content: pdfBuffer.toString('base64'),
        },
      ],
    });

    if (error) {
      throw new BadGatewayException(
        'No se pudo enviar el recibo por email. Revisá la configuración de Resend.',
      );
    }

    return this.prisma.receipt.update({
      where: {
        id: receipt.id,
      },
      data: {
        emailTo: dto.to,
        emailedAt: new Date(),
      },
      include: receiptInclude,
    });
  }

  /**
   * Generates the next internal receipt number for the workshop.
   */
  private async getNextReceiptNumber(
    workshopId: string,
    prisma: ReceiptsPrismaClient = this.prisma,
  ): Promise<number> {
    const lastReceipt = await prisma.receipt.findFirst({
      where: {
        workshopId,
      },
      orderBy: {
        receiptNumber: 'desc',
      },
      select: {
        receiptNumber: true,
      },
    });

    return (lastReceipt?.receiptNumber ?? INITIAL_RECEIPT_NUMBER - 1) + 1;
  }

  /**
   * Builds the customer snapshot frozen into the receipt.
   */
  private buildCustomerSnapshot(
    workOrder: WorkOrderForReceipt,
  ): CustomerSnapshot {
    return {
      id: workOrder.vehicle.customer.id,
      fullName: workOrder.vehicle.customer.fullName,
      phone: workOrder.vehicle.customer.phone,
      email: workOrder.vehicle.customer.email,
    };
  }

  /**
   * Builds the vehicle snapshot frozen into the receipt.
   */
  private buildVehicleSnapshot(
    workOrder: WorkOrderForReceipt,
  ): VehicleSnapshot {
    return {
      id: workOrder.vehicle.id,
      licensePlate: workOrder.vehicle.licensePlate,
      brand: workOrder.vehicle.brand,
      model: workOrder.vehicle.model,
      year: workOrder.vehicle.year,
      mileage: workOrder.vehicle.mileage,
    };
  }

  /**
   * Builds the work order snapshot frozen into the receipt.
   */
  private buildWorkSnapshot(workOrder: WorkOrderForReceipt): WorkSnapshot {
    return {
      id: workOrder.id,
      orderNumber: workOrder.orderNumber,
      reportedIssue: workOrder.reportedIssue,
      diagnosis: workOrder.diagnosis,
      workDone: workOrder.workDone,
      partsUsed: workOrder.partsUsed,
      entryMileage: workOrder.entryMileage,
      status: workOrder.status,
      entryDate: workOrder.entryDate.toISOString(),
      deliveryDate: workOrder.deliveryDate?.toISOString() ?? null,
    };
  }

  /**
   * Resolves the final amount stored in the receipt.
   */
  private resolveReceiptTotal(workOrder: WorkOrderForReceipt): Prisma.Decimal {
    if (workOrder.finalTotal) {
      return workOrder.finalTotal;
    }

    if (workOrder.laborCost || workOrder.partsCost) {
      return new Prisma.Decimal(workOrder.laborCost ?? 0).add(
        new Prisma.Decimal(workOrder.partsCost ?? 0),
      );
    }

    if (workOrder.estimatedTotal) {
      return workOrder.estimatedTotal;
    }

    return new Prisma.Decimal(0);
  }

  /**
   * Renders the receipt PDF.
   */
  private renderReceiptPdf(receipt: ReceiptWithRelations): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: 'A4',
        margin: 48,
        info: {
          Title: `Recibo interno ${this.formatReceiptNumber(
            receipt.receiptNumber,
          )}`,
          Author: receipt.workshop.name,
          Subject: 'Comprobante interno de servicio',
        },
      });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawReceiptPdf(doc, receipt);

      doc.end();
    });
  }

  /**
   * Draws the PDF content using a structured talonario-style layout.
   */
  private drawReceiptPdf(
    doc: PDFKit.PDFDocument,
    receipt: ReceiptWithRelations,
  ): void {
    const customer = this.getCustomerSnapshot(receipt);
    const vehicle = this.getVehicleSnapshot(receipt);
    const work = this.getWorkSnapshot(receipt);
    const receiptNumber = this.formatReceiptNumber(receipt.receiptNumber);
    const contentX = 56;
    const contentWidth = 464;

    doc.roundedRect(36, 36, 523, 770, 10).stroke('#cbd5e1');

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#991b1b')
      .text('COMPROBANTE INTERNO', contentX, 58, {
        characterSpacing: 1.2,
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(23)
      .fillColor('#111827')
      .text(receipt.workshop.name.toUpperCase(), contentX, 76, {
        width: 270,
        lineGap: 2,
      });

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#64748b')
      .text(
        'Recibo interno emitido a partir de la orden de trabajo.',
        contentX,
        108,
        {
          width: 270,
        },
      );

    this.drawReceiptNumberBox(
      doc,
      receiptNumber,
      work.orderNumber,
      this.formatDateTime(receipt.issuedAt),
      360,
      56,
    );

    doc
      .moveTo(contentX, 145)
      .lineTo(contentX + contentWidth, 145)
      .stroke('#e2e8f0');

    this.drawPdfInfoPanel(doc, {
      title: 'Cliente',
      x: contentX,
      y: 164,
      width: 224,
      height: 92,
      items: [
        ['Cliente', customer.fullName],
        ['Teléfono', customer.phone ?? 'Sin teléfono'],
        ['Email', customer.email ?? 'Sin email'],
      ],
    });

    this.drawPdfInfoPanel(doc, {
      title: 'Orden',
      x: contentX + 240,
      y: 164,
      width: 224,
      height: 92,
      items: [
        ['Orden', `#${work.orderNumber}`],
        ['Fecha de ingreso', this.formatDate(work.entryDate)],
        ['Estado', this.formatWorkOrderStatus(work.status)],
      ],
    });

    this.drawPdfInfoPanel(doc, {
      title: 'Datos del vehículo',
      x: contentX,
      y: 274,
      width: contentWidth,
      height: 92,
      columns: 3,
      items: [
        ['Patente', vehicle.licensePlate],
        ['Marca', vehicle.brand],
        ['Modelo', vehicle.model],
        ['Año', vehicle.year ? String(vehicle.year) : 'Sin cargar'],
        ['Kilometraje', this.formatMileage(vehicle.mileage)],
        ['Km ingreso', this.formatMileage(work.entryMileage)],
      ],
    });

    this.drawPdfSectionLabel(doc, 'Detalle del trabajo', contentX, 392);

    const tableX = contentX;
    const tableY = 412;
    const amountX = 420;
    const tableWidth = contentWidth;

    doc.roundedRect(tableX, tableY, tableWidth, 218, 8).stroke('#cbd5e1');

    doc.rect(tableX, tableY, tableWidth, 24).fill('#f8fafc').stroke('#cbd5e1');

    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor('#475569')
      .text('CONCEPTO', tableX + 14, tableY + 8, {
        characterSpacing: 0.7,
      })
      .text('IMPORTE', amountX, tableY + 8, {
        width: 86,
        align: 'right',
        characterSpacing: 0.7,
      });

    let rowY = tableY + 24;

    rowY = this.drawPdfDescriptionRow(
      doc,
      'Problema reportado',
      work.reportedIssue,
      tableX,
      rowY,
      tableWidth,
      amountX,
    );

    rowY = this.drawPdfDescriptionRow(
      doc,
      'Diagnóstico',
      work.diagnosis ?? 'Diagnóstico pendiente',
      tableX,
      rowY,
      tableWidth,
      amountX,
    );

    rowY = this.drawPdfDescriptionRow(
      doc,
      'Trabajo realizado',
      work.workDone ?? 'Trabajo pendiente',
      tableX,
      rowY,
      tableWidth,
      amountX,
    );

    rowY = this.drawPdfDescriptionRow(
      doc,
      'Repuestos usados',
      work.partsUsed ?? 'Sin repuestos cargados',
      tableX,
      rowY,
      tableWidth,
      amountX,
    );

    rowY = this.drawPdfAmountRow(
      doc,
      'Mano de obra',
      this.formatMoney(receipt.laborCost),
      tableX,
      rowY,
      tableWidth,
      amountX,
    );

    rowY = this.drawPdfAmountRow(
      doc,
      'Repuestos',
      this.formatMoney(receipt.partsCost),
      tableX,
      rowY,
      tableWidth,
      amountX,
    );

    doc.rect(tableX, rowY, tableWidth, 34).fill('#f8fafc').stroke('#cbd5e1');

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111827')
      .text('TOTAL', tableX + 14, rowY + 11)
      .fontSize(13)
      .fillColor('#dc2626')
      .text(this.formatMoney(receipt.total), amountX, rowY + 10, {
        width: 86,
        align: 'right',
      });

    const notesY = 646;

    doc.roundedRect(contentX, notesY, contentWidth, 42, 8).stroke('#e2e8f0');

    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor('#64748b')
      .text('OBSERVACIONES', contentX + 12, notesY + 9, {
        characterSpacing: 0.8,
      });

    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#111827')
      .text(receipt.notes ?? 'Sin observaciones', contentX + 12, notesY + 22, {
        width: contentWidth - 24,
        height: 13,
        ellipsis: true,
      });

    this.drawPdfSignature(
      doc,
      'Firma / conformidad del cliente',
      contentX,
      728,
      210,
    );
    this.drawPdfSignature(doc, 'Aclaración', 310, 728, 210);

    doc
      .moveTo(contentX, 758)
      .lineTo(contentX + contentWidth, 758)
      .dash(3, { space: 3 })
      .stroke('#cbd5e1');
    doc.undash();

    doc
      .font('Helvetica')
      .fontSize(7.2)
      .fillColor('#64748b')
      .text(
        'Este comprobante es de uso interno del taller y no reemplaza factura, comprobante fiscal ni documentación emitida por un organismo tributario.',
        contentX,
        768,
        {
          width: contentWidth,
          align: 'center',
          lineGap: 1,
        },
      );
  }

  /**
   * Draws the minimal receipt number box.
   */
  private drawReceiptNumberBox(
    doc: PDFKit.PDFDocument,
    receiptNumber: string,
    orderNumber: number,
    issuedAt: string,
    x: number,
    y: number,
  ): void {
    doc.roundedRect(x, y, 160, 86, 8).stroke('#111827');

    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor('#334155')
      .text('RECIBO INTERNO', x, y + 13, {
        width: 160,
        align: 'center',
        characterSpacing: 1.4,
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#dc2626')
      .text(`Nº ${receiptNumber}`, x, y + 32, {
        width: 160,
        align: 'center',
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#111827')
      .text(`Orden #${orderNumber}`, x, y + 58, {
        width: 160,
        align: 'center',
      });

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#64748b')
      .text(`Emitido: ${issuedAt}`, x + 8, y + 70, {
        width: 144,
        align: 'center',
      });
  }

  /**
   * Draws a grouped information panel so receipt metadata does not float.
   */
  private drawPdfInfoPanel(
    doc: PDFKit.PDFDocument,
    options: {
      title: string;
      x: number;
      y: number;
      width: number;
      height: number;
      columns?: number;
      items: Array<[string, string]>;
    },
  ): void {
    const columns = options.columns ?? 1;
    const paddingX = 12;
    const titleY = options.y + 11;
    const gridY = options.y + 31;
    const columnWidth = (options.width - paddingX * 2) / columns;
    const rowHeight = 28;

    doc
      .roundedRect(options.x, options.y, options.width, options.height, 8)
      .fillAndStroke('#ffffff', '#e2e8f0');

    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor('#dc2626')
      .text(options.title.toUpperCase(), options.x + paddingX, titleY, {
        width: options.width - paddingX * 2,
        characterSpacing: 1,
      });

    options.items.forEach(([label, value], index) => {
      const columnIndex = index % columns;
      const rowIndex = Math.floor(index / columns);
      const itemX = options.x + paddingX + columnIndex * columnWidth;
      const itemY = gridY + rowIndex * rowHeight;

      doc
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .fillColor('#64748b')
        .text(label.toUpperCase(), itemX, itemY, {
          width: columnWidth - 10,
          characterSpacing: 0.7,
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#111827')
        .text(value, itemX, itemY + 12, {
          width: columnWidth - 10,
          height: 14,
          ellipsis: true,
        });
    });
  }

  /**
   * Draws a compact section label.
   */
  private drawPdfSectionLabel(
    doc: PDFKit.PDFDocument,
    label: string,
    x: number,
    y: number,
  ): void {
    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor('#dc2626')
      .text(label.toUpperCase(), x, y, {
        characterSpacing: 1.4,
      });
  }

  /**
   * Draws one description row inside the receipt table.
   */
  private drawPdfDescriptionRow(
    doc: PDFKit.PDFDocument,
    title: string,
    description: string,
    x: number,
    y: number,
    width: number,
    amountX: number,
  ): number {
    const rowHeight = 32;

    doc
      .moveTo(x, y)
      .lineTo(x + width, y)
      .stroke('#e2e8f0');

    doc
      .font('Helvetica-Bold')
      .fontSize(8.3)
      .fillColor('#111827')
      .text(title, x + 14, y + 6, {
        width: amountX - x - 24,
      });

    doc
      .font('Helvetica')
      .fontSize(7.7)
      .fillColor('#475569')
      .text(description, x + 14, y + 18, {
        width: amountX - x - 24,
        height: 11,
        ellipsis: true,
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#94a3b8')
      .text('-', amountX, y + 11, {
        width: 86,
        align: 'right',
      });

    return y + rowHeight;
  }

  /**
   * Draws one amount row inside the receipt table.
   */
  private drawPdfAmountRow(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
    amountX: number,
  ): number {
    const rowHeight = 24;

    doc
      .moveTo(x, y)
      .lineTo(x + width, y)
      .stroke('#e2e8f0');

    doc
      .font('Helvetica-Bold')
      .fontSize(8.3)
      .fillColor('#334155')
      .text(label, x + 14, y + 8);

    doc
      .font('Helvetica-Bold')
      .fontSize(8.3)
      .fillColor('#111827')
      .text(value, amountX, y + 8, {
        width: 86,
        align: 'right',
      });

    return y + rowHeight;
  }

  /**
   * Draws a signature line.
   */
  private drawPdfSignature(
    doc: PDFKit.PDFDocument,
    label: string,
    x: number,
    y: number,
    width: number,
  ): void {
    doc
      .moveTo(x, y)
      .lineTo(x + width, y)
      .stroke('#64748b');

    doc
      .font('Helvetica-Bold')
      .fontSize(6.7)
      .fillColor('#64748b')
      .text(label.toUpperCase(), x, y + 8, {
        width,
        align: 'center',
        characterSpacing: 0.7,
      });
  }

  /**
   * Formats ISO date strings for PDF content.
   */
  private formatDate(value: string | null): string {
    if (!value) {
      return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date(value));
  }

  /**
   * Converts work order statuses into readable Spanish labels for receipts.
   */
  private formatWorkOrderStatus(status: WorkOrderStatus): string {
    const statusLabels: Record<WorkOrderStatus, string> = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En progreso',
      READY: 'Listo',
      DELIVERED: 'Entregado',
      CANCELLED: 'Anulada',
    };

    return statusLabels[status];
  }

  /**
   * Builds a safe PDF filename.
   */
  private buildReceiptPdfFilename(receipt: ReceiptWithRelations): string {
    const receiptNumber = this.formatReceiptNumber(receipt.receiptNumber);

    return `recibo-interno-${receiptNumber}.pdf`;
  }

  /**
   * Builds the HTML body used by receipt emails.
   */
  private buildReceiptEmailHtml({
    receipt,
    customerName,
    message,
  }: {
    receipt: ReceiptWithRelations;
    customerName: string;
    message?: string;
  }): string {
    const receiptNumber = this.formatReceiptNumber(receipt.receiptNumber);
    const safeMessage = message ? this.escapeHtml(message) : null;

    return `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        <p>Hola ${this.escapeHtml(customerName)},</p>
        <p>Te enviamos adjunto el recibo interno ${receiptNumber} correspondiente al trabajo realizado.</p>
        ${
          safeMessage
            ? `<p style="padding: 12px; border-left: 4px solid #991b1b; background: #f9fafb;">${safeMessage}</p>`
            : ''
        }
        <p>Saludos,<br />${this.escapeHtml(receipt.workshop.name)}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #6b7280;">
          Este comprobante es de uso interno y no reemplaza documentación fiscal.
        </p>
      </div>
    `;
  }

  /**
   * Reads the frozen customer snapshot from a receipt.
   */
  private getCustomerSnapshot(receipt: ReceiptWithRelations): CustomerSnapshot {
    return receipt.customerSnapshot as unknown as CustomerSnapshot;
  }

  /**
   * Reads the frozen vehicle snapshot from a receipt.
   */
  private getVehicleSnapshot(receipt: ReceiptWithRelations): VehicleSnapshot {
    return receipt.vehicleSnapshot as unknown as VehicleSnapshot;
  }

  /**
   * Reads the frozen work order snapshot from a receipt.
   */
  private getWorkSnapshot(receipt: ReceiptWithRelations): WorkSnapshot {
    return receipt.workSnapshot as unknown as WorkSnapshot;
  }

  /**
   * Formats internal receipt numbers.
   */
  private formatReceiptNumber(receiptNumber: number): string {
    return receiptNumber.toString().padStart(6, '0');
  }

  /**
   * Formats nullable money values for PDF/email content.
   */
  private formatMoney(value: Prisma.Decimal | number | string | null): string {
    if (value === null) {
      return '$ 0';
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return '$ 0';
    }

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(numericValue);
  }

  /**
   * Formats nullable mileage values.
   */
  private formatMileage(value: number | null): string {
    if (value === null) {
      return 'Sin km';
    }

    return `${new Intl.NumberFormat('es-AR').format(value)} km`;
  }

  /**
   * Formats date and time for receipt traceability.
   */
  private formatDateTime(value: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(value);
  }

  /**
   * Normalizes optional text fields.
   */
  private normalizeOptionalText(
    value: string | null | undefined,
    maxLength: number,
  ): string | null {
    const normalizedValue = value?.trim().replace(/\s+/g, ' ');

    if (!normalizedValue) {
      return null;
    }

    return normalizedValue.slice(0, maxLength);
  }

  /**
   * Escapes HTML text used in transactional emails.
   */
  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Checks if a Prisma error came from a unique constraint.
   */
  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  /**
   * Converts known Prisma write errors into safe API exceptions.
   */
  private handlePrismaWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'La orden ya tiene un recibo emitido o el número de recibo ya existe.',
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Recibo no encontrado.');
      }
    }

    throw error;
  }
}
