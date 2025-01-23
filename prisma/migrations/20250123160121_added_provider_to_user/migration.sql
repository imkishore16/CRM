/*
  Warnings:

  - You are about to drop the column `proviuder` on the `User` table. All the data in the column will be lost.
  - Added the required column `provider` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "proviuder",
ADD COLUMN     "provider" TEXT NOT NULL;
