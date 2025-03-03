-- CreateTable
CREATE TABLE "SpaceCustomer" (
    "id" SERIAL NOT NULL,
    "spaceId" INTEGER NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL,

    CONSTRAINT "SpaceCustomer_pkey" PRIMARY KEY ("id")
);
