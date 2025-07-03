-- Create flows table
CREATE TABLE IF NOT EXISTS flows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES core_clients(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES core_client_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client's flows"
    ON flows FOR SELECT
    USING (client_id IN (
        SELECT client_id FROM core_client_users
        WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can insert flows for their client"
    ON flows FOR INSERT
    WITH CHECK (client_id IN (
        SELECT client_id FROM core_client_users
        WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their client's flows"
    ON flows FOR UPDATE
    USING (client_id IN (
        SELECT client_id FROM core_client_users
        WHERE auth_user_id = auth.uid()
    ))
    WITH CHECK (client_id IN (
        SELECT client_id FROM core_client_users
        WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their client's flows"
    ON flows FOR DELETE
    USING (client_id IN (
        SELECT client_id FROM core_client_users
        WHERE auth_user_id = auth.uid()
    )); 