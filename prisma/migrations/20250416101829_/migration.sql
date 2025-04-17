/*
  Warnings:

  - You are about to drop the column `ModelProvider` on the `Space` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Space" DROP COLUMN "ModelProvider",
ADD COLUMN     "modelProvider" TEXT NOT NULL DEFAULT 'gemini';
