-- New accounts start with a 500,000 USD demo balance.
ALTER TABLE "User" ALTER COLUMN "balance" SET DEFAULT 500000;
