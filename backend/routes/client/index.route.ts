import { Application } from "express";
import { userRoutes } from "./user.route";
import { friendRoutes } from "./friend.route";
import { chatRoutes } from "./chat.route";
import { groupRoutes } from "./group.routes";

const clientRoutes = (app: Application)=>{
app.use("/user", userRoutes)
app.use("/friends", friendRoutes)
app.use("/chat",chatRoutes)
app.use("/groups",groupRoutes)
}
export default clientRoutes;