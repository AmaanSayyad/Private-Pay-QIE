-- Add payment_alias column to payments table to track which payment link
-- (alias) was used for a given incoming payment. This lets the frontend
-- display per-link totals on the dashboard.

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_alias VARCHAR(255);

-- Optional index to speed up aggregations by alias and recipient
CREATE INDEX IF NOT EXISTS idx_payments_recipient_alias
ON payments (recipient_username, payment_alias);


