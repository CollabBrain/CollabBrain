/*
  Warnings:

  - You are about to drop the column `email` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `account_id` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password_hash` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_account_id_fkey";

-- DropIndex
DROP INDEX "accounts_email_key";

-- DropIndex
DROP INDEX "users_account_id_key";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "email",
ADD COLUMN     "username" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "account_id",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "password_hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_username_key" ON "accounts"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
