import { useAnnonceStore } from '@/src/stores/annonce.store';
import { useAuthStore } from '@/src/stores/auth.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import type { BienImmo, Localisation } from '@/src/types/annonce.types';
import { TYPE_ANNONCE_LABELS, TYPE_BIEN_LABELS } from '@/src/types/annonce.types';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
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
}: {
  item: BienImmo;
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
        {/* Badge type annonce */}
        <View style={[cardStyles.badge, { backgroundColor: isLocation ? colors.accent : colors.primary }]}>
          <Text style={cardStyles.badgeText}>{TYPE_ANNONCE_LABELS[item.typeAnnonce]}</Text>
        </View>
        {/* Badge inactif */}
        {!item.actif && (
          <View style={cardStyles.inactifBadge}>
            <Text style={cardStyles.inactifText}>Inactif</Text>
          </View>
        )}
        {/* Nombre de photos */}
        {medias.length > 1 && (
          <View style={cardStyles.photosCount}>
            <Ionicons name="camera-outline" size={12} color="#fff" />
            <Text style={cardStyles.photosCountText}>{medias.length}</Text>
          </View>
        )}
      </View>

      {/* Contenu */}
      <View style={cardStyles.body}>
        {/* Type de bien */}
        <Text style={cardStyles.typeBien}>{TYPE_BIEN_LABELS[item.typeBien]}</Text>

        {/* Titre */}
        <Text style={cardStyles.titre} numberOfLines={2}>{item.titre}</Text>

        {/* Prix */}
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

        {/* Infos bas */}
        <View style={cardStyles.footer}>
          {item.surfaceTotal != null && (
            <View style={cardStyles.footerItem}>
              <Ionicons name="expand-outline" size={13} color={colors.textMuted} />
              <Text style={cardStyles.footerText}>{item.surfaceTotal} m²</Text>
            </View>
          )}
          {locText ? (
            <View style={cardStyles.footerItem}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={cardStyles.footerText} numberOfLines={1}>{locText}</Text>
            </View>
          ) : null}
          <View style={[cardStyles.footerItem, { marginLeft: 'auto' }]}>
            <Text style={cardStyles.footerDate}>{formatDate(item.dateCreation)}</Text>
          </View>
        </View>

        {/* Stats vues / favoris */}
        {(item.vueCount != null || item.nbFavoris != null) && (
          <View style={cardStyles.statsRow}>
            {item.vueCount != null && (
              <View style={cardStyles.footerItem}>
                <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
                <Text style={cardStyles.footerText}>{item.vueCount} vue{item.vueCount !== 1 ? 's' : ''}</Text>
              </View>
            )}
            {item.nbFavoris != null && (
              <View style={cardStyles.footerItem}>
                <Ionicons name="heart-outline" size={13} color={colors.error} />
                <Text style={cardStyles.footerText}>{item.nbFavoris} favori{item.nbFavoris !== 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        )}

        {/* Référence */}
        <View style={cardStyles.refRow}>
          <Text style={cardStyles.ref}>Réf : {item.referenceAnnonce}</Text>
          <TouchableOpacity
            style={cardStyles.editBtn}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/publier',
                params: { editId: String(item.id) },
              })
            }
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Modifier l'annonce : ${item.titre}`}
          >
            <Ionicons name="create-outline" size={14} color={colors.primary} />
            <Text style={cardStyles.editBtnText}>Modifier</Text>
          </TouchableOpacity>
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
  image: {
    width: '100%',
    height: '100%',
  },
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
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inactifBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  inactifText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: '#fff',
  },
  photosCount: {
    position: 'absolute',
    bottom: spacing.sm + spacing.xs,
    right: spacing.sm + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  photosCountText: {
    fontSize: typography.sizes.xs,
    color: '#fff',
    fontWeight: '600',
  },
  body: {
    padding: spacing.base,
    gap: 4,
  },
  typeBien: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  titre: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  prixRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  prix: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  prixRevise: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.success,
  },
  prixBarre: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  prixSuffix: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.textMuted,
  },
  currency: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.primary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    maxWidth: 140,
  },
  footerDate: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  ref: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  editBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: '600',
  },
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

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconWrap}>
        <Ionicons name="home-outline" size={52} color={colors.textMuted} />
      </View>
      <Text style={emptyStyles.title}>Aucune annonce publiée</Text>
      <Text style={emptyStyles.subtitle}>
        Vous n'avez pas encore publié d'annonce.{'\n'}
        Commencez à vendre ou louer votre bien !
      </Text>
      <TouchableOpacity
        style={emptyStyles.btn}
        onPress={() => router.push('/(tabs)/publier')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={20} color={colors.white} />
        <Text style={emptyStyles.btnText}>Publier une annonce</Text>
      </TouchableOpacity>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F0F4FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  btnText: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.white,
  },
});

// ─── Écran Principal ──────────────────────────────────────────────────────────

export default function MesAnnoncesScreen() {
  const { isAuthenticated } = useAuthStore();
  const { mesAnnonces, isLoading, error, loadMesAnnonces } = useAnnonceStore();

  useEffect(() => {
    if (isAuthenticated) loadMesAnnonces();
  }, [isAuthenticated, loadMesAnnonces]);

  const onRefresh = useCallback(() => {
    loadMesAnnonces();
  }, [loadMesAnnonces]);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // ── Loading initial ──────────────────────────────────────────────────────────
  if (isLoading && mesAnnonces.length === 0) {
    return (
      <FlatList
        data={SKELETON_DATA}
        keyExtractor={(i) => String(i)}
        renderItem={() => <SkeletonCard />}
        scrollEnabled={false}
        contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
      />
    );
  }

  // ── Erreur ───────────────────────────────────────────────────────────────────
  if (error && mesAnnonces.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.error} />
        <Text style={styles.errorTitle}>Impossible de charger</Text>
        <Text style={styles.errorSub}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadMesAnnonces}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={mesAnnonces}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <AnnonceCard
          item={item}
        />
      )}
      contentContainerStyle={[
        styles.listContent,
        mesAnnonces.length === 0 && styles.listEmpty,
      ]}
      ListHeaderComponent={
        mesAnnonces.length > 0 ? (
          <View style={styles.header}>
            <Text style={styles.count}>
              {mesAnnonces.length} annonce{mesAnnonces.length > 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              style={styles.publishBtn}
              onPress={() => router.push('/(tabs)/publier')}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={styles.publishBtnText}>Publier</Text>
            </TouchableOpacity>
          </View>
        ) : null
      }
      ListEmptyComponent={<EmptyState />}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  errorTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorSub: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  retryText: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.white,
  },
  listContent: {
    paddingTop: spacing.base,
    paddingBottom: spacing['4xl'],
    backgroundColor: colors.background,
    minHeight: '100%',
  },
  listEmpty: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },
  count: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  publishBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.primary,
  },
});
