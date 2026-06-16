-- Track which bartender claimed an order for preparation.
ALTER TABLE "orders" ADD COLUMN "claimedById" TEXT;

CREATE INDEX "orders_status_claimedById_idx" ON "orders"("status", "claimedById");

ALTER TABLE "orders" ADD CONSTRAINT "orders_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
