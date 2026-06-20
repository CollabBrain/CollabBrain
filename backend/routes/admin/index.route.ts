import { Application } from "express";
import { authRoutes } from "./auth.route";
import userRoutes from "./user.route";
import accountRoutes from "./account.route";
import groupRoutes from "./group.route";
import statsRoutes from "./stats.route";
import reportRoutes from "./report.route";
import pathAdmin from "../../config/system";

const adminRoutes = (app: Application) => {
  app.use(pathAdmin, authRoutes);
  app.use(pathAdmin, userRoutes);
  app.use(pathAdmin, accountRoutes);
  app.use(pathAdmin, groupRoutes);
  app.use(pathAdmin, statsRoutes);
  app.use(pathAdmin, reportRoutes);
};

export default adminRoutes;
