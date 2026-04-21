import { getRoleFlags } from '@/src/lib/roles';
import { useAuthStore } from '@/src/stores/auth.store';
import { useFavorisStore } from '@/src/stores/favoris.store';
import { useUserStore } from '@/src/stores/user.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import type { BienImmo, Localisation, RoleAnnonceur } from '@/src/types/annonce.types';
import { TYPE_ANNONCE_LABELS, TYPE_BIEN_LABELS } from '@/src/types/annonce.types';
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
import { formatDate, formatPrix } from '@/src/utils/format';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<RoleAnnonceur, string> = {
  PARTICULIER: 'Particulier',
  PROFESSIONNEL: 'Professionnel',
  MODERATEUR: 'Modérateur',
  ADMINISTRATEUR: 'Admin',
};
const ROLE_COLORS: Record<RoleAnnonceur, string> = {
  PARTICULIER: '#1A3C6E',
  PROFESSIONNEL: '#D4A017',
  MODERATEUR: '#6B7280',
  ADMINISTRATEUR: '#EF4444',
};

function formatFullLocalisation(loc?: Partial<Pick<Localisation, 'quartier' | 'commune' | 'prefecture'>> | null): string {
  const parts = [loc?.quartier, loc?.commune, loc?.prefecture].filter(Boolean) as string[];
  return parts.join(', ');
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
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
    <Animated.View style={[skeletonStyles.card, { opacity }]}>
      <View style={skeletonStyles.imageArea} />
      <View style={skeletonStyles.body}>
        <View style={skeletonStyles.line1} />
        <View style={skeletonStyles.line2} />
        <View style={skeletonStyles.line3} />
        <View style={skeletonStyles.lineFooter} />
      </View>
    </Animated.View>
  );
}
const SKELETON_DATA = [1, 2, 3, 4];
const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  imageArea: { width: '100%', height: 170, backgroundColor: colors.background },
  body: { padding: spacing.base, gap: spacing.sm },
  line1: { height: 10, width: '35%', backgroundColor: colors.border, borderRadius: 4 },
  line2: { height: 16, width: '80%', backgroundColor: colors.border, borderRadius: 4 },
  line3: { height: 14, width: '50%', backgroundColor: colors.border, borderRadius: 4 },
  lineFooter: { height: 10, width: '65%', backgroundColor: colors.border, borderRadius: 4, marginTop: 4 },
});

// ─── Annonce Card ─────────────────────────────────────────────────────────────

function AnnonceCard({
  item,
  isOwner,
  onRemove,
}: {
  item: BienImmo;
  isOwner?: boolean;
  onRemove: (id: number) => void;
}) {
  const medias = Array.isArray(item.medias) ? item.medias : [];
  const m0 = medias[0];
  const m1 = medias[1];
  const m2 = medias[2];
  const isLocation = item.typeAnnonce === 'LOCATION';
  const hasRevised = item.prixRevise != null;
  const locText =
    formatFullLocalisation(item.localisation) ||
    item.complementAdresse ||
    '';

  return (
    <TouchableOpacity
      style={cardStyles.card}
      activeOpacity={0.88}
      onPress={() => router.push(`/annonce/${item.id}`)}
    >
      <View style={cardStyles.imageGrid}>
        <View style={cardStyles.imageLeft}>
          {m0 ? (
            <Image source={{ uri: m0.url }} style={cardStyles.image} resizeMode="cover" />
          ) : (
            <View style={cardStyles.imagePlaceholder}>
              <Ionicons name="image-outline" size={30} color={colors.textMuted} />
            </View>
          )}
        </View>
        <View style={cardStyles.imageRight}>
          <View style={cardStyles.imageRightItem}>
            {m1 ? (
              <Image source={{ uri: m1.url }} style={cardStyles.image} resizeMode="cover" />
            ) : (
              <View style={cardStyles.imagePlaceholder}>
                <Ionicons name="image-outline" size={22} color={colors.textMuted} />
              </View>
            )}
          </View>
          <View style={cardStyles.imageRightItem}>
            {m2 ? (
              <Image source={{ uri: m2.url }} style={cardStyles.image} resizeMode="cover" />
            ) : (
              <View style={cardStyles.imagePlaceholder}>
                <Ionicons name="image-outline" size={22} color={colors.textMuted} />
              </View>
            )}
          </View>
        </View>

        <View style={[cardStyles.badge, { backgroundColor: isLocation ? colors.accent : colors.primary }]}>
          <Text style={cardStyles.badgeText}>{TYPE_ANNONCE_LABELS[item.typeAnnonce]}</Text>
        </View>
        {medias.length > 1 && (
          <View style={cardStyles.photosCount}>
            <Ionicons name="camera-outline" size={11} color={colors.white} />
            <Text style={cardStyles.photosCountText}>{medias.length}</Text>
          </View>
        )}
      </View>

      <View style={cardStyles.body}>
        <Text style={cardStyles.typeBien}>{TYPE_BIEN_LABELS[item.typeBien]}</Text>
        <Text style={cardStyles.titre} numberOfLines={2}>{item.titre}</Text>

        <View style={cardStyles.metaRow}>
          {item.annonceur?.role ? (
            <View style={[cardStyles.roleBadge, { backgroundColor: ROLE_COLORS[item.annonceur.role] + '18', borderColor: ROLE_COLORS[item.annonceur.role] + '60' }]}>
              <Text style={[cardStyles.roleText, { color: ROLE_COLORS[item.annonceur.role] }]}>
                {ROLE_LABELS[item.annonceur.role]}
              </Text>
            </View>
          ) : null}
          <Text style={cardStyles.refText} numberOfLines={1}>Réf. {item.referenceAnnonce}</Text>
        </View>

        <View style={cardStyles.prixRow}>
          {hasRevised ? (
            <>
              <Text style={cardStyles.prixRevise}>{formatPrix(item.prixRevise!)}</Text>
              <Text style={cardStyles.prixBarre}>{formatPrix(item.prix)}</Text>
            </>
          ) : (
            <Text style={cardStyles.prix}>{formatPrix(item.prix)}</Text>
          )}
          <Text style={cardStyles.currency}>GNF</Text>
          {isLocation && <Text style={cardStyles.prixSuffix}>/mois</Text>}
        </View>

        <View style={cardStyles.footer}>
          {item.surfaceTotal != null && (
            <View style={cardStyles.footerItem}>
              <Ionicons name="expand-outline" size={12} color={colors.textMuted} />
              <Text style={cardStyles.footerText}>{item.surfaceTotal} m²</Text>
            </View>
          )}
          {locText ? (
            <View style={cardStyles.footerItem}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={cardStyles.footerText} numberOfLines={1}>{locText}</Text>
            </View>
          ) : null}
          <Text style={cardStyles.footerDate}>{formatDate(item.dateCreation)}</Text>
        </View>

        <View style={cardStyles.actionsRow}>
          <View style={{ flex: 1 }} />
          {!isOwner && (
            <TouchableOpacity
              style={cardStyles.actionBtnOutline}
              onPress={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Retirer des favoris"
            >
              <Ionicons name="heart" size={18} color={colors.error} />
            </TouchableOpacity>
          )}
          {!isOwner && (
            <TouchableOpacity
              style={cardStyles.actionBtnSolid}
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/annonce/${item.id}`);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Voir l'annonce"
            >
              <Ionicons name="call-outline" size={18} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  imageGrid: {
    width: '100%',
    height: 170,
    backgroundColor: colors.background,
    position: 'relative',
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  imageLeft: {
    flex: 2,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  imageRight: {
    flex: 1,
    gap: spacing.xs,
  },
  imageRightItem: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm + spacing.xs,
    left: spacing.sm + spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: typography.sizes.xs, fontWeight: '700', color: colors.white,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  photosCount: {
    position: 'absolute',
    bottom: spacing.sm + spacing.xs,
    right: spacing.sm + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  photosCountText: { fontSize: typography.sizes.xs, color: colors.white, fontWeight: '600' },
  body: { padding: spacing.base, gap: 4 },
  typeBien: {
    fontSize: typography.sizes.sm, fontWeight: '600', color: colors.primary,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  titre: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.textPrimary, lineHeight: 22 },
  prixRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.xs },
  prix: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.primary },
  prixRevise: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.success },
  prixBarre: {
    fontSize: typography.sizes.sm, fontWeight: '500', color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  prixSuffix: { fontSize: typography.sizes.sm, fontWeight: '500', color: colors.textMuted },
  currency: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.primary },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginTop: spacing.xs, flexWrap: 'wrap',
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: typography.sizes.sm, color: colors.textMuted, maxWidth: 130 },
  footerDate: { fontSize: typography.sizes.xs, color: colors.textMuted, marginLeft: 'auto' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 1,
  },
  roleText: { fontSize: typography.sizes.xs, fontWeight: '700' },
  refText: { fontSize: typography.sizes.xs, color: colors.textMuted, flex: 1 },
  actionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtnOutline: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSolid: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Écran Favoris ────────────────────────────────────────────────────────────

export default function FavorisScreen() {
  const { favoris, isLoading, error, loadFavoris, removeFavori } = useFavorisStore();
  const { isAuthenticated, user } = useAuthStore();
  const { profile } = useUserStore();
  const { isProfessionnel } = getRoleFlags(profile?.roles ?? user?.roles, profile?.type ?? null);

  // ── Hooks (doivent tous être AVANT tout early return) ────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && !isProfessionnel) loadFavoris();
    }, [loadFavoris, isAuthenticated, isProfessionnel]),
  );

  const handleRemove = useCallback(async (id: number) => {
    await removeFavori(id);
  }, [removeFavori]);

  // ── Guards auth ──────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isProfessionnel) {
    return <Redirect href="/entreprise" />;
  }

  // ── Loading initial ──────────────────────────────────────────────────────────
  if (isLoading && favoris.length === 0) {
    return (
      <FlatList
        data={SKELETON_DATA}
        keyExtractor={(i) => String(i)}
        renderItem={() => <SkeletonCard />}
        scrollEnabled={false}
        contentContainerStyle={{ paddingTop: spacing.md, backgroundColor: colors.background }}
        style={{ backgroundColor: colors.background }}
      />
    );
  }

  // ── Erreur ───────────────────────────────────────────────────────────────────
  if (error && favoris.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadFavoris}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!isLoading && favoris.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="heart-outline" size={52} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Aucun favori</Text>
        <Text style={styles.emptySub}>
          Les annonces que vous aimez apparaîtront ici.{'\n'}
          Explorez et ajoutez des biens à vos favoris !
        </Text>
        <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/explore')}>
          <Ionicons name="search-outline" size={18} color={colors.white} />
          <Text style={styles.exploreBtnText}>Explorer les annonces</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Liste ────────────────────────────────────────────────────────────────────
  return (
    <FlatList
      data={favoris}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <AnnonceCard
          item={item}
          isOwner={!!user?.username && item.annonceur?.username === user.username}
          onRemove={handleRemove}
        />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={loadFavoris}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <Text style={styles.listCount}>
            {favoris.length} favori{favoris.length > 1 ? 's' : ''}
          </Text>
        </View>
      }
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: { fontSize: typography.sizes.md, color: colors.textMuted },
  errorText: { fontSize: typography.sizes.md, color: colors.error, textAlign: 'center' },
  retryBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryText: { fontSize: typography.sizes.md, fontWeight: '600', color: colors.white },

  emptyIconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#F0F4FA',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: typography.sizes.xl, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  emptySub: { fontSize: typography.sizes.md, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  exploreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  exploreBtnText: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.white },

  listContent: { paddingTop: spacing.md, paddingBottom: spacing['4xl'] },
  listHeader: { paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  listCount: { fontSize: typography.sizes.md, color: colors.textSecondary, fontWeight: '500' },
});
