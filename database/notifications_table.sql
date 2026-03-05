-- Notifications table for in-app real-time notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INT NOT NULL REFERENCES account(account_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,  -- 'activity_approved', 'activity_rejected', 'appointment_confirmed', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50),  -- 'activity', 'appointment', 'recognition', 'annual_report'
    reference_id INT,            -- ID of the related record
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Index for fast queries by recipient
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);

-- Enable Realtime for the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- RLS: Users can only see their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (recipient_id IN (
        SELECT account_id FROM account WHERE email = auth.jwt()->>'email'
    ));

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (recipient_id IN (
        SELECT account_id FROM account WHERE email = auth.jwt()->>'email'
    ));

-- Only the service role (backend) can insert notifications
CREATE POLICY "Service role can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'service_role');
