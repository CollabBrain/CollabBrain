import { Application } from "express";
import { userRoutes } from "./user.route";
import { friendRoutes } from "./friend.route";
import { chatRoutes } from "./chat.route";
import { groupRoutes } from "./group.routes";
import { uploadRoutes } from "./upload.route";
import { reportRoutes } from "./report.route";
import { documentRoutes } from "./document.route";
import { flashcardRoutes } from "./flashcard.route";
import { ragRoutes } from "./rag.route";
import { notificationRoutes } from "./notification.route";
import { settingRoutes } from "./setting.route";
import { todoRoutes } from "./todo.route";

const clientRoutes = (app: Application)=>{
app.use("/user", userRoutes)
app.use("/friends", friendRoutes)

app.use("/groups",groupRoutes)
app.use("/user/groups", groupRoutes) // Hỗ trợ frontend axiosInstance baseURL prefix /user

app.use("/chat", chatRoutes)
app.use("/user/chat", chatRoutes) // Hỗ trợ frontend axiosInstance baseURL prefix /user
app.use("/upload", uploadRoutes)
app.use("/user/upload", uploadRoutes) // Hỗ trợ frontend axiosInstance baseURL prefix /user
app.use("/reports", reportRoutes)
app.use("/user/reports", reportRoutes)
app.use("/documents", documentRoutes)
app.use("/user/documents", documentRoutes) // Hỗ trợ frontend axiosInstance baseURL prefix /user
app.use("/flashcard", flashcardRoutes)
app.use("/user/flashcard", flashcardRoutes) // Hỗ trợ frontend axiosInstance baseURL prefix /user
app.use("/notifications", notificationRoutes)
app.use("/user/notifications", notificationRoutes) // Hỗ trợ frontend axiosInstance baseURL prefix /user
app.use("/rag", ragRoutes)
app.use("/user/rag", ragRoutes) // Hỗ trợ frontend axiosInstance baseURL prefix /user
app.use("/settings", settingRoutes)
app.use("/user/settings", settingRoutes)
app.use("/todos", todoRoutes)
app.use("/user/todos", todoRoutes)
}
export default clientRoutes;
