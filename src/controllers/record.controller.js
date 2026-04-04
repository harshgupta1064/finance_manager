import { asyncHandler } from '../utils/asyncHandler.js';
import * as recordService from '../services/record.service.js';
import { paginatedResponse } from '../utils/pagination.js';

export const createRecord = asyncHandler(async (req, res) => {
  const record = await recordService.createRecord(req.validated.body, req.user.id);
  res.status(201).json({ success: true, data: record });
});

export const getRecords = asyncHandler(async (req, res) => {
  const { records, total, page, limit } = await recordService.getRecords(req.validated.query);
  res.json(paginatedResponse(records, total, page, limit));
});

export const getRecord = asyncHandler(async (req, res) => {
  const record = await recordService.getRecordById(req.params.id);
  res.json({ success: true, data: record });
});

export const updateRecord = asyncHandler(async (req, res) => {
  const record = await recordService.updateRecord(req.params.id, req.validated.body, req.user.id);
  res.json({ success: true, data: record });
});

export const deleteRecord = asyncHandler(async (req, res) => {
  await recordService.softDeleteRecord(req.params.id, req.user.id);
  res.status(204).send();
});
