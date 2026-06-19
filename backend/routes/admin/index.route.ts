import { Application } from "express";
import { authRoutes } from "./auth.route";
import userRoutes from "./user.route";
import pathAdmin from "../../config/system";

const adminRoutes = (app: Application) => {
  app.use(pathAdmin, authRoutes);
  app.use(pathAdmin, userRoutes);
};

export default adminRoutes;