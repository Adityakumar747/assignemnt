import { Request, Response } from 'express';
import * as challanService from './challans.service.js';
import { streamChallanPdf } from './challan-pdf.js';

export async function createChallan(req: Request, res: Response): Promise<void> {
  const challan = await challanService.createChallan(req.body, req.user!.id);
  res.status(201).json({
    success: true,
    message: 'Sales challan created in DRAFT status',
    data: challan
  });
}

export async function confirmChallan(req: Request, res: Response): Promise<void> {
  const challan = await challanService.confirmChallan(
    req.params.id as string,
    req.user!.id
  );
  res.status(200).json({
    success: true,
    message: `Challan ${challan.challanNumber} confirmed and inventory stock decremented.`,
    data: challan
  });
}

export async function cancelChallan(req: Request, res: Response): Promise<void> {
  const challan = await challanService.cancelChallan(
    req.params.id as string,
    req.user!.id
  );
  res.status(200).json({
    success: true,
    message: `Challan ${challan.challanNumber} cancelled${
      challan.status === 'CANCELLED' ? ' and inventory restocked' : ''
    }.`,
    data: challan
  });
}

export async function getChallans(req: Request, res: Response): Promise<void> {
  const result = await challanService.getChallans(req.query as any);
  res.status(200).json({
    success: true,
    data: result.items,
    meta: result.meta
  });
}

export async function getChallanById(req: Request, res: Response): Promise<void> {
  const challan = await challanService.getChallanById(req.params.id as string);
  res.status(200).json({
    success: true,
    data: challan
  });
}

export async function downloadChallanPdf(req: Request, res: Response): Promise<void> {
  const challan = await challanService.getChallanById(req.params.id as string);
  streamChallanPdf(challan, res);
}
