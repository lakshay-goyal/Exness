-- Preserve why an order was closed: manual, take_profit, or stop_loss.
ALTER TABLE "Orders" ADD COLUMN "closeReason" TEXT;
