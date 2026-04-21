import type { PageResponse } from './annonce.types';

export interface MessageDTO {
  id: number;
  conversationId: number;
  senderId: string;
  senderUsername: string;
  senderNomComplet: string;
  senderPhotoProfil: string | null;
  content: string;
  createdAt: string;
  readAt: string | null;
  mine: boolean;
}

export interface ConversationDTO {
  id: number;
  annonceId: number;
  annonceReference: string;
  annonceTitre: string;
  annonceActive: boolean;
  otherParticipantId: string;
  otherParticipantUsername: string;
  otherParticipantNomComplet: string;
  otherParticipantPhotoProfil: string | null;
  createdById: string;
  lastMessagePreview: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
}

export interface CreateConversationRequest {
  annonceId: number;
}

export interface SendMessageRequest {
  content: string;
}

export type ConversationListResponse = PageResponse<ConversationDTO>;
export type MessageListResponse = PageResponse<MessageDTO>;
