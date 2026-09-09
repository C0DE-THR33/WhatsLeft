-- AlterTable
ALTER TABLE "linked_accounts" ADD COLUMN     "linkRefNumber" TEXT;

-- CreateTable
CREATE TABLE "aa_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vua" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "dataRangeFrom" TIMESTAMP(3) NOT NULL,
    "dataRangeTo" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "linkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aa_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aa_consents_userId_idx" ON "aa_consents"("userId");

-- CreateIndex
CREATE INDEX "linked_accounts_consentId_idx" ON "linked_accounts"("consentId");

-- AddForeignKey
ALTER TABLE "aa_consents" ADD CONSTRAINT "aa_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
