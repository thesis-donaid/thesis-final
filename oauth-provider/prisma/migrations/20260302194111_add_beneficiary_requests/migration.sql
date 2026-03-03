/*
  Warnings:

  - You are about to drop the column `beneficiary_type` on the `beneficiaries` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `registered_donors` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `registered_donors` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `pools` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "FundSourceType" AS ENUM ('UNRESTRICTED', 'RESTRICTED');

-- AlterTable
ALTER TABLE "beneficiaries" DROP COLUMN "beneficiary_type";

-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "remaining_amount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "pools" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "registered_donors" DROP COLUMN "first_name",
DROP COLUMN "last_name",
ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "beneficiary_requests" (
    "id" SERIAL NOT NULL,
    "beneficiaryId" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date_needed" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "additional_notes" TEXT,
    "urgency_level" "UrgencyLevel" NOT NULL DEFAULT 'LOW',
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "disbursed_at" TIMESTAMP(3),
    "disbursed_amount" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiary_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_documents" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unrestricted_fund" (
    "id" SERIAL NOT NULL,
    "total_received" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_allocated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "available_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unrestricted_fund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "source_type" "FundSourceType" NOT NULL,
    "poolId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "allocated_by" TEXT NOT NULL,
    "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disbursement_date" TIMESTAMP(3),
    "disbursement_notes" TEXT,
    "is_disbursed" BOOLEAN NOT NULL DEFAULT false,
    "disbursed_at" TIMESTAMP(3),

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_allocations" (
    "id" SERIAL NOT NULL,
    "allocationId" INTEGER NOT NULL,
    "donationId" INTEGER NOT NULL,
    "amount_used" DOUBLE PRECISION NOT NULL,
    "donor_notified" BOOLEAN NOT NULL DEFAULT false,
    "notified_at" TIMESTAMP(3),
    "notification_type" TEXT,

    CONSTRAINT "donation_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "request_documents_requestId_idx" ON "request_documents"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "donation_allocations_allocationId_donationId_key" ON "donation_allocations"("allocationId", "donationId");

-- AddForeignKey
ALTER TABLE "beneficiary_requests" ADD CONSTRAINT "beneficiary_requests_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "beneficiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_documents" ADD CONSTRAINT "request_documents_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "beneficiary_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pools" ADD CONSTRAINT "pools_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "beneficiary_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_allocations" ADD CONSTRAINT "donation_allocations_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_allocations" ADD CONSTRAINT "donation_allocations_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "donations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
