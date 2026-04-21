import { useAdminStore } from '@/src/stores/admin.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import type { Signalement } from '@/src/types/admin.types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Carte signalement ────────────────────────────────────────────────────────

function SignalementCard({ item }: { item: Signalement }) {
  const { toggleAnnonceActif, togglingAnnonceIds } = useAdminStore();
  const isToggling = togglingAnnonceIds.has(item.annonceId);

  const handleDesactiver = () => {
    Alert.alert(
      'Désactiver l\'annonce',
      `Voulez-vous désactiver "${item.titreAnnonce}" suite à ce signalement ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Désactiver',
          style: 'destructive',
          onPress: () => toggleAnnonceActif(item.annonceId),
        },
      ],
    );
  };

  return (
    <View style={s.card}>
      {/* En-tête */}
      <View style={s.cardHeader}>
        <View style={s.motifBadge}>
          <Ionicons name="flag" size={12} color={colors.error} />
          <Text style={s.motifText} numberOfLines={1}>{item.motif}</Text>
        </View>
        {item.annule && (
          <View style={s.annuleBadge}>
            <Text style={s.annuleText}>Annulé</Text>
          </View>
        )}
        <Text style={s.date}>
          {new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      </View>

      {/* Annonce concernée */}
      <TouchableOpacity
        style={s.annonceRow}
        onPress={() => router.push(`/annonce/${item.annonceId}` as any)}
        activeOpacity={0.75}
      >
        <Ionicons name="home-outline" size={14} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={s.annonceTitle} numberOfLines={1}>{item.titreAnnonce}</Text>
          <Text style={s.annonceRef}>{item.referenceAnnonce}</Text>
        </View>
        <Ionicons name="open-outline" size={14} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Commentaire */}
      {item.commentaire ? (
        <View style={s.commentaire}>
          <Text style={s.commentaireText}>{item.commentaire}</Text>
        </View>
      ) : null}

      {/* Reporter */}
      <View style={s.reporterRow}>
        <Ionicons name="person-outline" size={13} color={colors.textMuted} />
        <Text style={s.reporterText}>Signalé par </Text>
        <TouchableOpacity onPress={() => router.push(`/admin/users/${item.reporterId}` as any)}>
          <Text style={s.reporterLink}>@{item.reporterUsername}</Text>
        </TouchableOpacity>
      </View>

      {/* Action */}
      <TouchableOpacity
        style={s.desactiverBtn}
        onPress={handleDesactiver}
        disabled={isToggling}
      >
        {isToggling ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <>
            <Ionicons name="eye-off-outline" size={15} color={colors.white} />
            <Text style={s.desactiverText}>Désactiver l'annonce</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <View style={s.pagination}>
      <TouchableOpacity
        style={[s.pageBtn, page === 0 && s.pageBtnDisabled]}
        onPress={onPrev}
        disabled={page === 0}
      >
        <Ionicons name="chevron-back" size={16} color={page === 0 ? colors.border : colors.primary} />
      </TouchableOpacity>
      <Text style={s.pageText}>
        Page {page + 1} / {totalPages}
      </Text>
      <TouchableOpacity
        style={[s.pageBtn, page >= totalPages - 1 && s.pageBtnDisabled]}
        onPress={onNext}
        disabled={page >= totalPages - 1}
      >
        <Ionicons name="chevron-forward" size={16} color={page >= totalPages - 1 ? colors.border : colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Écran signalements ───────────────────────────────────────────────────────

export default function AdminSignalements() {
  const {
    signalements,
    signalementsPage,
    signalementsTotalPages,
    signalementsTotalElements,
    isLoadingSignalements,
    signalementsError,
    loadSignalements,
  } = useAdminStore();

  useFocusEffect(
    useCallback(() => {
      loadSignalements(0);
    }, []),
  );

  return (
    <View style={s.root}>
      {/* Compteur */}
      <View style={s.summary}>
        <Ionicons name="flag-outline" size={15} color={colors.error} />
        <Text style={s.summaryText}>
          {signalementsTotalElements} signalement{signalementsTotalElements !== 1 ? 's' : ''}
        </Text>
      </View>

      {signalementsError ? (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
          <Text style={s.errorText}>{signalementsError}</Text>
        </View>
      ) : null}

      <FlatList
        data={signalements}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <SignalementCard item={item} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingSignalements}
            onRefresh={() => loadSignalements(0)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          isLoadingSignalements ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <View style={s.empty}>
              <Ionicons name="flag-outline" size={40} color={colors.border} />
              <Text style={s.emptyText}>Aucun signalement</Text>
            </View>
          )
        }
        ListFooterComponent={
          <Pagination
            page={signalementsPage}
            totalPages={signalementsTotalPages}
            onPrev={() => loadSignalements(signalementsPage - 1)}
            onNext={() => loadSignalements(signalementsPage + 1)}
          />
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  summary: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
  },
  summaryText: { fontSize: typography.sizes.sm, color: colors.textMuted, fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.errorLight, padding: spacing.md,
    marginHorizontal: spacing.base, marginBottom: spacing.sm, borderRadius: radius.md,
  },
  errorText: { fontSize: typography.sizes.sm, color: colors.error, flex: 1 },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
  card: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    marginBottom: spacing.md, padding: spacing.base, gap: spacing.sm,
    ...shadows.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  motifBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.errorLight, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full, flex: 1, marginRight: spacing.sm,
  },
  motifText: { fontSize: typography.sizes.xs, color: colors.error, fontWeight: '600', flex: 1 },
  date: { fontSize: typography.sizes.xs, color: colors.textMuted },
  annonceRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.background, padding: spacing.sm, borderRadius: radius.md,
  },
  annonceTitle: { fontSize: typography.sizes.sm, fontWeight: '600', color: colors.primary },
  annonceRef: { fontSize: typography.sizes.xs, color: colors.textMuted },
  commentaire: {
    backgroundColor: colors.background, padding: spacing.sm, borderRadius: radius.md,
    borderLeftWidth: 3, borderLeftColor: colors.border,
  },
  commentaireText: { fontSize: typography.sizes.sm, color: colors.textSecondary, fontStyle: 'italic' },
  reporterRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reporterText: { fontSize: typography.sizes.xs, color: colors.textMuted },
  reporterLink: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: '700' },
  desactiverBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.error,
    paddingVertical: spacing.sm, borderRadius: radius.md,
  },
  desactiverText: { color: colors.white, fontWeight: '700', fontSize: typography.sizes.sm },
  annuleBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full,
    backgroundColor: colors.textMuted + '1A', marginRight: 4,
  },
  annuleText: { fontSize: typography.sizes.xs, color: colors.textMuted, fontWeight: '700' },
  pagination: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.lg, paddingVertical: spacing.lg,
  },
  pageBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageText: { fontSize: typography.sizes.sm, color: colors.textSecondary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: spacing['3xl'], gap: spacing.md },
  emptyText: { fontSize: typography.sizes.md, color: colors.textMuted },
});
