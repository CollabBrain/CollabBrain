import { Application } from "express";
import { userRoutes } from "./user.route";
import { friendRoutes } from "./friend.route";


const clientRoutes = (app: Application)=>{
app.use("/user", userRoutes)
app.use("/friends", friendRoutes)

}
export default clientRoutes;