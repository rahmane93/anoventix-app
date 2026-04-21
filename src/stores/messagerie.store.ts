import { create } from 'zustand';
import * as messagerieApi from '../api/messagerie.api';
import type {
    ConversationDTO,
    CreateConversationRequest,
    MessageDTO,
} from '../types/messagerie.types';
import { getErrorMessage } from '../utils/format';

interface MessagerieStore {
  conversations: ConversationDTO[];
  currentConversation: ConversationDTO | null;
  messages: MessageDTO[];
  isLoadingConversations: boolean;
  isLoadingConversation: boolean;
  isSendingMessage: boolean;
  creatingConversationForAnnonceId: number | null;
  error: string | null;
  loadConversations: () => Promise<void>;
  loadConversation: (conversationId: string | number) => Promise<void>;
  openOrCreateConversation: (data: CreateConversationRequest) => Promise<ConversationDTO>;
  sendMessage: (conversationId: string | number, content: string) => Promise<void>;
  markConversationRead: (conversationId: string | number) => Promise<void>;
  clearCurrentConversation: () => void;
  clearError: () => void;
}

function sortMessages(messages: MessageDTO[]): MessageDTO[] {
  return [...messages].sort((a, b) => {
    const da = new Date(a.createdAt ?? 0).getTime();
    const db = new Date(b.createdAt ?? 0).getTime();
    return da - db;
  });
}

export const useMessagerieStore = create<MessagerieStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingConversation: false,
  isSendingMessage: false,
  creatingConversationForAnnonceId: null,
  error: null,

  loadConversations: async () => {
    set({ isLoadingConversations: true, error: null });
    try {
      const response = await messagerieApi.getConversations();
      const conversations = Array.isArray(response.data) ? response.data : [];
      set({ conversations, isLoadingConversations: false });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Impossible de charger les conversations.'), isLoadingConversations: false });
    }
  },

  loadConversation: async (conversationId) => {
    set({ isLoadingConversation: true, error: null });
    try {
      const [conversation, messagePage] = await Promise.all([
        messagerieApi.getConversationById(conversationId),
        messagerieApi.getConversationMessages(conversationId),
      ]);
      set({
        currentConversation: conversation,
        messages: sortMessages(messagePage.data ?? []),
        isLoadingConversation: false,
      });
      await get().markConversationRead(conversationId);
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Impossible de charger cette conversation.'), isLoadingConversation: false });
      throw err;
    }
  },

  openOrCreateConversation: async (data) => {
    set({ creatingConversationForAnnonceId: data.annonceId, error: null });
    try {
      const conversation = await messagerieApi.createConversation(data);
      const currentList = get().conversations;
      const exists = currentList.some((item) => item.id === conversation.id);
      set({
        conversations: exists ? currentList.map((item) => item.id === conversation.id ? conversation : item) : [conversation, ...currentList],
        creatingConversationForAnnonceId: null,
      });
      return conversation;
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Impossible d’ouvrir la conversation.'), creatingConversationForAnnonceId: null });
      throw err;
    }
  },

  sendMessage: async (conversationId, content) => {
    set({ isSendingMessage: true, error: null });
    try {
      const created = await messagerieApi.sendConversationMessage(conversationId, { content });
      const messages = sortMessages([...get().messages, created]);
      const refreshedConversation = await messagerieApi.getConversationById(conversationId);
      const conversations = get().conversations;
      const exists = conversations.some((item) => String(item.id) === String(conversationId));
      set({
        messages,
        currentConversation: refreshedConversation,
        conversations: exists
          ? [refreshedConversation, ...conversations.filter((item) => String(item.id) !== String(conversationId))]
          : [refreshedConversation, ...conversations],
        isSendingMessage: false,
      });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Impossible d’envoyer le message.'), isSendingMessage: false });
      throw err;
    }
  },

  markConversationRead: async (conversationId) => {
    try {
      await messagerieApi.markConversationAsRead(conversationId);
      const conversations = get().conversations.map((conversation) =>
        String(conversation.id) === String(conversationId)
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      );
      const currentConversation = get().currentConversation;
      set({
        conversations,
        currentConversation:
          currentConversation && String(currentConversation.id) === String(conversationId)
            ? { ...currentConversation, unreadCount: 0 }
            : currentConversation,
      });
    } catch {
      // silencieux
    }
  },

  clearCurrentConversation: () => set({ currentConversation: null, messages: [] }),
  clearError: () => set({ error: null }),
}));
