import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.validated.body);
  res.status(201).json({ success: true, data: user });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.validated.body);
  res.json({ success: true, data: result });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refreshAuthTokens(req.validated.body);
  res.json({ success: true, data: result });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.validated.body);
  res.status(204).send();
});
