-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('NOT_STARTED', 'ONGOING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('NOT_STARTED', 'ONGOING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('Google', 'Credentials', 'Spotify');

-- CreateTable
CREATE TABLE "User" (
    "name" TEXT,
    "organizationName" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "provider" "Provider" NOT NULL,
    "id" SERIAL NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Space" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceCustomer" (
    "id" SERIAL NOT NULL,
    "spaceId" INTEGER NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "conversationStatus" "ConversationStatus" NOT NULL,

    CONSTRAINT "SpaceCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversations" (
    "id" SERIAL NOT NULL,
    "spaceId" INTEGER NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "llm" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
