import { AlertBanner } from '@/src/components/ui/alert-banner';
import { ScreenContainer } from '@/src/components/ui/screen-container';
import { useAuthStore } from '@/src/stores/auth.store';
import { useMessagerieStore } from '@/src/stores/messagerie.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import type { ConversationDTO } from '@/src/types/messagerie.types';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import {
    Animated,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Skeleton Conversation ──────────────────────────────────────────────────────

function SkeletonConversation() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return (
    <Animated.View style={[skStyles.card, { opacity }]}>
      <View style={skStyles.avatar} />
      <View style={skStyles.body}>
        <View style={skStyles.line1} />
        <View style={skStyles.line2} />
        <View style={skStyles.line3} />
      </View>
    </Animated.View>
  );
}
const SKELETON_DATA = [1, 2, 3, 4, 5];
const skStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.white,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.background },
  body: { flex: 1, gap: spacing.sm },
  line1: { height: 12, width: '60%', backgroundColor: colors.background, borderRadius: 4 },
  line2: { height: 10, width: '40%', backgroundColor: colors.background, borderRadius: 4 },
  line3: { height: 10, width: '80%', backgroundColor: colors.background, borderRadius: 4 },
});

function getMessageDate(fallback?: string | null): string {
  const raw = fallback;
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function ConversationCard({ conversation }: { conversation: ConversationDTO }) {
  const displayName = conversation.otherParticipantNomComplet || conversation.otherParticipantUsername || 'Conversation';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'C';
  const unreadCount = conversation.unreadCount ?? 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/messagerie/${conversation.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Conversation avec ${displayName}`}
    >
      {conversation.otherParticipantPhotoProfil ? (
        <Image source={{ uri: conversation.otherParticipantPhotoProfil }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.date}>{getMessageDate(conversation.lastMessageAt ?? conversation.updatedAt)}</Text>
        </View>
        {conversation.annonceTitre ? (
          <Text style={styles.annonceTitle} numberOfLines={1}>
            {conversation.annonceTitre}
            {conversation.annonceReference ? ` · ${conversation.annonceReference}` : ''}
          </Text>
        ) : null}
        <View style={styles.cardBottomRow}>
          <Text style={styles.preview} numberOfLines={1}>{conversation.lastMessagePreview ?? 'Aucun message'}</Text>
          {unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ConversationsScreen() {
  const { isAuthenticated } = useAuthStore();
  const { conversations, isLoadingConversations, error, loadConversations, clearError } = useMessagerieStore();

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) loadConversations();
    }, [loadConversations, isAuthenticated]),
  );

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ScreenContainer scrollable={false} padded={false}>
      {error ? (
        <View style={styles.bannerWrap}>
          <AlertBanner message={error} variant="error" />
        </View>
      ) : null}

      {isLoadingConversations && conversations.length === 0 ? (
        <FlatList
          data={SKELETON_DATA}
          keyExtractor={(i) => String(i)}
          renderItem={() => <SkeletonConversation />}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      ) : conversations.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="chatbubbles-outline" size={42} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptySub}>Vos échanges apparaîtront ici quand vous contacterez un annonceur.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ConversationCard conversation={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingConversations}
              onRefresh={() => {
                clearError();
                loadConversations();
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bannerWrap: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.base,
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.white,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  date: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  annonceTitle: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  preview: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: typography.sizes.xs,
    color: colors.white,
    fontWeight: '700',
  },
});
