import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkOrderStatus } from '@prisma/client';
import PDFDocument = require('pdfkit');
import sharp = require('sharp');
import { Resend } from 'resend';
import { PrismaService } from '../../prisma/prisma.service';
import { FindReceiptsQueryDto } from './dto/find-receipts-query.dto';
import { IssueReceiptDto } from './dto/issue-receipt.dto';
import { SendReceiptEmailDto } from './dto/send-receipt-email.dto';

const INITIAL_RECEIPT_NUMBER = 1;
const CREATE_RECEIPT_MAX_ATTEMPTS = 3;
const DEFAULT_RECEIPTS_PAGE = 1;
const DEFAULT_RECEIPTS_LIMIT = 10;
const MAX_RECEIPTS_LIMIT = 50;
const ARGENTINA_UTC_OFFSET_HOURS = 3;
const PDF_LOGO_FETCH_TIMEOUT_MS = 3000;

const receiptInclude = {
  workshop: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      logoUrl: true,
      businessHours: true,
      description: true,
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
      phone: true,
      email: true,
      address: true,
      logoUrl: true,
      businessHours: true,
      description: true,
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

type ReceiptEmailStatus = 'sent' | 'not_sent';

type NormalizedFindReceiptsQuery = {
  page: number;
  limit: number;
  offset: number;
  search: string | null;
  workOrderId?: string;
  emailStatus?: ReceiptEmailStatus;
  issuedFrom: Date | null;
  issuedTo: Date | null;
};

type ReceiptIdRow = {
  id: string;
};

type ReceiptCountRow = {
  count: bigint | number | string;
};

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
   * Lists receipts for the authenticated workshop using pagination and filters.
   */
  async findAll(workshopId: string, query: FindReceiptsQueryDto = {}) {
    const normalizedQuery = this.normalizeFindReceiptsQuery(query);
    const whereSql = this.buildReceiptsWhereSql(workshopId, normalizedQuery);

    const countRows = await this.prisma.$queryRaw<ReceiptCountRow[]>(
      Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM receipts r
        WHERE ${whereSql}
      `,
    );
    const total = Number(countRows[0]?.count ?? 0);

    const idRows = await this.prisma.$queryRaw<ReceiptIdRow[]>(
      Prisma.sql`
        SELECT r.id
        FROM receipts r
        WHERE ${whereSql}
        ORDER BY r.issued_at DESC, r.receipt_number DESC
        LIMIT ${normalizedQuery.limit}
        OFFSET ${normalizedQuery.offset}
      `,
    );

    const receiptIds = idRows.map((row) => row.id);

    if (receiptIds.length === 0) {
      return {
        data: [],
        meta: this.buildReceiptsPagination(normalizedQuery, total),
      };
    }

    const receipts = await this.prisma.receipt.findMany({
      where: {
        id: {
          in: receiptIds,
        },
        workshopId,
      },
      include: receiptInclude,
    });
    const receiptsById = new Map(
      receipts.map((receipt) => [receipt.id, receipt]),
    );
    const orderedReceipts = receiptIds
      .map((id) => receiptsById.get(id))
      .filter((receipt): receipt is ReceiptWithRelations => Boolean(receipt));

    return {
      data: orderedReceipts,
      meta: this.buildReceiptsPagination(normalizedQuery, total),
    };
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
   * Normalizes list query params into safe backend defaults.
   */
  private normalizeFindReceiptsQuery(
    query: FindReceiptsQueryDto,
  ): NormalizedFindReceiptsQuery {
    const page = this.parsePositiveInteger(
      query.page,
      DEFAULT_RECEIPTS_PAGE,
      Number.MAX_SAFE_INTEGER,
    );
    const limit = this.parsePositiveInteger(
      query.limit,
      DEFAULT_RECEIPTS_LIMIT,
      MAX_RECEIPTS_LIMIT,
    );

    return {
      page,
      limit,
      offset: (page - 1) * limit,
      search: this.normalizeReceiptSearchTerm(query.search),
      workOrderId: query.workOrderId,
      emailStatus: query.emailStatus,
      issuedFrom: this.parseArgentinaDateBoundary(query.issuedFrom, 'start'),
      issuedTo: this.parseArgentinaDateBoundary(query.issuedTo, 'end'),
    };
  }

  /**
   * Builds the SQL filter used by the paginated receipts list.
   *
   * JSON snapshot search is intentionally done in SQL because receipt customer,
   * vehicle and work data are frozen in JSON columns.
   */
  private buildReceiptsWhereSql(
    workshopId: string,
    query: NormalizedFindReceiptsQuery,
  ): Prisma.Sql {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`r.workshop_id = ${workshopId}`,
    ];

    if (query.workOrderId) {
      conditions.push(Prisma.sql`r.work_order_id = ${query.workOrderId}`);
    }

    if (query.emailStatus === 'sent') {
      conditions.push(Prisma.sql`r.emailed_at IS NOT NULL`);
    }

    if (query.emailStatus === 'not_sent') {
      conditions.push(Prisma.sql`r.emailed_at IS NULL`);
    }

    if (query.issuedFrom) {
      conditions.push(Prisma.sql`r.issued_at >= ${query.issuedFrom}`);
    }

    if (query.issuedTo) {
      conditions.push(Prisma.sql`r.issued_at <= ${query.issuedTo}`);
    }

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      const compactSearchPattern = `%${query.search.replace(/[#\s-]/g, '')}%`;

      conditions.push(Prisma.sql`
        (
          r.receipt_number::text ILIKE ${searchPattern}
          OR (r.work_snapshot->>'orderNumber') ILIKE ${searchPattern}
          OR (r.work_snapshot->>'orderNumber') ILIKE ${compactSearchPattern}
          OR COALESCE(r.email_to, '') ILIKE ${searchPattern}
          OR COALESCE(r.notes, '') ILIKE ${searchPattern}
          OR COALESCE(r.customer_snapshot->>'fullName', '') ILIKE ${searchPattern}
          OR COALESCE(r.customer_snapshot->>'phone', '') ILIKE ${searchPattern}
          OR COALESCE(r.customer_snapshot->>'email', '') ILIKE ${searchPattern}
          OR COALESCE(r.vehicle_snapshot->>'licensePlate', '') ILIKE ${searchPattern}
          OR COALESCE(r.vehicle_snapshot->>'brand', '') ILIKE ${searchPattern}
          OR COALESCE(r.vehicle_snapshot->>'model', '') ILIKE ${searchPattern}
        )
      `);
    }

    return Prisma.join(conditions, ' AND ');
  }

  /**
   * Builds pagination metadata for the list endpoint.
   */
  private buildReceiptsPagination(
    query: NormalizedFindReceiptsQuery,
    total: number,
  ) {
    const totalPages = Math.max(Math.ceil(total / query.limit), 1);

    return {
      page: query.page,
      limit: query.limit,
      totalItems: total,
      totalPages,
      hasPreviousPage: query.page > 1,
      hasNextPage: query.page < totalPages,
    };
  }

  /**
   * Parses numeric pagination params without trusting query-string input.
   */
  private parsePositiveInteger(
    value: string | undefined,
    fallback: number,
    max: number,
  ): number {
    if (!value) {
      return fallback;
    }

    const numericValue = Number(value);

    if (!Number.isInteger(numericValue) || numericValue < 1) {
      return fallback;
    }

    return Math.min(numericValue, max);
  }

  /**
   * Normalizes a free-text search query for receipt search.
   */
  private normalizeReceiptSearchTerm(value: string | undefined): string | null {
    const normalizedValue = value?.trim().replace(/\s+/g, ' ');

    if (!normalizedValue) {
      return null;
    }

    return normalizedValue.slice(0, 120);
  }

  /**
   * Converts a date filter into UTC bounds for Argentina local calendar days.
   */
  private parseArgentinaDateBoundary(
    value: string | undefined,
    boundary: 'start' | 'end',
  ): Date | null {
    if (!value) {
      return null;
    }

    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]);
      const day = Number(dateOnlyMatch[3]);

      if (boundary === 'start') {
        return new Date(
          Date.UTC(year, month - 1, day, ARGENTINA_UTC_OFFSET_HOURS),
        );
      }

      return new Date(
        Date.UTC(
          year,
          month - 1,
          day + 1,
          ARGENTINA_UTC_OFFSET_HOURS - 1,
          59,
          59,
          999,
        ),
      );
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('El rango de fechas no es válido.');
    }

    return date;
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
  private async renderReceiptPdf(
    receipt: ReceiptWithRelations,
  ): Promise<Buffer> {
    const logoBuffer = await this.fetchReceiptLogoPng(receipt.workshop.logoUrl);

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

      this.drawReceiptPdf(doc, receipt, logoBuffer);

      doc.end();
    });
  }

  /**
   * Draws the PDF content.
   */
  private drawReceiptPdf(
    doc: PDFKit.PDFDocument,
    receipt: ReceiptWithRelations,
    logoBuffer: Buffer | null,
  ): void {
    const customer = this.getCustomerSnapshot(receipt);
    const vehicle = this.getVehicleSnapshot(receipt);
    const work = this.getWorkSnapshot(receipt);
    const receiptNumber = this.formatReceiptNumber(receipt.receiptNumber);
    const workshopContactLines = this.buildWorkshopContactLines(
      receipt.workshop,
    );

    const headerTextX = logoBuffer ? 124 : 56;
    const headerTextWidth = logoBuffer ? 192 : 260;
    const clientSectionY =
      logoBuffer || workshopContactLines.length > 1
        ? 166
        : workshopContactLines.length > 0
          ? 154
          : 138;
    const vehicleSectionY = clientSectionY + 108;
    const workSectionY = vehicleSectionY + 108;
    const workTableY = workSectionY + 22;
    const summaryY = workTableY + 198;
    const summaryHeight = 86;

    doc.rect(36, 36, 523, 770).stroke('#d1d5db');

    if (logoBuffer) {
      doc.roundedRect(56, 58, 52, 52, 8).stroke('#d1d5db');
      doc.image(logoBuffer, 62, 64, {
        fit: [40, 40],
        align: 'center',
        valign: 'center',
      });
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#111827')
      .text(receipt.workshop.name, headerTextX, 58, {
        width: headerTextWidth,
        lineBreak: false,
        ellipsis: true,
      });

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#6b7280')
      .text('Comprobante interno de servicio', headerTextX, 82, {
        width: headerTextWidth,
      });

    workshopContactLines.forEach((line, index) => {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#374151')
        .text(line, headerTextX, 98 + index * 11, {
          width: headerTextWidth,
          lineBreak: false,
          ellipsis: true,
        });
    });

    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#6b7280')
      .text(
        'No válido como factura fiscal',
        headerTextX,
        workshopContactLines.length > 0
          ? 102 + workshopContactLines.length * 11
          : 96,
        {
          width: headerTextWidth,
        },
      );

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

    this.drawSectionTitle(doc, 'Cliente', 56, clientSectionY);
    this.drawKeyValue(
      doc,
      'Nombre',
      customer.fullName,
      56,
      clientSectionY + 24,
      230,
    );
    this.drawKeyValue(
      doc,
      'Teléfono',
      customer.phone ?? 'Sin teléfono',
      300,
      clientSectionY + 24,
      220,
    );
    this.drawKeyValue(
      doc,
      'Email',
      customer.email ?? 'Sin email',
      56,
      clientSectionY + 58,
      464,
    );

    this.drawSectionTitle(doc, 'Vehículo', 56, vehicleSectionY);
    this.drawKeyValue(
      doc,
      'Patente',
      vehicle.licensePlate,
      56,
      vehicleSectionY + 24,
      140,
    );
    this.drawKeyValue(
      doc,
      'Marca',
      vehicle.brand,
      210,
      vehicleSectionY + 24,
      140,
    );
    this.drawKeyValue(
      doc,
      'Modelo',
      vehicle.model,
      364,
      vehicleSectionY + 24,
      156,
    );
    this.drawKeyValue(
      doc,
      'Año',
      vehicle.year ? String(vehicle.year) : 'Sin cargar',
      56,
      vehicleSectionY + 58,
      140,
    );
    this.drawKeyValue(
      doc,
      'Kilometraje',
      this.formatMileage(vehicle.mileage),
      210,
      vehicleSectionY + 58,
      180,
    );

    this.drawSectionTitle(doc, 'Trabajo realizado', 56, workSectionY);

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
      workTableY,
      464,
    );

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
    const workshopContactHtml = this.buildReceiptEmailWorkshopContactHtml(
      receipt.workshop,
    );
    const workshopLogoHtml = this.buildReceiptEmailWorkshopLogoHtml(
      receipt.workshop,
    );

    return `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        ${workshopLogoHtml}
        <p>Hola ${this.escapeHtml(customerName)},</p>
        <p>Te enviamos adjunto el recibo interno ${receiptNumber} correspondiente al trabajo realizado.</p>
        ${
          safeMessage
            ? `<p style="padding: 12px; border-left: 4px solid #991b1b; background: #f9fafb;">${safeMessage}</p>`
            : ''
        }
        <p>Saludos,<br /><strong>${this.escapeHtml(receipt.workshop.name)}</strong></p>
        ${workshopContactHtml}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #6b7280;">
          Este comprobante es de uso interno y no reemplaza documentación fiscal.
        </p>
      </div>
    `;
  }

  /**
   * Fetches the workshop logo and converts it into a PDFKit-compatible PNG.
   *
   * Receipt generation must never fail just because the public asset is
   * temporarily unavailable, so logo loading is treated as best-effort.
   */
  private async fetchReceiptLogoPng(logoUrl: string | null): Promise<Buffer | null> {
    if (!logoUrl) {
      return null;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(logoUrl);
    } catch {
      return null;
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      PDF_LOGO_FETCH_TIMEOUT_MS,
    );

    try {
      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
      });

      if (!response.ok) {
        return null;
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());

      return sharp(imageBuffer)
        .resize(128, 128, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Builds an optional workshop logo block for receipt emails.
   */
  private buildReceiptEmailWorkshopLogoHtml(
    workshop: ReceiptWithRelations['workshop'],
  ): string {
    if (!workshop.logoUrl) {
      return '';
    }

    return `
      <div style="margin-bottom: 16px;">
        <img
          src="${this.escapeHtml(workshop.logoUrl)}"
          alt="Logo de ${this.escapeHtml(workshop.name)}"
          width="72"
          height="72"
          style="display: block; width: 72px; height: 72px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 12px; padding: 8px;"
        />
      </div>
    `;
  }

  /**
   * Builds compact contact lines for the PDF header.
   */
  private buildWorkshopContactLines(
    workshop: ReceiptWithRelations['workshop'],
  ): string[] {
    const firstLine = [
      workshop.address,
      workshop.phone ? `Tel. ${workshop.phone}` : null,
    ]
      .filter((value): value is string => Boolean(value))
      .join(' · ');

    const secondLine = workshop.email ? `Email: ${workshop.email}` : '';

    return [firstLine, secondLine].filter(Boolean).slice(0, 2);
  }

  /**
   * Builds optional workshop contact information for receipt emails.
   */
  private buildReceiptEmailWorkshopContactHtml(
    workshop: ReceiptWithRelations['workshop'],
  ): string {
    const rows: string[] = [];

    if (workshop.address) {
      rows.push(`Dirección: ${this.escapeHtml(workshop.address)}`);
    }

    if (workshop.phone) {
      rows.push(`Teléfono: ${this.escapeHtml(workshop.phone)}`);
    }

    if (workshop.email) {
      rows.push(`Email: ${this.escapeHtml(workshop.email)}`);
    }

    if (rows.length === 0) {
      return '';
    }

    return `
      <p style="font-size: 13px; color: #4b5563;">
        ${rows.join('<br />')}
      </p>
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
