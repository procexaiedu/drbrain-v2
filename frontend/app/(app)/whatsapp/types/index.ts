export interface Conversation {
  id: string;
  medico_id: string;
  contact_jid: string;
  contact_name: string;
  last_message_at: string;
  unread_messages: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  medico_id: string;
  message_content: string;
  message_type: string;
  sent_by: 'ia' | 'contact' | 'medico';
  sent_at: string;
  message_api_id?: string;
  whatsapp_conversations?: { contact_name: string }; // For fetching messages with contact_name
} 