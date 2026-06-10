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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

/**
 * HTTP controller for customer operations.
 *
 * All customer routes are protected and scoped to the authenticated user's
 * workshop.
 */
@Controller('customers')
@UseGuards(AuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /**
   * Lists customers for the authenticated user's workshop.
   */
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.customersService.findAll(user.workshopId, search);
  }

  /**
   * Returns one customer by id if it belongs to the authenticated workshop.
   */
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customersService.findOne(user.workshopId, id);
  }

  /**
   * Creates a new customer inside the authenticated workshop.
   */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user.workshopId, dto);
  }

  /**
   * Updates an existing customer if it belongs to the authenticated workshop.
   */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(user.workshopId, id, dto);
  }
}