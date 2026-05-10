import { Application } from "express";
import { userRoutes } from "./user.route";

const clientRoutes = (app: Application)=>{
app.use("/user", userRoutes)
}
export default clientRoutes;