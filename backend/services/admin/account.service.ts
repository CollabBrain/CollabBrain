import * as accountRepo from "../../repositories/admin/account.repo";
import bcrypt from "bcrypt";

export interface GetAccountsQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface CreateAccountData {
  username: string;
  password: string;
  role?: string;
}

export interface UpdateAccountData {
  username?: string;
  role?: string;
  password?: string;
}

export const getAccounts = async (query: GetAccountsQuery) => {
  const page = Math.max(1, parseInt(String(query.page || 1)));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 10))));
  const search = query.search || "";
  const role = query.role || undefined;
  const isActive = query.isActive === undefined ? undefined : query.isActive === "true";
  const sortBy = (query.sortBy as string) || "createdAt";
  const order = query.order === "asc" ? "asc" : "desc";

  const { accounts, total } = await accountRepo.findAccounts(
    { search, role, isActive, sortBy, order },
    { page, limit }
  );

  return {
    data: accounts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getAccountById = async (id: string) => {
  const account = await accountRepo.findAccountById(id);
  if (!account) {
    throw new Error("Tài khoản không tồn tại");
  }
  return account;
};

export const createAccount = async (data: CreateAccountData) => {
  const { username, password, role = "STAFF" } = data;

  if (!username || !password) {
    throw new Error("Username và password là bắt buộc");
  }

  if (!["ADMIN", "MANAGER", "STAFF"].includes(role)) {
    throw new Error("Role không hợp lệ");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newAccount = await accountRepo.createAccount({
    username,
    passwordHash,
    role: role as "ADMIN" | "MANAGER" | "STAFF"
  });

  return newAccount;
};

export const updateAccount = async (id: string, data: UpdateAccountData) => {
  const existingAccount = await accountRepo.findAccountById(id);
  if (!existingAccount) {
    throw new Error("Tài khoản không tồn tại");
  }

  if (data.role && !["ADMIN", "MANAGER", "STAFF"].includes(data.role)) {
    throw new Error("Role không hợp lệ");
  }

  const updateData: any = { ...data };
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
    delete updateData.password;
  }

  const updatedAccount = await accountRepo.updateAccount(id, updateData);
  return updatedAccount;
};

export const deleteAccount = async (id: string) => {
  const existingAccount = await accountRepo.findAccountById(id);
  if (!existingAccount) {
    throw new Error("Tài khoản không tồn tại");
  }

  return await accountRepo.deleteAccount(id);
};

export const toggleAccountStatus = async (id: string) => {
  const existingAccount = await accountRepo.findAccountById(id);
  if (!existingAccount) {
    throw new Error("Tài khoản không tồn tại");
  }

  const newStatus = !existingAccount.isActive;
  return await accountRepo.toggleAccountStatus(id, newStatus);
};
