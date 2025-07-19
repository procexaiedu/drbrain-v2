
CREATE TABLE IF NOT EXISTS whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instance_name TEXT NOT NULL UNIQUE,
    instance_token TEXT,
    status TEXT NOT NULL DEFAULT 'disconnected',
    qrcode_base64 TEXT,
    last_connection_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_medico_id ON whatsapp_instances(medico_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
    message_id_from_api TEXT UNIQUE,
    sender_jid TEXT NOT NULL,
    recipient_jid TEXT NOT NULL,
    content JSONB,
    status TEXT,
    message_timestamp TIMESTAMPTZ,
    is_from_me BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance_id ON whatsapp_messages(instance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sender_jid ON whatsapp_messages(sender_jid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_recipient_jid ON whatsapp_messages(recipient_jid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_timestamp ON whatsapp_messages(message_timestamp);

COMMENT ON TABLE whatsapp_instances IS 'Stores connection instances for the WhatsApp integration.';
COMMENT ON COLUMN whatsapp_instances.status IS 'Possible statuses: disconnected, connecting, connected, qrcode, timeout.';
COMMENT ON TABLE whatsapp_messages IS 'Stores all incoming and outgoing WhatsApp messages.';
COMMENT ON COLUMN whatsapp_messages.content IS 'Stores the message content, which can be text, media URL, etc.';
COMMENT ON COLUMN whatsapp_messages.is_from_me IS 'True if the message was sent by the doctor, false if it was received from a patient.';

