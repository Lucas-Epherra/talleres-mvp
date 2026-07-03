import { Injectable } from '@nestjs/common';
import { AppointmentStatus, Prisma, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const STALE_IN_PROGRESS_DAYS = 7;
const PENDING_ATTENTION_DAYS = 3;
const UPCOMING_APPOINTMENTS_DAYS = 7;


const dashboardWorkOrderSelect = {
  id: true,
  orderNumber: true,
  reportedIssue: true,
  diagnosis: true,
  workDone: true,
  status: true,
  entryMileage: true,
  estimatedTotal: true,
  finalTotal: true,
  laborCost: true,
  partsCost: true,
  entryDate: true,
  deliveryDate: true,
  createdAt: true,
  updatedAt: true,
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
        },
      },
    },
  },
} satisfies Prisma.WorkOrderSelect;

const dashboardAppointmentSelect = {
  id: true,
  title: true,
  description: true,
  scheduledStart: true,
  scheduledEnd: true,
  status: true,
  customer: {
    select: {
      id: true,
      fullName: true,
      phone: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      licensePlate: true,
      brand: true,
      model: true,
    },
  },
  workOrder: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
    },
  },
} satisfies Prisma.AppointmentSelect;

const dashboardReceiptSelect = {
  id: true,
  receiptNumber: true,
  issuedAt: true,
  total: true,
  laborCost: true,
  partsCost: true,
  emailTo: true,
  emailedAt: true,
  customerSnapshot: true,
  vehicleSnapshot: true,
  workSnapshot: true,
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
} satisfies Prisma.ReceiptSelect;

const dashboardEventSelect = {
  id: true,
  type: true,
  fromStatus: true,
  toStatus: true,
  description: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
    },
  },
  workOrder: {
    select: {
      id: true,
      orderNumber: true,
      reportedIssue: true,
      status: true,
      vehicle: {
        select: {
          id: true,
          licensePlate: true,
          brand: true,
          model: true,
          customer: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.WorkOrderEventSelect;

/**
 * Handles dashboard summary queries.
 *
 * This service aggregates operational data for the current workshop. All
 * queries are scoped by workshopId to preserve multi-tenant compatibility.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the operational summary used by the dashboard screen.
   */
  async getSummary(workshopId: string) {
    const now = new Date();
    const todayRange = this.getArgentinaDayRange(now);
    const monthRange = this.getArgentinaMonthRange(now);
    const staleInProgressBefore = this.subtractDays(
      now,
      STALE_IN_PROGRESS_DAYS,
    );
    const pendingAttentionBefore = this.subtractDays(
      now,
      PENDING_ATTENTION_DAYS,
    );
    const upcomingAppointmentsUntil = this.addDays(
      now,
      UPCOMING_APPOINTMENTS_DAYS,
    );

    const [
      totalCustomers,
      totalVehicles,
      totalWorkOrders,
      activeVehicles,
      statusGroups,
      deliveredThisMonth,
      cancelledThisMonth,
      receiptsThisMonth,
      receiptsThisMonthTotals,
      todayAppointmentsCount,
      todayAppointments,
      upcomingAppointments,
      attentionWorkOrders,
      latestWorkOrders,
      latestReceipts,
      latestEvents,
      readyForDelivery,
      deliveredWithoutReceipt,
      staleInProgress,
      pendingNeedsAttention,
      overdueAppointments,
    ] = await Promise.all([
      this.prisma.customer.count({
        where: {
          workshopId,
          archivedAt: null,
        },
      }),
      this.prisma.vehicle.count({
        where: {
          workshopId,
          archivedAt: null,
        },
      }),
      this.prisma.workOrder.count({
        where: {
          workshopId,
        },
      }),
      this.prisma.workOrder.findMany({
        where: {
          workshopId,
          status: {
            in: [
              WorkOrderStatus.PENDING,
              WorkOrderStatus.IN_PROGRESS,
              WorkOrderStatus.READY,
            ],
          },
          vehicle: {
            archivedAt: null,
          },
        },
        distinct: ['vehicleId'],
        select: {
          vehicleId: true,
        },
      }),
      this.prisma.workOrder.groupBy({
        by: ['status'],
        where: {
          workshopId,
        },
        _count: {
          status: true,
        },
      }),
      this.prisma.workOrder.count({
        where: {
          workshopId,
          status: WorkOrderStatus.DELIVERED,
          deliveryDate: {
            gte: monthRange.start,
            lt: monthRange.end,
          },
        },
      }),
      this.prisma.workOrder.count({
        where: {
          workshopId,
          status: WorkOrderStatus.CANCELLED,
          updatedAt: {
            gte: monthRange.start,
            lt: monthRange.end,
          },
        },
      }),
      this.prisma.receipt.count({
        where: {
          workshopId,
          issuedAt: {
            gte: monthRange.start,
            lt: monthRange.end,
          },
        },
      }),
      this.prisma.receipt.aggregate({
        where: {
          workshopId,
          issuedAt: {
            gte: monthRange.start,
            lt: monthRange.end,
          },
        },
        _sum: {
          total: true,
          laborCost: true,
          partsCost: true,
        },
      }),
      this.prisma.appointment.count({
        where: {
          workshopId,
          scheduledStart: {
            gte: todayRange.start,
            lt: todayRange.end,
          },
          status: {
            not: AppointmentStatus.CANCELLED,
          },
        },
      }),
      this.prisma.appointment.findMany({
        where: {
          workshopId,
          scheduledStart: {
            gte: todayRange.start,
            lt: todayRange.end,
          },
          status: {
            not: AppointmentStatus.CANCELLED,
          },
        },
        orderBy: {
          scheduledStart: 'asc',
        },
        take: 6,
        select: this.getDashboardAppointmentSelect(),
      }),
      this.prisma.appointment.findMany({
        where: {
          workshopId,
          scheduledStart: {
            gte: now,
            lt: upcomingAppointmentsUntil,
          },
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
          },
        },
        orderBy: {
          scheduledStart: 'asc',
        },
        take: 6,
        select: this.getDashboardAppointmentSelect(),
      }),
      this.prisma.workOrder.findMany({
        where: {
          workshopId,
          status: {
            in: [
              WorkOrderStatus.READY,
              WorkOrderStatus.IN_PROGRESS,
              WorkOrderStatus.PENDING,
            ],
          },
        },
        orderBy: [
          {
            updatedAt: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
        take: 6,
        select: this.getDashboardWorkOrderSelect(),
      }),
      this.prisma.workOrder.findMany({
        where: {
          workshopId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 6,
        select: this.getDashboardWorkOrderSelect(),
      }),
      this.prisma.receipt.findMany({
        where: {
          workshopId,
        },
        orderBy: {
          issuedAt: 'desc',
        },
        take: 5,
        select: this.getDashboardReceiptSelect(),
      }),
      this.prisma.workOrderEvent.findMany({
        where: {
          workshopId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
        select: this.getDashboardEventSelect(),
      }),
      this.prisma.workOrder.findMany({
        where: {
          workshopId,
          status: WorkOrderStatus.READY,
        },
        orderBy: {
          updatedAt: 'asc',
        },
        take: 3,
        select: this.getDashboardWorkOrderSelect(),
      }),
      this.prisma.workOrder.findMany({
        where: {
          workshopId,
          status: WorkOrderStatus.DELIVERED,
          receipts: {
            none: {},
          },
        },
        orderBy: {
          deliveryDate: 'desc',
        },
        take: 3,
        select: this.getDashboardWorkOrderSelect(),
      }),
      this.prisma.workOrder.findMany({
        where: {
          workshopId,
          status: WorkOrderStatus.IN_PROGRESS,
          updatedAt: {
            lte: staleInProgressBefore,
          },
        },
        orderBy: {
          updatedAt: 'asc',
        },
        take: 3,
        select: this.getDashboardWorkOrderSelect(),
      }),
      this.prisma.workOrder.findMany({
        where: {
          workshopId,
          status: WorkOrderStatus.PENDING,
          createdAt: {
            lte: pendingAttentionBefore,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 3,
        select: this.getDashboardWorkOrderSelect(),
      }),
      this.prisma.appointment.findMany({
        where: {
          workshopId,
          scheduledStart: {
            lt: now,
          },
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
          },
        },
        orderBy: {
          scheduledStart: 'asc',
        },
        take: 3,
        select: this.getDashboardAppointmentSelect(),
      }),
    ]);

    const statusCounts = this.mapStatusCounts(statusGroups);
    const activeWorkOrders =
      statusCounts.PENDING + statusCounts.IN_PROGRESS + statusCounts.READY;
    const alerts = this.buildAlerts({
      readyForDelivery,
      deliveredWithoutReceipt,
      staleInProgress,
      pendingNeedsAttention,
      overdueAppointments,
    });

    return {
      generatedAt: now.toISOString(),
      today: {
        start: todayRange.start.toISOString(),
        end: todayRange.end.toISOString(),
      },
      month: {
        start: monthRange.start.toISOString(),
        end: monthRange.end.toISOString(),
      },
      totals: {
        customers: totalCustomers,
        vehicles: totalVehicles,
        workOrders: totalWorkOrders,
        vehiclesInWorkshop: activeVehicles.length,
      },
      summaryCards: {
        customers: totalCustomers,
        vehicles: totalVehicles,
        activeWorkOrders,
        monthlyInternalRevenue: this.formatDecimalString(
          receiptsThisMonthTotals._sum.total,
        ),
      },
      workOrders: {
        pending: statusCounts.PENDING,
        inProgress: statusCounts.IN_PROGRESS,
        ready: statusCounts.READY,
        delivered: statusCounts.DELIVERED,
        cancelled: statusCounts.CANCELLED,
        active: activeWorkOrders,
        deliveredThisMonth,
        cancelledThisMonth,
      },
      workflow: [
        {
          status: WorkOrderStatus.PENDING,
          label: 'Pendientes',
          count: statusCounts.PENDING,
        },
        {
          status: WorkOrderStatus.IN_PROGRESS,
          label: 'En progreso',
          count: statusCounts.IN_PROGRESS,
        },
        {
          status: WorkOrderStatus.READY,
          label: 'Listas',
          count: statusCounts.READY,
        },
        {
          status: WorkOrderStatus.DELIVERED,
          label: 'Entregadas',
          count: statusCounts.DELIVERED,
        },
        {
          status: WorkOrderStatus.CANCELLED,
          label: 'Anuladas',
          count: statusCounts.CANCELLED,
        },
      ],
      appointments: {
        todayCount: todayAppointmentsCount,
        today: todayAppointments,
        upcoming: upcomingAppointments,
      },
      receipts: {
        thisMonthCount: receiptsThisMonth,
        thisMonthTotal: this.formatDecimalString(
          receiptsThisMonthTotals._sum.total,
        ),
        thisMonthLaborTotal: this.formatDecimalString(
          receiptsThisMonthTotals._sum.laborCost,
        ),
        thisMonthPartsTotal: this.formatDecimalString(
          receiptsThisMonthTotals._sum.partsCost,
        ),
        latest: latestReceipts,
      },
      alerts,
      alertCount: alerts.length,
      attentionWorkOrders,
      latestWorkOrders,
      recentWorkOrders: latestWorkOrders,
      recentReceipts: latestReceipts,
      recentActivity: {
        workOrderEvents: latestEvents,
        workOrders: latestWorkOrders,
        receipts: latestReceipts,
        appointments: upcomingAppointments,
      },
    };
  }

  /**
   * Returns the shared select shape for dashboard work order previews.
   */
  private getDashboardWorkOrderSelect() {
    return dashboardWorkOrderSelect;
  }

  /**
   * Returns the select shape for dashboard appointment previews.
   */
  private getDashboardAppointmentSelect() {
    return dashboardAppointmentSelect;
  }

  /**
   * Returns the select shape for dashboard receipt previews.
   */
  private getDashboardReceiptSelect() {
    return dashboardReceiptSelect;
  }

  /**
   * Returns the select shape for recent work order events.
   */
  private getDashboardEventSelect() {
    return dashboardEventSelect;
  }

  /**
   * Builds human-readable alerts for the dashboard.
   */
  private buildAlerts({
    readyForDelivery,
    deliveredWithoutReceipt,
    staleInProgress,
    pendingNeedsAttention,
    overdueAppointments,
  }: {
    readyForDelivery: Array<DashboardWorkOrderPreview>;
    deliveredWithoutReceipt: Array<DashboardWorkOrderPreview>;
    staleInProgress: Array<DashboardWorkOrderPreview>;
    pendingNeedsAttention: Array<DashboardWorkOrderPreview>;
    overdueAppointments: Array<DashboardAppointmentPreview>;
  }): DashboardAlert[] {
    return [
      ...readyForDelivery.map((workOrder) => ({
        id: `ready-${workOrder.id}`,
        type: 'WORK_ORDER_READY' as const,
        severity: 'success' as const,
        title: `Orden #${workOrder.orderNumber} lista para entregar`,
        description: `${workOrder.vehicle.customer.fullName} · ${workOrder.vehicle.licensePlate} · ${workOrder.vehicle.brand} ${workOrder.vehicle.model}`,
        href: `/work-orders/${workOrder.id}`,
        createdAt: workOrder.updatedAt,
      })),
      ...deliveredWithoutReceipt.map((workOrder) => ({
        id: `delivered-without-receipt-${workOrder.id}`,
        type: 'DELIVERED_WITHOUT_RECEIPT' as const,
        severity: 'warning' as const,
        title: `Orden #${workOrder.orderNumber} entregada sin recibo`,
        description: `${workOrder.vehicle.customer.fullName} · ${workOrder.vehicle.licensePlate}`,
        href: `/work-orders/${workOrder.id}`,
        createdAt: workOrder.deliveryDate ?? workOrder.updatedAt,
      })),
      ...staleInProgress.map((workOrder) => ({
        id: `stale-in-progress-${workOrder.id}`,
        type: 'STALE_IN_PROGRESS' as const,
        severity: 'warning' as const,
        title: `Orden #${workOrder.orderNumber} en progreso hace varios días`,
        description: `${workOrder.vehicle.customer.fullName} · ${workOrder.reportedIssue}`,
        href: `/work-orders/${workOrder.id}`,
        createdAt: workOrder.updatedAt,
      })),
      ...pendingNeedsAttention.map((workOrder) => ({
        id: `pending-attention-${workOrder.id}`,
        type: 'PENDING_NEEDS_ATTENTION' as const,
        severity: 'danger' as const,
        title: `Orden #${workOrder.orderNumber} pendiente de avance`,
        description: `${workOrder.vehicle.customer.fullName} · ${workOrder.vehicle.licensePlate}`,
        href: `/work-orders/${workOrder.id}`,
        createdAt: workOrder.createdAt,
      })),
      ...overdueAppointments.map((appointment) => ({
        id: `overdue-appointment-${appointment.id}`,
        type: 'OVERDUE_APPOINTMENT' as const,
        severity: 'danger' as const,
        title: `Turno vencido: ${appointment.title}`,
        description:
          appointment.customer?.fullName ??
          appointment.vehicle?.licensePlate ??
          'Turno sin cliente asociado',
        href: '/appointments',
        createdAt: appointment.scheduledStart,
      })),
    ]
      .sort((firstAlert, secondAlert) => {
        return (
          new Date(secondAlert.createdAt).getTime() -
          new Date(firstAlert.createdAt).getTime()
        );
      })
      .slice(0, 7);
  }

  /**
   * Converts Prisma groupBy results into a stable status count object.
   */
  private mapStatusCounts(
    groups: Array<{
      status: WorkOrderStatus;
      _count: {
        status: number;
      };
    }>,
  ): Record<WorkOrderStatus, number> {
    const initialStatusCounts: Record<WorkOrderStatus, number> = {
      [WorkOrderStatus.PENDING]: 0,
      [WorkOrderStatus.IN_PROGRESS]: 0,
      [WorkOrderStatus.READY]: 0,
      [WorkOrderStatus.DELIVERED]: 0,
      [WorkOrderStatus.CANCELLED]: 0,
    };

    return groups.reduce<Record<WorkOrderStatus, number>>((acc, group) => {
      acc[group.status] = group._count.status;

      return acc;
    }, initialStatusCounts);
  }

  /**
   * Formats nullable Prisma decimal values as strings for stable JSON output.
   */
  private formatDecimalString(value: Prisma.Decimal | null): string {
    return value?.toString() ?? '0';
  }

  /**
   * Returns the current day range using Argentina local time.
   */
  private getArgentinaDayRange(date: Date): DateRange {
    const parts = this.getArgentinaDateParts(date);
    const start = new Date(
      Date.UTC(parts.year, parts.month - 1, parts.day, 3, 0, 0, 0),
    );
    const end = this.addDays(start, 1);

    return {
      start,
      end,
    };
  }

  /**
   * Returns the current month range using Argentina local time.
   */
  private getArgentinaMonthRange(date: Date): DateRange {
    const parts = this.getArgentinaDateParts(date);
    const start = new Date(Date.UTC(parts.year, parts.month - 1, 1, 3, 0, 0, 0));
    const end = new Date(Date.UTC(parts.year, parts.month, 1, 3, 0, 0, 0));

    return {
      start,
      end,
    };
  }

  /**
   * Extracts date parts for Argentina without adding a date utility dependency.
   */
  private getArgentinaDateParts(date: Date): {
    year: number;
    month: number;
    day: number;
  } {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: ARGENTINA_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = Number(parts.find((part) => part.type === 'year')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    const day = Number(parts.find((part) => part.type === 'day')?.value);

    return {
      year,
      month,
      day,
    };
  }

  /**
   * Adds days to a date.
   */
  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  /**
   * Subtracts days from a date.
   */
  private subtractDays(date: Date, days: number): Date {
    return this.addDays(date, -days);
  }
}

type DateRange = {
  start: Date;
  end: Date;
};

type DashboardWorkOrderPreview = Prisma.WorkOrderGetPayload<{
  select: typeof dashboardWorkOrderSelect;
}>;

type DashboardAppointmentPreview = Prisma.AppointmentGetPayload<{
  select: typeof dashboardAppointmentSelect;
}>;

type DashboardAlert = {
  id: string;
  type:
    | 'WORK_ORDER_READY'
    | 'DELIVERED_WITHOUT_RECEIPT'
    | 'STALE_IN_PROGRESS'
    | 'PENDING_NEEDS_ATTENTION'
    | 'OVERDUE_APPOINTMENT';
  severity: 'success' | 'warning' | 'danger';
  title: string;
  description: string;
  href: string;
  createdAt: Date;
};
