import { useAdminStore } from '@/src/stores/admin.store';
import { useAuthStore } from '@/src/stores/auth.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Composant carte stat ──────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  badge,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: number;
  color: string;
  badge?: boolean;
}) {
  return (
    <View style={[s.statCard, badge && value > 0 && s.statCardAlert]}>
      <View style={[s.statIcon, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={s.statValue}>{value.toLocaleString('fr-FR')}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {badge && value > 0 && (
        <View style={[s.statBadge, { backgroundColor: color }]}>
          <Text style={s.statBadgeText}>{value}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Composant lien de navigation ─────────────────────────────────────────────

function NavItem({
  icon,
  label,
  sublabel,
  href,
  color = colors.primary,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel?: string;
  href: string;
  color?: string;
}) {
  return (
    <TouchableOpacity
      style={s.navItem}
      onPress={() => router.push(href as any)}
      activeOpacity={0.75}
    >
      <View style={[s.navIcon, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={s.navBody}>
        <Text style={s.navLabel}>{label}</Text>
        {sublabel ? <Text style={s.navSublabel}>{sublabel}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { stats, isLoadingStats, statsError, loadStats } = useAdminStore();

  const isAdmin = user?.roles?.includes('ROLE_ADMINISTRATEUR');

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, []),
  );

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoadingStats}
          onRefresh={loadStats}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* En-tête rôle */}
      <View style={s.header}>
        <View style={[s.roleBadge, { backgroundColor: isAdmin ? colors.error + '1A' : colors.warning + '1A' }]}>
          <Ionicons
            name={isAdmin ? 'shield-checkmark' : 'eye'}
            size={14}
            color={isAdmin ? colors.error : colors.warning}
          />
          <Text style={[s.roleText, { color: isAdmin ? colors.error : colors.warning }]}>
            {isAdmin ? 'Administrateur' : 'Modérateur'}
          </Text>
        </View>
        <Text style={s.username}>@{user?.username}</Text>
      </View>

      {/* Erreur */}
      {statsError ? (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={s.errorText}>{statsError}</Text>
        </View>
      ) : null}

      {/* Cards stats */}
      {isLoadingStats && !stats ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
      ) : stats ? (
        <>
          <Text style={s.sectionTitle}>Vue d'ensemble</Text>
          <View style={s.statsGrid}>
            <StatCard icon="people-outline" label="Utilisateurs" value={stats.totalUtilisateurs} color={colors.primary} />
            <StatCard icon="home-outline" label="Annonces actives" value={stats.totalAnnoncesActives} color={colors.success} />
            <StatCard icon="business-outline" label="Entreprises" value={stats.totalEntreprises} color={colors.accent} />
            <StatCard
              icon="flag-outline"
              label="Signalements"
              value={stats.totalSignalements}
              color={colors.error}
              badge
            />
            <StatCard
              icon="time-outline"
              label="En attente activation"
              value={stats.utilisateursEnAttenteActivation}
              color={colors.warning}
              badge
            />
            <StatCard
              icon="card-outline"
              label="Pièces en attente"
              value={stats.piecesIdentiteEnAttente}
              color={colors.info}
              badge
            />
          </View>
        </>
      ) : null}

      {/* Navigation */}
      <Text style={s.sectionTitle}>Gestion</Text>
      <View style={s.navSection}>
        <NavItem
          icon="people-outline"
          label="Utilisateurs"
          sublabel="Comptes, statuts, pièces d'identité"
          href="/admin/users"
          color={colors.primary}
        />
        <View style={s.separator} />
        <NavItem
          icon="flag-outline"
          label="Signalements"
          sublabel="Contenus signalés par les utilisateurs"
          href="/admin/signalements"
          color={colors.error}
        />
        <View style={s.separator} />
        <NavItem
          icon="home-outline"
          label="Annonces"
          sublabel="Toutes les annonces, activation/désactivation"
          href="/admin/annonces"
          color={colors.success}
        />
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.base, paddingBottom: spacing['4xl'] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  roleText: { fontSize: typography.sizes.sm, fontWeight: '700' },
  username: { fontSize: typography.sizes.sm, color: colors.textMuted, fontWeight: '500' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorText: { fontSize: typography.sizes.sm, color: colors.error, flex: 1 },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
    position: 'relative',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statCardAlert: {
    borderColor: colors.error + '40',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  statBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  statBadgeText: { fontSize: 10, fontWeight: '700', color: colors.white },
  navSection: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    ...shadows.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
  },
  navIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBody: { flex: 1, gap: 2 },
  navLabel: { fontSize: typography.sizes.md, fontWeight: '600', color: colors.textPrimary },
  navSublabel: { fontSize: typography.sizes.xs, color: colors.textMuted },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.base + 38 + spacing.md,
  },
});
