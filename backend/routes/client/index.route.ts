import { Application } from "express";
import { userRoutes } from "./user.route";
import { friendRoutes } from "./friend.route";
import { chatRoutes } from "./chat.route";
import { uploadRoutes } from "./upload.route";

const clientRoutes = (app: Application)=>{
app.use("/user", userRoutes)
app.use("/friends", friendRoutes)
app.use("/chat", chatRoutes)
app.use("/user/chat", chatRoutes) // Hỗ trợ frontend axiosInstance baseURL prefix /user
app.use("/upload", uploadRoutes)
app.use("/user/upload", uploadRoutes) // Hỗ trợ frontend axiosInstance baseURL prefix /user
}
export default clientRoutes;