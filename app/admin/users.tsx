import { getRoleLabel } from '@/src/lib/roles';
import { useAdminStore } from '@/src/stores/admin.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import {
    STATUT_USER_LABELS,
    type AdminUser,
    type StatutUtilisateur,
} from '@/src/types/admin.types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUT_COLORS: Record<StatutUtilisateur, string> = {
  ACTIF: colors.success,
  SUSPENDU: colors.error,
  INACTIF: colors.textMuted,
  EN_ATTENTE_ACTIVATION: colors.warning,
};

// ─── Carte utilisateur ────────────────────────────────────────────────────────

function UserCard({ item }: { item: AdminUser }) {
  const statut = item.statut as StatutUtilisateur;
  const mainRole = item.roles?.[0] ?? 'ROLE_PARTICULIER';
  const fullName = [item.prenom, item.nom].filter(Boolean).join(' ') || item.username;

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push(`/admin/users/${item.id}` as any)}
      activeOpacity={0.78}
    >
      <View style={s.cardLeft}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(item.username[0] ?? '?').toUpperCase()}</Text>
        </View>
      </View>
      <View style={s.cardBody}>
        <Text style={s.name} numberOfLines={1}>{fullName}</Text>
        <Text style={s.email} numberOfLines={1}>{item.email}</Text>
        <View style={s.metaRow}>
          <View style={[s.rolePill, { backgroundColor: colors.primary + '1A' }]}>
            <Text style={[s.rolePillText, { color: colors.primary }]}>
              {getRoleLabel(mainRole)}
            </Text>
          </View>
          {item.entrepriseNom ? (
            <Text style={s.entreprise} numberOfLines={1}>• {item.entrepriseNom}</Text>
          ) : null}
        </View>
      </View>
      <View style={s.cardRight}>
        <View style={[s.statutBadge, { backgroundColor: STATUT_COLORS[statut] + '1A' }]}>
          <Text style={[s.statutText, { color: STATUT_COLORS[statut] }]}>
            {STATUT_USER_LABELS[statut]}
          </Text>
        </View>
        {item.statutPieceIdentite === 'EN_ATTENTE' && (
          <View style={s.piecePill}>
            <Ionicons name="card-outline" size={11} color={colors.info} />
            <Text style={s.pieceText}>Pièce</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Écran liste utilisateurs ─────────────────────────────────────────────────

export default function AdminUsers() {
  const { users, isLoadingUsers, usersError, loadUsers } = useAdminStore();
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<StatutUtilisateur | 'ALL'>('ALL');

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, []),
  );

  const filtered = useMemo(() => {
    let list = users;
    if (filterStatut !== 'ALL') list = list.filter((u) => u.statut === filterStatut);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          `${u.prenom ?? ''} ${u.nom ?? ''}`.toLowerCase().includes(q),
      );
    }
    return list;
  }, [users, search, filterStatut]);

  const statuts: Array<StatutUtilisateur | 'ALL'> = ['ALL', 'ACTIF', 'SUSPENDU', 'EN_ATTENTE_ACTIVATION', 'INACTIF'];

  return (
    <View style={s.root}>
      {/* Barre de recherche */}
      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Rechercher..."
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filtres statut */}
      <View style={s.filtersRow}>
        {statuts.map((item) => {
          const active = filterStatut === item;
          const label = item === 'ALL' ? 'Tous' : STATUT_USER_LABELS[item as StatutUtilisateur];
          const col = item === 'ALL' ? colors.primary : STATUT_COLORS[item as StatutUtilisateur];
          return (
            <TouchableOpacity
              key={item}
              style={[s.filterChip, active && { backgroundColor: col, borderColor: col }]}
              onPress={() => setFilterStatut(item)}
              activeOpacity={0.75}
            >
              <Text style={[s.filterText, active && { color: colors.white }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Erreur */}
      {usersError ? (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
          <Text style={s.errorText}>{usersError}</Text>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(u) => u.id}
        renderItem={({ item }) => <UserCard item={item} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoadingUsers} onRefresh={loadUsers} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          isLoadingUsers ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <View style={s.empty}>
              <Ionicons name="people-outline" size={40} color={colors.border} />
              <Text style={s.emptyText}>Aucun utilisateur trouvé</Text>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    margin: spacing.base,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    padding: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  filterText: { fontSize: typography.sizes.sm, fontWeight: '600', color: colors.textSecondary },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
  },
  errorText: { fontSize: typography.sizes.sm, color: colors.error, flex: 1 },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardLeft: {},
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.primary },
  cardBody: { flex: 1, gap: 3 },
  name: { fontSize: typography.sizes.md, fontWeight: '600', color: colors.textPrimary },
  email: { fontSize: typography.sizes.sm, color: colors.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  rolePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  rolePillText: { fontSize: typography.sizes.xs, fontWeight: '700' },
  entreprise: { fontSize: typography.sizes.xs, color: colors.textMuted, flex: 1 },
  cardRight: { alignItems: 'flex-end', gap: 5 },
  statutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statutText: { fontSize: typography.sizes.xs, fontWeight: '700' },
  piecePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.infoLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  pieceText: { fontSize: 10, color: colors.info, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: spacing['3xl'], gap: spacing.md },
  emptyText: { fontSize: typography.sizes.md, color: colors.textMuted },
});
