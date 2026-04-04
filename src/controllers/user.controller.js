import { asyncHandler } from '../utils/asyncHandler.js';
import * as userService from '../services/user.service.js';
import { paginatedResponse } from '../utils/pagination.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { users, total, page, limit } = await userService.getAllUsers(req.query);
  res.json(paginatedResponse(users, total, page, limit));
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json({ success: true, data: user });
});

export const updateRole = asyncHandler(async (req, res) => {
  const user = await userService.updateUserRole(req.params.id, req.validated.body.role);
  res.json({ success: true, data: user });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const user = await userService.updateUserStatus(req.params.id, req.validated.body.isActive);
  res.json({ success: true, data: user });
});
