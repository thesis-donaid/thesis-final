-- CreateTable
CREATE TABLE "guest_donors" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "first_donation_date" TIMESTAMP(3),
    "last_donation_date" TIMESTAMP(3),
    "donation_count" INTEGER NOT NULL DEFAULT 0,
    "total_donated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_donors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registered_donors" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "donation_count" INTEGER NOT NULL DEFAULT 0,
    "total_donated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registered_donors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiaries" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "beneficiary_type" VARCHAR(20) NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "total_received" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allocated_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "available_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" SERIAL NOT NULL,
    "guest_donor_id" INTEGER,
    "registered_donor_id" INTEGER,
    "email" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "donation_type" VARCHAR(20) NOT NULL,
    "pool_id" TEXT,
    "message" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reference_code" TEXT NOT NULL,
    "payment_intent_id" TEXT,
    "payment_method" TEXT,
    "payment_fee" DOUBLE PRECISION,
    "net_amount" DOUBLE PRECISION,
    "paid_at" TIMESTAMP(3),
    "blockchain_txt_hash" TEXT,
    "blockchain_network" TEXT,
    "blockchain_status" TEXT,
    "blockchain_saved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_donors_email_key" ON "guest_donors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "registered_donors_userId_key" ON "registered_donors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiaries_userId_key" ON "beneficiaries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "pools_name_key" ON "pools"("name");

-- CreateIndex
CREATE UNIQUE INDEX "donations_reference_code_key" ON "donations"("reference_code");

-- CreateIndex
CREATE INDEX "donations_email_idx" ON "donations"("email");

-- CreateIndex
CREATE INDEX "donations_status_idx" ON "donations"("status");

-- CreateIndex
CREATE INDEX "donations_created_at_idx" ON "donations"("created_at");

-- AddForeignKey
ALTER TABLE "registered_donors" ADD CONSTRAINT "registered_donors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_guest_donor_id_fkey" FOREIGN KEY ("guest_donor_id") REFERENCES "guest_donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_registered_donor_id_fkey" FOREIGN KEY ("registered_donor_id") REFERENCES "registered_donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
