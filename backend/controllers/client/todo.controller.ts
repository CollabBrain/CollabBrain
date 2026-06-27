import { Request, Response } from "express";
import * as todoRepo from "../../repositories/client/todo.repo";

export const getTodos = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const todos = await todoRepo.findTodosByUserId(userId);
    res.status(200).json({
      code: 200,
      message: "Lấy danh sách nhiệm vụ thành công",
      data: todos
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message || "Lỗi khi lấy danh sách nhiệm vụ"
    });
  }
};

export const createTodo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { title, description, dueDate, isNotify, attachments } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        code: 400,
        message: "Tiêu đề nhiệm vụ không được để trống"
      });
    }

    const todo = await todoRepo.createTodo({
      userId,
      title: title.trim(),
      description: description ? description.trim() : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      isNotify: isNotify !== undefined ? Boolean(isNotify) : undefined,
      attachments: attachments ? attachments : null
    });

    res.status(201).json({
      code: 201,
      message: "Tạo nhiệm vụ thành công",
      data: todo
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message || "Lỗi khi tạo nhiệm vụ"
    });
  }
};

export const updateTodo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    const { title, description, dueDate, isCompleted, isNotify, attachments } = req.body;

    const existingTodo = await todoRepo.findTodoById(id);
    if (!existingTodo || existingTodo.userId !== userId) {
      return res.status(404).json({
        code: 404,
        message: "Nhiệm vụ không tồn tại hoặc bạn không có quyền chỉnh sửa"
      });
    }

    const updatedTodo = await todoRepo.updateTodo(id, {
      title: title !== undefined ? title.trim() : undefined,
      description: description !== undefined ? (description ? description.trim() : null) : undefined,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : undefined,
      isNotify: isNotify !== undefined ? Boolean(isNotify) : undefined,
      attachments: attachments !== undefined ? (attachments || null) : undefined
    });

    res.status(200).json({
      code: 200,
      message: "Cập nhật nhiệm vụ thành công",
      data: updatedTodo
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message || "Lỗi khi cập nhật nhiệm vụ"
    });
  }
};

export const deleteTodo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;

    const existingTodo = await todoRepo.findTodoById(id);
    if (!existingTodo || existingTodo.userId !== userId) {
      return res.status(404).json({
        code: 404,
        message: "Nhiệm vụ không tồn tại hoặc bạn không có quyền xóa"
      });
    }

    await todoRepo.deleteTodo(id);

    res.status(200).json({
      code: 200,
      message: "Xóa nhiệm vụ thành công"
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message || "Lỗi khi xóa nhiệm vụ"
    });
  }
};
