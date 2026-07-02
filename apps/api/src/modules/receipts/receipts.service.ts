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
   * Draws the PDF content.
   */
  private drawReceiptPdf(
    doc: PDFKit.PDFDocument,
    receipt: ReceiptWithRelations,
  ): void {
    const customer = this.getCustomerSnapshot(receipt);
    const vehicle = this.getVehicleSnapshot(receipt);
    const work = this.getWorkSnapshot(receipt);
    const receiptNumber = this.formatReceiptNumber(receipt.receiptNumber);

    doc.rect(36, 36, 523, 770).stroke('#d1d5db');

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#111827')
      .text(receipt.workshop.name, 56, 58);

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#6b7280')
      .text('Comprobante interno de servicio', 56, 82)
      .text('No válido como factura fiscal', 56, 96);

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#991b1b')
      .text(`RECIBO ${receiptNumber}`, 340, 58, {
        width: 180,
        align: 'right',
      });

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#374151')
      .text(`Orden #${work.orderNumber}`, 340, 82, {
        width: 180,
        align: 'right',
      })
      .text(`Emitido: ${this.formatDateTime(receipt.issuedAt)}`, 340, 96, {
        width: 180,
        align: 'right',
      });

    this.drawSectionTitle(doc, 'Cliente', 56, 138);
    this.drawKeyValue(doc, 'Nombre', customer.fullName, 56, 162, 230);
    this.drawKeyValue(
      doc,
      'Teléfono',
      customer.phone ?? 'Sin teléfono',
      300,
      162,
      220,
    );
    this.drawKeyValue(doc, 'Email', customer.email ?? 'Sin email', 56, 196, 464);

    this.drawSectionTitle(doc, 'Vehículo', 56, 246);
    this.drawKeyValue(doc, 'Patente', vehicle.licensePlate, 56, 270, 140);
    this.drawKeyValue(doc, 'Marca', vehicle.brand, 210, 270, 140);
    this.drawKeyValue(doc, 'Modelo', vehicle.model, 364, 270, 156);
    this.drawKeyValue(
      doc,
      'Año',
      vehicle.year ? String(vehicle.year) : 'Sin cargar',
      56,
      304,
      140,
    );
    this.drawKeyValue(
      doc,
      'Kilometraje',
      this.formatMileage(vehicle.mileage),
      210,
      304,
      180,
    );

    this.drawSectionTitle(doc, 'Trabajo realizado', 56, 354);

    this.drawWorkDetailTable(
      doc,
      [
        {
          label: 'Problema reportado',
          value: work.reportedIssue,
        },
        {
          label: 'Diagnóstico',
          value: work.diagnosis ?? 'Diagnóstico pendiente',
        },
        {
          label: 'Trabajo realizado',
          value: work.workDone ?? 'Trabajo pendiente',
        },
        {
          label: 'Repuestos usados',
          value: work.partsUsed ?? 'Sin repuestos cargados',
        },
      ],
      56,
      376,
      464,
    );

    const summaryY = 574;
    const summaryHeight = 86;

    doc.roundedRect(56, summaryY, 210, summaryHeight, 8).stroke('#e5e7eb');

    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor('#6b7280')
      .text('OBSERVACIONES', 68, summaryY + 12, {
        characterSpacing: 0.8,
      });

    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#111827')
      .text(receipt.notes ?? 'Sin observaciones', 68, summaryY + 28, {
        width: 186,
        height: 42,
        ellipsis: true,
        lineGap: 2,
      });

    this.drawCostsBox(
      doc,
      [
        ['Mano de obra', this.formatMoney(receipt.laborCost)],
        ['Repuestos', this.formatMoney(receipt.partsCost)],
      ],
      this.formatMoney(receipt.total),
      300,
      summaryY,
      220,
      summaryHeight,
    );

    this.drawSignatureLine(
      doc,
      'Firma / conformidad del cliente',
      56,
      724,
      210,
    );
    this.drawSignatureLine(doc, 'Aclaración', 310, 724, 210);

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#6b7280')
      .text(
        'Este comprobante es de uso interno del taller y no reemplaza documentación fiscal.',
        56,
        768,
        {
          width: 464,
          align: 'center',
        },
      );
  }

  /**
   * Draws a section title in the PDF.
   */
  private drawSectionTitle(
    doc: PDFKit.PDFDocument,
    title: string,
    x: number,
    y: number,
  ): void {
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#991b1b')
      .text(title.toUpperCase(), x, y);

    doc.moveTo(x, y + 16).lineTo(520, y + 16).stroke('#e5e7eb');
  }

  /**
   * Draws a compact label/value pair.
   */
  private drawKeyValue(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
  ): void {
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#6b7280').text(label, x, y);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#111827')
      .text(value, x, y + 13, {
        width,
        lineGap: 2,
      });
  }

  /**
   * Draws a lightly structured work-detail table.
   */
  private drawWorkDetailTable(
    doc: PDFKit.PDFDocument,
    rows: Array<{
      label: string;
      value: string;
    }>,
    x: number,
    y: number,
    width: number,
  ): void {
    const headerHeight = 24;
    const rowHeight = 38;
    const tableHeight = headerHeight + rows.length * rowHeight;

    doc.roundedRect(x, y, width, tableHeight, 8).stroke('#d1d5db');

    doc
      .rect(x, y, width, headerHeight)
      .fill('#f9fafb')
      .stroke('#d1d5db');

    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor('#6b7280')
      .text('CONCEPTO', x + 12, y + 9, {
        characterSpacing: 0.8,
      });

    rows.forEach((row, index) => {
      const rowY = y + headerHeight + index * rowHeight;

      doc.moveTo(x, rowY).lineTo(x + width, rowY).stroke('#e5e7eb');

      doc
        .font('Helvetica-Bold')
        .fontSize(8.7)
        .fillColor('#111827')
        .text(row.label, x + 12, rowY + 7, {
          width: width - 24,
        });

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#4b5563')
        .text(row.value, x + 12, rowY + 20, {
          width: width - 24,
          height: 13,
          ellipsis: true,
        });
    });
  }

  /**
   * Draws a compact cost summary box.
   */
  private drawCostsBox(
    doc: PDFKit.PDFDocument,
    rows: Array<[string, string]>,
    total: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    doc.roundedRect(x, y, width, height, 8).stroke('#d1d5db');

    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor('#6b7280')
      .text('COSTOS', x + 14, y + 12, {
        characterSpacing: 0.8,
      });

    rows.forEach(([label, value], index) => {
      this.drawCostLine(
        doc,
        label,
        value,
        x + 14,
        y + 30 + index * 18,
        width - 28,
      );
    });

    doc
      .moveTo(x + 14, y + 66)
      .lineTo(x + width - 14, y + 66)
      .stroke('#d1d5db');

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111827')
      .text('Total', x + 14, y + 72)
      .fontSize(12)
      .fillColor('#dc2626')
      .text(total, x + 86, y + 72, {
        width: width - 100,
        align: 'right',
      });
  }

  /**
   * Draws one cost line.
   */
  private drawCostLine(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
  ): void {
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#374151')
      .text(label, x, y);

    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#111827')
      .text(value, x + 74, y, {
        width: width - 74,
        align: 'right',
      });
  }

  /**
   * Draws a signature line at the bottom of the receipt.
   */
  private drawSignatureLine(
    doc: PDFKit.PDFDocument,
    label: string,
    x: number,
    y: number,
    width: number,
  ): void {
    doc.moveTo(x, y).lineTo(x + width, y).stroke('#6b7280');

    doc
      .font('Helvetica-Bold')
      .fontSize(6.8)
      .fillColor('#6b7280')
      .text(label.toUpperCase(), x, y + 8, {
        width,
        align: 'center',
        characterSpacing: 0.6,
      });
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
