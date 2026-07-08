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
import { CreateSupplierCategoryDto } from './dto/create-supplier-category.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { FindSupplierCategoriesQueryDto } from './dto/find-supplier-categories-query.dto';
import { FindSuppliersQueryDto } from './dto/find-suppliers-query.dto';
import { RestoreSupplierDto } from './dto/restore-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
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
