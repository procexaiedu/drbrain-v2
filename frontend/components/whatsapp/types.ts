export interface WhatsAppConversation {
  id: string;
  medico_id: string;
  contact_jid: string;
  contact_name: string;
  last_message_at: string;
  unread_messages: number;
  created_at: string;
  updated_at: string;
  last_message_content?: string;
  last_message_sent_by?: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  medico_id: string;
  message_content: string;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  sent_by: 'ia' | 'contact' | 'medico';
  sent_at: string;
  media_url?: string;
  evolution_message_id?: string;
  created_at: string;
}

export interface SendMessageRequest {
  number: string;
  message: string;
  conversationId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Corrigindo para corresponder à estrutura real da API
export interface ConversationsResponse {
  success: boolean;
  conversations: WhatsAppConversation[];
}

export interface MessagesResponse {
  success: boolean;
  messages: WhatsAppMessage[];
}

export interface SendMessageResponse {
  success: boolean;
  message: WhatsAppMessage;
  evolutionResponse?: any;
} 