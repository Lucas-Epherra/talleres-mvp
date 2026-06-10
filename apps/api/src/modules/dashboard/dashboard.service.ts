import { Injectable } from '@nestjs/common';
import { WorkOrderStatus } from '@prisma/client';
import { DEMO_WORKSHOP_ID } from '../../common/constants/demo-workshop.constant';
import { PrismaService } from '../../prisma/prisma.service';

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
  async getSummary() {
    const [
      totalCustomers,
      totalVehicles,
      totalWorkOrders,
      activeVehicles,
      statusGroups,
      latestWorkOrders,
    ] = await Promise.all([
      this.prisma.customer.count({
        where: {
          workshopId: DEMO_WORKSHOP_ID,
        },
      }),
      this.prisma.vehicle.count({
        where: {
          workshopId: DEMO_WORKSHOP_ID,
        },
      }),
      this.prisma.workOrder.count({
        where: {
          workshopId: DEMO_WORKSHOP_ID,
        },
      }),
      this.prisma.workOrder.findMany({
        where: {
          workshopId: DEMO_WORKSHOP_ID,
          status: {
            in: [
              WorkOrderStatus.PENDING,
              WorkOrderStatus.IN_PROGRESS,
              WorkOrderStatus.READY,
            ],
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
          workshopId: DEMO_WORKSHOP_ID,
        },
        _count: {
          status: true,
        },
      }),
      this.prisma.workOrder.findMany({
        where: {
          workshopId: DEMO_WORKSHOP_ID,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 6,
        select: {
          id: true,
          orderNumber: true,
          reportedIssue: true,
          status: true,
          entryMileage: true,
          estimatedTotal: true,
          finalTotal: true,
          entryDate: true,
          deliveryDate: true,
          createdAt: true,
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
        },
      }),
    ]);

    const statusCounts = this.mapStatusCounts(statusGroups);

    return {
      totals: {
        customers: totalCustomers,
        vehicles: totalVehicles,
        workOrders: totalWorkOrders,
        vehiclesInWorkshop: activeVehicles.length,
      },
      workOrders: {
        pending: statusCounts.PENDING,
        inProgress: statusCounts.IN_PROGRESS,
        ready: statusCounts.READY,
        delivered: statusCounts.DELIVERED,
        active:
          statusCounts.PENDING + statusCounts.IN_PROGRESS + statusCounts.READY,
      },
      latestWorkOrders,
    };
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
    };

    return groups.reduce<Record<WorkOrderStatus, number>>((acc, group) => {
      acc[group.status] = group._count.status;

      return acc;
    }, initialStatusCounts);
  }
}