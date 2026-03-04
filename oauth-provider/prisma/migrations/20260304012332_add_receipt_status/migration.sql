-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PENDING', 'COMPLETED', 'MISSING');

-- AlterTable
ALTER TABLE "beneficiary_requests" ADD COLUMN     "receipt_status" "ReceiptStatus" NOT NULL DEFAULT 'PENDING';
