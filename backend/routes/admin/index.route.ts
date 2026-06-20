import { Application } from "express";
import { authRoutes } from "./auth.route";
import userRoutes from "./user.route";
import groupRoutes from "./group.route";
import statsRoutes from "./stats.route";
import reportRoutes from "./report.route";
import pathAdmin from "../../config/system";

const adminRoutes = (app: Application) => {
  app.use(pathAdmin, authRoutes);
  app.use(`${pathAdmin}/groups`, groupRoutes);
  app.use(`${pathAdmin}/stats`, statsRoutes);
  app.use(`${pathAdmin}/reports`, reportRoutes);
  app.use(pathAdmin, userRoutes);
};

export default adminRoutes;