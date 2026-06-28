import { Application } from "express";
import { authRoutes } from "./auth.route";
import userRoutes from "./user.route";
import accountRoutes from "./account.route";
import groupRoutes from "./group.route";
import statsRoutes from "./stats.route";
import reportRoutes from "./report.route";
import settingRoutes from "./setting.route";
import documentRoutes from "./document.route";
import pathAdmin from "../../config/system";

const adminRoutes = (app: Application) => {
  app.use(pathAdmin, authRoutes);
  app.use(pathAdmin + "/users", userRoutes);
  app.use(pathAdmin + "/accounts", accountRoutes);
  app.use(pathAdmin + "/groups", groupRoutes);
  app.use(pathAdmin + "/stats", statsRoutes);
  app.use(pathAdmin + "/reports", reportRoutes);
  app.use(pathAdmin + "/settings", settingRoutes);
  app.use(pathAdmin + "/documents", documentRoutes);
};

export default adminRoutes;
