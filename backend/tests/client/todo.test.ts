import { describe, it, expect } from 'vitest';
import {
  findTodosByUserId,
  findTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
} from '../../repositories/client/todo.repo';
import { prismaMock } from '../setup';

describe('todo.repo', () => {
  const userId = 'user-1';
  const todoId = 'todo-1';

  describe('findTodosByUserId', () => {
    it('nên trả về danh sách todo của user sắp xếp giảm dần', async () => {
      const mockTodos = [
        { id: '1', title: 'Task 1', userId, createdAt: new Date() },
        { id: '2', title: 'Task 2', userId, createdAt: new Date() },
      ];

      prismaMock.todo.findMany.mockResolvedValue(mockTodos as any);

      const result = await findTodosByUserId(userId);

      expect(prismaMock.todo.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockTodos);
    });
  });

  describe('findTodoById', () => {
    it('nên tìm thấy todo bằng id', async () => {
      const mockTodo = { id: todoId, title: 'Task 1', userId };

      prismaMock.todo.findUnique.mockResolvedValue(mockTodo as any);

      const result = await findTodoById(todoId);

      expect(prismaMock.todo.findUnique).toHaveBeenCalledWith({
        where: { id: todoId },
      });
      expect(result).toEqual(mockTodo);
    });
  });

  describe('createTodo', () => {
    it('nên tạo mới todo thành công', async () => {
      const todoData = {
        userId,
        title: 'New Task',
        description: 'Detail description',
        dueDate: new Date(),
        isNotify: true,
        attachments: 'file.pdf',
      };

      prismaMock.todo.create.mockResolvedValue({ id: 'new-id', ...todoData } as any);

      const result = await createTodo(todoData);

      expect(prismaMock.todo.create).toHaveBeenCalledWith({
        data: todoData,
      });
      expect(result.id).toBe('new-id');
    });
  });

  describe('updateTodo', () => {
    it('nên cập nhật todo thành công', async () => {
      const updateData = {
        title: 'Updated Task',
        isCompleted: true,
      };

      prismaMock.todo.update.mockResolvedValue({ id: todoId, ...updateData } as any);

      const result = await updateTodo(todoId, updateData);

      expect(prismaMock.todo.update).toHaveBeenCalledWith({
        where: { id: todoId },
        data: updateData,
      });
      expect(result.title).toBe('Updated Task');
    });
  });

  describe('deleteTodo', () => {
    it('nên xóa todo thành công', async () => {
      prismaMock.todo.delete.mockResolvedValue({ id: todoId } as any);

      const result = await deleteTodo(todoId);

      expect(prismaMock.todo.delete).toHaveBeenCalledWith({
        where: { id: todoId },
      });
      expect(result.id).toBe(todoId);
    });
  });
});
