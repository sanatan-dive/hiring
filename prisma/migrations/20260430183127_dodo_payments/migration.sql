/*
  Warnings:

  - You are about to drop the column `razorpayId` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `subscriptions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dodo_subscription_id]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "razorpayId",
DROP COLUMN "stripeCustomerId",
ADD COLUMN     "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "current_period_end" TIMESTAMP(3),
ADD COLUMN     "dodo_customer_id" TEXT,
ADD COLUMN     "dodo_product_id" TEXT,
ADD COLUMN     "dodo_subscription_id" TEXT,
ALTER COLUMN "status" SET DEFAULT 'inactive';

-- CreateTable
CREATE TABLE "subscription_events" (
    "id" TEXT NOT NULL,
    "webhook_id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_events_webhook_id_key" ON "subscription_events"("webhook_id");

-- CreateIndex
CREATE INDEX "subscription_events_user_id_idx" ON "subscription_events"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_dodo_subscription_id_key" ON "subscriptions"("dodo_subscription_id");
