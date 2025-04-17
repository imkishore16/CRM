/*
  Warnings:

  - You are about to drop the column `llm` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `user` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `content` to the `Conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "llm",
DROP COLUMN "user",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "sender" "SenderType" NOT NULL;

-- DropTable
DROP TABLE "Message";
