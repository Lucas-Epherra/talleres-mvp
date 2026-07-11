import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ArchiveSupplierDto } from './dto/archive-supplier.dto';
import { ArchiveSupplierPartDto } from './dto/archive-supplier-part.dto';
import { CreateSupplierCategoryDto } from './dto/create-supplier-category.dto';
import { CreateSupplierPartDto } from './dto/create-supplier-part.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { FindSupplierCategoriesQueryDto } from './dto/find-supplier-categories-query.dto';
import { FindSupplierPartsQueryDto } from './dto/find-supplier-parts-query.dto';
import { FindSupplierPaymentsQueryDto } from './dto/find-supplier-payments-query.dto';
import { FindSuppliersQueryDto } from './dto/find-suppliers-query.dto';
import { RestoreSupplierDto } from './dto/restore-supplier.dto';
import { RestoreSupplierPartDto } from './dto/restore-supplier-part.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { UpdateSupplierPaymentDto } from './dto/update-supplier-payment.dto';
import { UpdateSupplierPartDto } from './dto/update-supplier-part.dto';
import { VoidSupplierPaymentDto } from './dto/void-supplier-payment.dto';
import { SuppliersService } from './suppliers.service';

/**
 * HTTP controller for supplier operations.
 *
 * All routes are authenticated and scoped by the authenticated user's workshop.
 */
@UseGuards(AuthGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  /**
   * Lists paginated suppliers with financial metrics for the current workshop.
   */
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: FindSuppliersQueryDto) {
    return this.suppliersService.findAll(user.workshopId, query);
  }

  /**
   * Lists supplier categories used by the current workshop.
   */
  @Get('categories')
  findCategories(
    @CurrentUser() user: AuthUser,
    @Query() query: FindSupplierCategoriesQueryDto,
  ) {
    return this.suppliersService.findCategories(user.workshopId, query);
  }

  /**
   * Creates a supplier category for the current workshop.
   */
  @Post('categories')
  createCategory(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSupplierCategoryDto,
  ) {
    return this.suppliersService.createCategory(user.workshopId, dto);
  }

  /**
   * Lists catalog parts for one supplier.
   */
  @Get(':supplierId/parts')
  findParts(
    @CurrentUser() user: AuthUser,
    @Param('supplierId') supplierId: string,
    @Query() query: FindSupplierPartsQueryDto,
  ) {
    return this.suppliersService.findParts(user.workshopId, supplierId, query);
  }

  /**
   * Creates a catalog part for one supplier.
   */
  @Post(':supplierId/parts')
  createPart(
    @CurrentUser() user: AuthUser,
    @Param('supplierId') supplierId: string,
    @Body() dto: CreateSupplierPartDto,
  ) {
    return this.suppliersService.createPart(
      user.workshopId,
      user.id,
      supplierId,
      dto,
    );
  }

  /**
   * Updates a catalog part for one supplier.
   */
  @Patch(':supplierId/parts/:partId')
  updatePart(
    @CurrentUser() user: AuthUser,
    @Param('supplierId') supplierId: string,
    @Param('partId') partId: string,
    @Body() dto: UpdateSupplierPartDto,
  ) {
    return this.suppliersService.updatePart(
      user.workshopId,
      user.id,
      supplierId,
      partId,
      dto,
    );
  }

  /**
   * Archives a catalog part without deleting historical order lines.
   */
  @Patch(':supplierId/parts/:partId/archive')
  archivePart(
    @CurrentUser() user: AuthUser,
    @Param('supplierId') supplierId: string,
    @Param('partId') partId: string,
    @Body() dto: ArchiveSupplierPartDto,
  ) {
    return this.suppliersService.archivePart(
      user.workshopId,
      user.id,
      supplierId,
      partId,
      dto,
    );
  }

  /**
   * Restores an archived catalog part.
   */
  @Patch(':supplierId/parts/:partId/restore')
  restorePart(
    @CurrentUser() user: AuthUser,
    @Param('supplierId') supplierId: string,
    @Param('partId') partId: string,
    @Body() dto: RestoreSupplierPartDto,
  ) {
    return this.suppliersService.restorePart(
      user.workshopId,
      user.id,
      supplierId,
      partId,
      dto,
    );
  }


  /**
   * Lists payments registered for one supplier.
   */
  @Get(':supplierId/payments')
  findPayments(
    @CurrentUser() user: AuthUser,
    @Param('supplierId') supplierId: string,
    @Query() query: FindSupplierPaymentsQueryDto,
  ) {
    return this.suppliersService.findPayments(
      user.workshopId,
      supplierId,
      query,
    );
  }

  /**
   * Registers a payment made to one supplier.
   */
  @Post(':supplierId/payments')
  createPayment(
    @CurrentUser() user: AuthUser,
    @Param('supplierId') supplierId: string,
    @Body() dto: CreateSupplierPaymentDto,
  ) {
    return this.suppliersService.createPayment(
      user.workshopId,
      user.id,
      supplierId,
      dto,
    );
  }

  /**
   * Corrects an active supplier payment.
   */
  @Patch(':supplierId/payments/:paymentId')
  updatePayment(
    @CurrentUser() user: AuthUser,
    @Param('supplierId') supplierId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdateSupplierPaymentDto,
  ) {
    return this.suppliersService.updatePayment(
      user.workshopId,
      user.id,
      supplierId,
      paymentId,
      dto,
    );
  }

  /**
   * Voids a supplier payment without deleting financial history.
   */
  @Patch(':supplierId/payments/:paymentId/void')
  voidPayment(
    @CurrentUser() user: AuthUser,
    @Param('supplierId') supplierId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: VoidSupplierPaymentDto,
  ) {
    return this.suppliersService.voidPayment(
      user.workshopId,
      user.id,
      supplierId,
      paymentId,
      dto,
    );
  }

  /**
   * Returns one supplier profile with metrics, categories and recent activity.
   */
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.suppliersService.findOne(user.workshopId, id);
  }

  /**
   * Creates a new supplier inside the authenticated workshop.
   */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(user.workshopId, user.id, dto);
  }

  /**
   * Updates an existing supplier if it belongs to the authenticated workshop.
   */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(user.workshopId, user.id, id, dto);
  }

  /**
   * Archives a supplier while keeping its historical purchases and payments.
   */
  @Patch(':id/archive')
  archive(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ArchiveSupplierDto,
  ) {
    return this.suppliersService.archive(user.workshopId, user.id, id, dto);
  }

  /**
   * Restores an archived supplier to the operational supplier list.
   */
  @Patch(':id/restore')
  restore(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RestoreSupplierDto,
  ) {
    return this.suppliersService.restore(user.workshopId, user.id, id, dto);
  }
}
