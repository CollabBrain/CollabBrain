import { Application } from "express";
import { authRoutes } from "./auth.route";
import pathAdmin from "../../config/system";

const adminRoutes = (app: Application)=>{
  app.use(pathAdmin, authRoutes)
}
export default adminRoutes;