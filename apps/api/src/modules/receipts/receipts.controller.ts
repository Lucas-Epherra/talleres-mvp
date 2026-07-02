import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { FindReceiptsQueryDto } from './dto/find-receipts-query.dto';
import { IssueReceiptDto } from './dto/issue-receipt.dto';
import { SendReceiptEmailDto } from './dto/send-receipt-email.dto';
import { ReceiptsService } from './receipts.service';

/**
 * HTTP controller for internal receipts.
 *
 * Receipts are authenticated and scoped by the user's workshop.
 */
@UseGuards(AuthGuard)
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  /**
   * Lists issued receipts for the authenticated workshop.
   */
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: FindReceiptsQueryDto,
  ) {
    return this.receiptsService.findAll(user.workshopId, query);
  }

  /**
   * Returns one issued receipt.
   */
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.receiptsService.findOne(user.workshopId, id);
  }

  /**
   * Issues an internal receipt from a work order.
   *
   * If the order already has a receipt, the existing one is returned.
   */
  @Post('work-orders/:workOrderId')
  issueFromWorkOrder(
    @CurrentUser() user: AuthUser,
    @Param('workOrderId') workOrderId: string,
    @Body() dto: IssueReceiptDto,
  ) {
    return this.receiptsService.issueFromWorkOrder(
      user.workshopId,
      user.id,
      workOrderId,
      dto,
    );
  }

  /**
   * Downloads the receipt as a PDF file.
   */
  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdf = await this.receiptsService.buildPdf(user.workshopId, id);

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${pdf.filename}"`,
    );

    res.send(pdf.buffer);
  }

  /**
   * Sends the receipt PDF by email.
   */
  @Post(':id/send-email')
  sendEmail(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SendReceiptEmailDto,
  ) {
    return this.receiptsService.sendEmail(user.workshopId, id, dto);
  }
}