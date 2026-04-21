import { buildMediaUrl } from '@/src/api/annonce.api';
import { useAdminStore } from '@/src/stores/admin.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import type { AdminAnnonce } from '@/src/types/admin.types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { formatDate, formatPrix } from '@/src/utils/format';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Carte annonce ────────────────────────────────────────────────────────────

function AnnonceCard({ item }: { item: AdminAnnonce }) {
  const { toggleAnnonceActif, togglingAnnonceIds } = useAdminStore();
  const isToggling = togglingAnnonceIds.has(item.id);

  const thumb = item.medias?.[0]?.url ? buildMediaUrl(item.medias[0].url) : null;
  const loc = [item.localisation?.quartier, item.localisation?.commune]
    .filter(Boolean)
    .join(', ');

  const handleToggle = () => {
    Alert.alert(
      item.actif ? 'Désactiver l\'annonce' : 'Activer l\'annonce',
      `${item.actif ? 'Désactiver' : 'Activer'} "${item.titre}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: item.actif ? 'Désactiver' : 'Activer',
          style: item.actif ? 'destructive' : 'default',
          onPress: () => toggleAnnonceActif(item.id),
        },
      ],
    );
  };

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push(`/annonce/${item.id}` as any)}
      activeOpacity={0.78}
    >
      {/* Image */}
      {thumb ? (
        <Image source={{ uri: thumb }} style={s.thumb} contentFit="cover" />
      ) : (
        <View style={[s.thumb, s.thumbPlaceholder]}>
          <Ionicons name="home-outline" size={28} color={colors.border} />
        </View>
      )}

      {/* Badge actif/inactif */}
      <View style={[s.actifBadge, { backgroundColor: item.actif ? colors.success : colors.error }]}>
        <Text style={s.actifText}>{item.actif ? 'Actif' : 'Inactif'}</Text>
      </View>

      {/* Corps */}
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.titre} numberOfLines={2}>{item.titre}</Text>
            <Text style={s.ref}>{item.referenceAnnonce}</Text>
          </View>
        </View>

        <Text style={s.prix}>{formatPrix(item.prix)}</Text>

        <View style={s.metaRow}>
          {loc ? (
            <View style={s.metaItem}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={s.metaText} numberOfLines={1}>{loc}</Text>
            </View>
          ) : null}
          <View style={s.metaItem}>
            <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
            <Text style={s.metaText}>{item.vueCount} vues</Text>
          </View>
          <Text style={s.dateText}>{formatDate(item.dateCreation)}</Text>
        </View>

        <View style={s.ownerRow}>
          <Ionicons name="person-outline" size={12} color={colors.textMuted} />
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/admin/users/${item.proprietaireId}` as any);
            }}
          >
            <Text style={s.ownerLink}>@{item.proprietaireUsername}</Text>
          </TouchableOpacity>
        </View>

        {/* Toggle */}
        <TouchableOpacity
          style={[s.toggleBtn, item.actif ? s.toggleBtnDesact : s.toggleBtnAct]}
          onPress={(e) => { e.stopPropagation(); handleToggle(); }}
          disabled={isToggling}
        >
          {isToggling ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons
                name={item.actif ? 'eye-off-outline' : 'eye-outline'}
                size={14}
                color={colors.white}
              />
              <Text style={s.toggleText}>
                {item.actif ? 'Désactiver' : 'Activer'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPrev, onNext }: {
  page: number; totalPages: number; onPrev: () => void; onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <View style={s.pagination}>
      <TouchableOpacity style={[s.pageBtn, page === 0 && s.pageBtnDisabled]} onPress={onPrev} disabled={page === 0}>
        <Ionicons name="chevron-back" size={16} color={page === 0 ? colors.border : colors.primary} />
      </TouchableOpacity>
      <Text style={s.pageText}>Page {page + 1} / {totalPages}</Text>
      <TouchableOpacity style={[s.pageBtn, page >= totalPages - 1 && s.pageBtnDisabled]} onPress={onNext} disabled={page >= totalPages - 1}>
        <Ionicons name="chevron-forward" size={16} color={page >= totalPages - 1 ? colors.border : colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Écran annonces ───────────────────────────────────────────────────────────

export default function AdminAnnonces() {
  const {
    annonces,
    annoncesPage,
    annoncesTotalPages,
    annoncesTotalItems,
    isLoadingAnnonces,
    annoncesError,
    loadAnnonces,
  } = useAdminStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIF' | 'INACTIF'>('ALL');

  useFocusEffect(
    useCallback(() => {
      loadAnnonces(0);
    }, []),
  );

  const filtered = useMemo(() => {
    let list = annonces;
    if (filter === 'ACTIF') list = list.filter((a) => a.actif);
    if (filter === 'INACTIF') list = list.filter((a) => !a.actif);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.titre.toLowerCase().includes(q) ||
          a.referenceAnnonce.toLowerCase().includes(q) ||
          a.proprietaireUsername.toLowerCase().includes(q),
      );
    }
    return list;
  }, [annonces, search, filter]);

  const filters: Array<{ key: 'ALL' | 'ACTIF' | 'INACTIF'; label: string }> = [
    { key: 'ALL', label: 'Toutes' },
    { key: 'ACTIF', label: 'Actives' },
    { key: 'INACTIF', label: 'Inactives' },
  ];

  return (
    <View style={s.root}>
      {/* Recherche */}
      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Titre, référence, propriétaire..."
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filtres */}
      <View style={s.filtersRow}>
        {filters.map(({ key, label }) => {
          const active = filter === key;
          const col = key === 'ACTIF' ? colors.success : key === 'INACTIF' ? colors.error : colors.primary;
          return (
            <TouchableOpacity
              key={key}
              style={[s.filterChip, active && { backgroundColor: col, borderColor: col }]}
              onPress={() => setFilter(key)}
            >
              <Text style={[s.filterText, active && { color: colors.white }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
        <Text style={s.totalText}>{annoncesTotalItems} au total</Text>
      </View>

      {annoncesError ? (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
          <Text style={s.errorText}>{annoncesError}</Text>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(a) => String(a.id)}
        renderItem={({ item }) => <AnnonceCard item={item} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingAnnonces}
            onRefresh={() => loadAnnonces(0)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          isLoadingAnnonces ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <View style={s.empty}>
              <Ionicons name="home-outline" size={40} color={colors.border} />
              <Text style={s.emptyText}>Aucune annonce trouvée</Text>
            </View>
          )
        }
        ListFooterComponent={
          search.trim()
            ? null
            : (
              <Pagination
                page={annoncesPage}
                totalPages={annoncesTotalPages}
                onPrev={() => loadAnnonces(annoncesPage - 1)}
                onNext={() => loadAnnonces(annoncesPage + 1)}
              />
            )
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.white, margin: spacing.base, marginBottom: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border, ...shadows.sm,
  },
  searchInput: { flex: 1, fontSize: typography.sizes.md, color: colors.textPrimary, padding: 0 },
  filtersRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingBottom: spacing.sm, flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  filterText: { fontSize: typography.sizes.sm, fontWeight: '600', color: colors.textSecondary },
  totalText: { fontSize: typography.sizes.xs, color: colors.textMuted, marginLeft: 'auto' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.errorLight, padding: spacing.md,
    marginHorizontal: spacing.base, marginBottom: spacing.sm, borderRadius: radius.md,
  },
  errorText: { fontSize: typography.sizes.sm, color: colors.error, flex: 1 },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
  card: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    marginBottom: spacing.md, overflow: 'hidden',
    ...shadows.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  thumb: { width: '100%', height: 150 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  actifBadge: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full,
  },
  actifText: { fontSize: 10, fontWeight: '700', color: colors.white },
  cardBody: { padding: spacing.md, gap: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  titre: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.textPrimary },
  ref: { fontSize: typography.sizes.xs, color: colors.textMuted },
  prix: { fontSize: typography.sizes.lg, fontWeight: '800', color: colors.primary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: typography.sizes.xs, color: colors.textMuted, maxWidth: 100 },
  dateText: { fontSize: typography.sizes.xs, color: colors.textMuted, marginLeft: 'auto' },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ownerLink: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: '600' },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm, borderRadius: radius.md,
  },
  toggleBtnDesact: { backgroundColor: colors.error },
  toggleBtnAct: { backgroundColor: colors.success },
  toggleText: { color: colors.white, fontWeight: '700', fontSize: typography.sizes.sm },
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
