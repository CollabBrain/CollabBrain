import { Router } from "express";
const router: Router = Router();
import * as controller from "../../controllers/client/todo.controller";
import * as authMiddleware from "../../middlewares/client/auth.middleware";

router.use(authMiddleware.authMiddleware);

router.get("/", controller.getTodos);
router.post("/", controller.createTodo);
router.patch("/:id", controller.updateTodo);
router.delete("/:id", controller.deleteTodo);

export const todoRoutes = router;
