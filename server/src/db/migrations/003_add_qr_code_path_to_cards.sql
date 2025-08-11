-- Add qr_code_path column to cards table if it doesn't exist
ALTER TABLE cards ADD COLUMN qr_code_path TEXT;

-- Update the trigger to update the updated_at timestamp when qr_code_path changes
CREATE TRIGGER IF NOT EXISTS update_cards_timestamp
AFTER UPDATE ON cards
BEGIN
    UPDATE cards SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
