-- AlterTable
ALTER TABLE "beneficiary_requests" ADD COLUMN     "receipt_message" TEXT,
ADD COLUMN     "receipt_submitted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "disbursement_receipts" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disbursement_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disbursement_receipts_requestId_idx" ON "disbursement_receipts"("requestId");

-- AddForeignKey
ALTER TABLE "disbursement_receipts" ADD CONSTRAINT "disbursement_receipts_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "beneficiary_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
