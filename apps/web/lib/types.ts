export type ConversationStatus = 'OPEN' | 'PENDING' | 'CLOSED';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT';

export interface Contact {
  id: string;
  jid: string;
  phone: string;
  name?: string | null;
  pushName?: string | null;
  profilePicUrl?: string | null;
}

export interface Assignment {
  userId: string;
  user?: { id: string; name: string; email?: string };
  assignedAt: string;
}

export interface Conversation {
  id: string;
  status: ConversationStatus;
  lastMessageAt: string | null;
  unreadCount: number;
  lastMessagePreview: string | null;
  contact: Contact;
  assignment?: Assignment | null;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  type: MessageType;
  status: MessageStatus;
  body: string | null;
  mediaUrl?: string | null;
  createdAt: string;
  sender?: { id: string; name: string } | null;
  waMessageId?: string | null;
}

export interface Note {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string };
}

export interface WhatsAppSession {
  id: string;
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'FAILED';
  phoneNumber?: string | null;
  pushName?: string | null;
  qrCode?: string | null;
  lastError?: string | null;
}
