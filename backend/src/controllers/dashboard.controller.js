import { success } from '../utils/apiResponse.js';
import * as dashboardService from '../services/dashboard.service.js';

export async function getStudentDashboard(req, res, next) {
  try {
    const dashboard = await dashboardService.getStudentDashboard(req.user._id);
    res.json(success(dashboard));
  } catch (err) {
    next(err);
  }
}

export async function getAdminDashboard(req, res, next) {
  try {
    const metrics = await dashboardService.getAdminMetrics();
    res.json(success(metrics));
  } catch (err) {
    next(err);
  }
}

export async function getContentHealth(req, res, next) {
  try {
    const health = await dashboardService.getContentHealth();
    res.json(success(health));
  } catch (err) {
    next(err);
  }
}
