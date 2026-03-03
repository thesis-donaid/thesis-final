/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `beneficiaries` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `beneficiaries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `beneficiaries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `beneficiaries` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BeneficiaryType" AS ENUM ('SCHOLAR', 'EMPLOYEE', 'COMMUNITY');

-- AlterTable
ALTER TABLE "beneficiaries" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "type" "BeneficiaryType" NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "beneficiaries_username_key" ON "beneficiaries"("username");
