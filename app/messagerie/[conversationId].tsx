import { AlertBanner } from '@/src/components/ui/alert-banner';
import { Button } from '@/src/components/ui/button';
import { useAuthStore } from '@/src/stores/auth.store';
import { useMessagerieStore } from '@/src/stores/messagerie.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import type { MessageDTO } from '@/src/types/messagerie.types';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getPeerName(name?: string | null, username?: string | null): string {
  return name || username || 'Conversation';
}

function getMessageText(message: MessageDTO): string {
  return message.content ?? '';
}

function formatMessageTime(message: MessageDTO): string {
  const raw = message.createdAt;
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();
  const {
    currentConversation,
    messages,
    isLoadingConversation,
    isSendingMessage,
    error,
    loadConversation,
    sendMessage,
    clearCurrentConversation,
  } = useMessagerieStore();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<MessageDTO>>(null);
  const orderedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages],
  );

  const scrollToBottom = (animated = true) => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated });
      }, 60);
    });
  };

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
    return () => clearCurrentConversation();
  }, [conversationId]);

  useEffect(() => {
    if (orderedMessages.length > 0) {
      scrollToBottom(true);
    }
  }, [orderedMessages.length]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      scrollToBottom(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {});

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const peerName = useMemo(
    () => getPeerName(currentConversation?.otherParticipantNomComplet, currentConversation?.otherParticipantUsername),
    [currentConversation?.otherParticipantNomComplet, currentConversation?.otherParticipantUsername],
  );
  const canSend = draft.trim().length > 0 && !isSendingMessage && !!conversationId;

  const handleSend = async () => {
    if (!conversationId || !draft.trim()) return;
    const content = draft.trim();
    setDraft('');
    try {
      await sendMessage(conversationId, content);
      scrollToBottom(true);
    } catch {
      setDraft(content);
    }
  };

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: peerName }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        <View style={styles.contentWrap}>
          {error ? (
            <View style={styles.bannerWrap}>
              <AlertBanner message={error} variant="error" />
            </View>
          ) : null}

          {currentConversation?.annonceId ? (
            <View style={styles.annonceCard}>
              <View style={styles.annonceIconWrap}>
                <Ionicons name="home-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.annonceInfo}>
                <Text style={styles.annonceTitle} numberOfLines={1}>{currentConversation.annonceTitre ?? 'Annonce'}</Text>
                {currentConversation.annonceReference ? (
                  <Text style={styles.annonceRef}>Réf. {currentConversation.annonceReference}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {isLoadingConversation && !currentConversation ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Chargement de la conversation…</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              style={styles.messagesList}
              data={orderedMessages}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollToBottom(false)}
              renderItem={({ item }) => {
                const isMine = item.mine;
                return (
                  <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
                    <View style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
                      <Text style={[styles.messageText, isMine ? styles.messageTextMine : styles.messageTextOther]}>
                        {getMessageText(item)}
                      </Text>
                      <Text style={[styles.messageMeta, isMine ? styles.messageMetaMine : styles.messageMetaOther]}>
                        {formatMessageTime(item)}
                      </Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.centeredEmpty}>
                  <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.emptyText}>Aucun message pour le moment.</Text>
                </View>
              }
            />
          )}

          <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}> 
            <View style={styles.composerBox}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Écrivez votre message…"
                placeholderTextColor={colors.placeholder}
                multiline
                onFocus={() => scrollToBottom(true)}
                style={styles.input}
              />
              <Button
                title=""
                size="sm"
                isLoading={isSendingMessage}
                disabled={!canSend}
                onPress={handleSend}
                leftIcon={<Ionicons name="send" size={18} color={colors.white} />}
                style={styles.sendBtn}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentWrap: {
    flex: 1,
  },
  bannerWrap: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
  },
  annonceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.white,
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.sm,
  },
  annonceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  annonceInfo: {
    flex: 1,
    gap: 2,
  },
  annonceTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  annonceRef: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
    gap: spacing.sm,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messagesList: {
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '84%',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: 4,
  },
  messageBubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  messageBubbleOther: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.sm,
  },
  messageText: {
    fontSize: typography.sizes.md,
    lineHeight: 21,
  },
  messageTextMine: {
    color: colors.white,
  },
  messageTextOther: {
    color: colors.textPrimary,
  },
  messageMeta: {
    fontSize: typography.sizes.xs,
    alignSelf: 'flex-end',
  },
  messageMetaMine: {
    color: 'rgba(255,255,255,0.75)',
  },
  messageMetaOther: {
    color: colors.textMuted,
  },
  centeredEmpty: {
    paddingTop: spacing['3xl'],
    alignItems: 'center',
    gap: spacing.base,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  composerWrap: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.md,
  },
  composerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 52,
    minWidth: 52,
    height: 52,
    minHeight: 52,
    borderRadius: 26,
    paddingHorizontal: 0,
  },
});
