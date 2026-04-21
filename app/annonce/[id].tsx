import { addBienImmoMedias, deleteBienImmoMedia, MOTIF_LABELS, signalerAnnonce, type MotifSignalement } from '@/src/api/annonce.api';
import { useAnnonceStore } from '@/src/stores/annonce.store';
import { useAuthStore } from '@/src/stores/auth.store';
import { useFavorisStore } from '@/src/stores/favoris.store';
import { useMessagerieStore } from '@/src/stores/messagerie.store';
import { useUserStore } from '@/src/stores/user.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import {
    Annonceur,
    DOCUMENTS_LABELS,
    Media,
    RoleAnnonceur,
    TYPE_ANNONCE_LABELS,
    TYPE_BIEN_LABELS,
    TYPE_USAGE_LABELS,
} from '@/src/types/annonce.types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Linking,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { formatDate, formatPrix } from '@/src/utils/format';

const { width: SCREEN_W } = Dimensions.get('window');
const IMG_HEIGHT = Math.round(SCREEN_W * 0.72);
const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  const opacity = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  const b = (w: string | number, h: number, r = 6) => (
    <Animated.View style={{ width: w, height: h, borderRadius: r, backgroundColor: colors.border, opacity }} />
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Image placeholder */}
      <Animated.View style={{ width: SCREEN_W, height: IMG_HEIGHT, backgroundColor: colors.border, opacity }} />
      {/* Bloc titre */}
      <View style={{ backgroundColor: colors.white, padding: spacing.base, gap: spacing.sm, marginBottom: spacing.md }}>
        {b('40%', 10)}
        {b('75%', 20, 4)}
        {b('55%', 26, 4)}
        {b('45%', 10)}
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
        {b('60%', 10)}
      </View>
      {/* Description */}
      <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, marginHorizontal: spacing.base, marginBottom: spacing.md, padding: spacing.base, gap: spacing.sm }}>
        {b('35%', 12)}
        {b('100%', 10)}
        {b('90%', 10)}
        {b('70%', 10)}
      </View>
      {/* Points forts */}
      <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, marginHorizontal: spacing.base, marginBottom: spacing.md, padding: spacing.base, gap: spacing.sm }}>
        {b('40%', 12)}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {b('30%', 40, radius.md)}
          {b('30%', 40, radius.md)}
          {b('30%', 40, radius.md)}
        </View>
      </View>
    </View>
  );
}

// ─── Carrousel plein-écran avec flèches & overlay buttons ─────────────────────

function ImageCarousel({
  medias,
  isPro,
  onBack,
  onShare,
  isFav,
  onFav,
  canAdd,
  isAdding,
  onAdd,
  canDelete,
  isDeleting,
  onDelete,
  onIndexChange,
}: {
  medias: Pick<Media, 'id' | 'url'>[];
  isPro?: boolean;
  onBack: () => void;
  onShare: () => void;
  isFav: boolean;
  onFav?: () => void;
  canAdd?: boolean;
  isAdding?: boolean;
  onAdd?: () => void;
  canDelete?: boolean;
  isDeleting?: boolean;
  onDelete?: () => void;
  onIndexChange?: (index: number) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const urls = medias.map((m) => m.url);

  useEffect(() => {
    if (activeIndex <= urls.length - 1) return;
    const next = Math.max(0, urls.length - 1);
    setActiveIndex(next);
    onIndexChange?.(next);
    scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.length]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setActiveIndex(idx);
    onIndexChange?.(idx);
  };

  const goTo = (dir: -1 | 1) => {
    const next = Math.min(Math.max(activeIndex + dir, 0), urls.length - 1);
    scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
    setActiveIndex(next);
    onIndexChange?.(next);
  };

  const hasImages = urls.length > 0;

  return (
    <View style={cs.wrapper}>
      {hasImages ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {urls.map((uri, i) => (
            <Image key={i} source={{ uri }} style={cs.img} resizeMode="cover" />
          ))}
        </ScrollView>
      ) : (
        <View style={cs.placeholder}>
          <Ionicons name="image-outline" size={64} color={colors.textMuted} />
          <Text style={cs.placeholderText}>Aucune photo disponible</Text>
        </View>
      )}

      {/* Flèches de navigation */}
      {hasImages && urls.length > 1 && (
        <>
          <TouchableOpacity
            style={[cs.arrow, cs.arrowLeft]}
            onPress={() => goTo(-1)}
            disabled={activeIndex === 0}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={activeIndex === 0 ? 'rgba(255,255,255,0.35)' : '#fff'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[cs.arrow, cs.arrowRight]}
            onPress={() => goTo(1)}
            disabled={activeIndex === urls.length - 1}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={activeIndex === urls.length - 1 ? 'rgba(255,255,255,0.35)' : '#fff'}
            />
          </TouchableOpacity>
        </>
      )}

      {/* Badges bas-gauche : compteur + PRO */}
      <View style={cs.badgesRow}>
        {hasImages && urls.length > 1 && (
          <View style={cs.counterBadge}>
            <Text style={cs.counterText}>
              {activeIndex + 1}/{urls.length}
            </Text>
          </View>
        )}
        {isPro && (
          <View style={cs.proBadge}>
            <Text style={cs.proText}>PRO</Text>
          </View>
        )}
      </View>

      {/* Boutons overlay : retour, partage, favori */}
      <View style={[cs.topRow, { top: STATUS_H + 8 }]}>
        <TouchableOpacity style={cs.iconBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={cs.topRight}>
          <TouchableOpacity style={cs.iconBtn} onPress={onShare}>
            <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          {onFav !== undefined && (
            <TouchableOpacity style={cs.iconBtn} onPress={onFav}>
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={20}
                color={isFav ? '#E53935' : colors.textPrimary}
              />
            </TouchableOpacity>
          )}
          {canAdd ? (
            <TouchableOpacity style={cs.iconBtn} onPress={onAdd} disabled={isAdding}>
              {isAdding ? (
                <ActivityIndicator size="small" color={colors.textMuted} />
              ) : (
                <Ionicons name="images-outline" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ) : null}
          {canDelete ? (
            <TouchableOpacity style={cs.iconBtn} onPress={onDelete} disabled={isDeleting}>
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.textMuted} />
              ) : (
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  wrapper: { width: SCREEN_W, height: IMG_HEIGHT, backgroundColor: '#EAEDF3' },
  img: { width: SCREEN_W, height: IMG_HEIGHT },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: { fontSize: typography.sizes.md, color: colors.textMuted },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 38,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: radius.md,
  },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
  badgesRow: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  counterBadge: {
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  counterText: { fontSize: typography.sizes.sm, color: '#fff', fontWeight: '600' },
  proBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  proText: { fontSize: typography.sizes.sm, color: '#fff', fontWeight: '700' },
  topRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRight: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
});

// ─── "Très bonne affaire" badge ───────────────────────────────────────────────

function DealBadge({ label }: { label: string }) {
  return (
    <View style={db.wrap}>
      <Ionicons name="cash-outline" size={14} color="#10B981" />
      <Text style={db.txt}>{label}</Text>
    </View>
  );
}
const db = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D1FAE5',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  txt: { fontSize: typography.sizes.sm, color: '#059669', fontWeight: '600' },
});

// ─── Point fort ───────────────────────────────────────────────────────────────

function PointFort({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={pf.item}>
      <Ionicons name={icon} size={24} color={colors.primary} />
      <Text style={pf.label}>{label}</Text>
      <Text style={pf.value}>{value}</Text>
    </View>
  );
}
const pf = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', gap: 4, padding: spacing.sm },
  label: { fontSize: typography.sizes.xs, color: colors.textMuted, textAlign: 'center' },
  value: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[ir.row, last && { borderBottomWidth: 0 }]}>
      <View style={ir.iconWrap}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ir.label}>{label}</Text>
        <Text style={ir.value}>{value}</Text>
      </View>
    </View>
  );
}
const ir = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: typography.sizes.xs, color: colors.textMuted, marginBottom: 1 },
  value: { fontSize: typography.sizes.md, fontWeight: '600', color: colors.textPrimary },
});

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
}) {
  return (
    <View style={sec.card}>
      <View style={sec.header}>
        <Ionicons name={icon} size={17} color={colors.primary} />
        <Text style={sec.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}
const sec = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    padding: spacing.base,
    ...shadows.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.textPrimary },
});

const ROLE_LABELS: Record<RoleAnnonceur, string> = {
  PARTICULIER: 'Particulier',
  PROFESSIONNEL: 'Professionnel',
  MODERATEUR: 'Modérateur',
  ADMINISTRATEUR: 'Administrateur',
};

const ROLE_COLORS: Record<RoleAnnonceur, string> = {
  PARTICULIER: colors.primary,
  PROFESSIONNEL: colors.accent,
  MODERATEUR: colors.success,
  ADMINISTRATEUR: colors.error,
};

// ─── Carte Annonceur ──────────────────────────────────────────────────────────

function AnnonceurCard({ annonceur }: { annonceur: Annonceur }) {
  const nom = [annonceur.prenom, annonceur.nom].filter(Boolean).join(' ') || annonceur.username;
  const initiales = nom
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={ac.card}>
      <View style={ac.header}>
        <Ionicons name="person-circle-outline" size={17} color={colors.primary} />
        <Text style={ac.title}>Annonceur</Text>
      </View>
      <View style={ac.row}>
        {annonceur.photoProfil ? (
          <Image source={{ uri: annonceur.photoProfil }} style={ac.avatar} />
        ) : (
          <View style={ac.avatarPlaceholder}>
            <Text style={ac.avatarInitials}>{initiales}</Text>
          </View>
        )}
        <View style={ac.info}>
          <View style={ac.nameRow}>
            <Text style={ac.name}>{nom}</Text>
            {annonceur.role ? (
              <View style={[ac.roleBadge, { backgroundColor: ROLE_COLORS[annonceur.role] + '18', borderColor: ROLE_COLORS[annonceur.role] + '60' }]}>
                <Text style={[ac.roleText, { color: ROLE_COLORS[annonceur.role] }]}>
                  {ROLE_LABELS[annonceur.role]}
                </Text>
              </View>
            ) : null}
          </View>
          {nom !== annonceur.username && (
            <Text style={ac.username}>@{annonceur.username}</Text>
          )}
          {annonceur.telephone ? (
            <TouchableOpacity
              style={ac.phoneRow}
              onPress={() => Linking.openURL(`tel:${annonceur.telephone}`)}
            >
              <Ionicons name="call-outline" size={13} color={colors.primary} />
              <Text style={ac.phone}>{annonceur.telephone}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const ac = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    padding: spacing.base,
    ...shadows.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.textPrimary },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.white },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  name: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.textPrimary },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  roleText: { fontSize: typography.sizes.xs, fontWeight: '700' },
  username: { fontSize: typography.sizes.sm, color: colors.textMuted },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  phone: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: '600' },
});

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function AnnonceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentAnnonce, isLoading, error, loadAnnonceById, clearCurrentAnnonce } =
    useAnnonceStore();
  const { isAuthenticated, user } = useAuthStore();
  const { profile } = useUserStore();
  const { favorisIds, toggleFavori, togglingIds, loadFavoris, clearError: clearFavError, error: favError } = useFavorisStore();
  const { openOrCreateConversation, creatingConversationForAnnonceId } = useMessagerieStore();

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);
  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const [mediaActionError, setMediaActionError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [signalerVisible, setSignalerVisible] = useState(false);
  const [selectedMotif, setSelectedMotif] = useState<MotifSignalement | null>(null);
  const [commentaireSignal, setCommentaireSignal] = useState('');
  const [isSignaling, setIsSignaling] = useState(false);
  const [signalSuccess, setSignalSuccess] = useState(false);

  useEffect(() => {
    if (id) loadAnnonceById(Number(id));
    if (isAuthenticated) {
      loadFavoris();
    }
    return () => clearCurrentAnnonce();
  }, [id, isAuthenticated]);

  // Log favoris errors for debugging
  useEffect(() => {
    if (favError) {
      console.warn('Favoris error:', String(favError));
    }
  }, [favError]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <DetailSkeleton />
      </>
    );
  }

  // ── Erreur ───────────────────────────────────────────────────────────────────
  if (error || !currentAnnonce) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={52} color={colors.error} />
          <Text style={s.errorTitle}>Annonce introuvable</Text>
          <Text style={s.errorSub}>{error ?? 'Une erreur est survenue.'}</Text>
          <TouchableOpacity
            style={s.retryBtn}
            onPress={() => id && loadAnnonceById(Number(id))}
          >
            <Text style={s.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const a = currentAnnonce;
  const sortedMedias = [...a.medias].sort((x, y) => x.ordre - y.ordre);
  const isLocation = a.typeAnnonce === 'LOCATION';
  const hasRevised = a.prixRevise != null;

  const myUserId = user?.id ?? profile?.id ?? null;
  const ownershipKnown = !!myUserId;
  const canManageMedias = ownershipKnown ? myUserId === a.userId : false;
  const isOwnAnnonce = canManageMedias;
  const canAttemptManageMedias = isAuthenticated && (!ownershipKnown || myUserId === a.userId);
  const remainingMedias = Math.max(0, 10 - sortedMedias.length);

  // Points forts dynamiques
  const pointsForts: Array<{
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    value: string;
  }> = [];
  if (a.documentsDisponibles) {
    pointsForts.push({
      icon: 'shield-checkmark-outline',
      label: 'Documents',
      value: DOCUMENTS_LABELS[a.documentsDisponibles],
    });
  }
  if (a.typeUsage) {
    pointsForts.push({
      icon: 'person-outline',
      label: 'Usage',
      value: TYPE_USAGE_LABELS[a.typeUsage],
    });
  }
  if (a.surfaceTotal != null) {
    pointsForts.push({
      icon: 'expand-outline',
      label: 'Surface',
      value: `${a.surfaceTotal} m²`,
    });
  }

  const locLabel = a.localisation
    ? [a.localisation.quartier, a.localisation.commune, a.localisation.prefecture].filter(Boolean).join(', ')
    : a.complementAdresse ?? `Réf. ${a.localisationId}`;
  const codeZip = a.localisation?.prefecture ?? '';

  const handleToggleFavoris = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    if (isOwnAnnonce) return;
    // Évite les doubles appels : seule la carte concernée est verrouillée
    if (togglingIds.has(a.id)) return;
    clearFavError();
    await toggleFavori(a.id);
  };

  const handleDeleteActiveMedia = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    if (!canAttemptManageMedias) return;
    if (isDeletingMedia) return;

    const media = sortedMedias[activeMediaIndex];
    if (!media) return;

    try {
      setMediaActionError(null);
      setIsDeletingMedia(true);
      await deleteBienImmoMedia(a.id, media.id);
      await loadAnnonceById(a.id);
    } catch (err: any) {
      setMediaActionError(err?.message ?? 'Impossible de supprimer cette image.');
      // Best effort: suppression OK mais réponse/refresh KO
      try {
        await loadAnnonceById(a.id);
      } catch {
        // ignore
      }
    } finally {
      setIsDeletingMedia(false);
    }
  };

  const handleAddMedias = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    if (!canAttemptManageMedias) return;
    if (isAddingMedia || isDeletingMedia) return;
    if (remainingMedias === 0) {
      setMediaActionError('Maximum 10 photos par annonce.');
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: remainingMedias,
    });

    if (result.canceled || !result.assets?.length) return;

    const files = result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.uri.split('/').pop() ?? 'photo.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    }));

    try {
      setMediaActionError(null);
      setIsAddingMedia(true);
      await addBienImmoMedias(a.id, files);
      await loadAnnonceById(a.id);
    } catch (err: any) {
      setMediaActionError(err?.message ?? 'Impossible d’ajouter les photos.');
      // Best effort: upload OK mais réponse/refresh KO
      try {
        await loadAnnonceById(a.id);
      } catch {
        // ignore
      }
    } finally {
      setIsAddingMedia(false);
    }
  };

  const handleSubmitSignalement = async () => {
    if (!selectedMotif) return;
    setIsSignaling(true);
    try {
      await signalerAnnonce(a.id, { motif: selectedMotif, commentaire: commentaireSignal.trim() || undefined });
      setSignalSuccess(true);
      setSelectedMotif(null);
      setCommentaireSignal('');
      setTimeout(() => {
        setSignalerVisible(false);
        setSignalSuccess(false);
      }, 1800);
    } catch (err: any) {
      Alert.alert('Erreur', err?.message ?? 'Impossible d\'envoyer le signalement.');
    } finally {
      setIsSignaling(false);
    }
  };

  const handleShare = async () => {
    const typeLabel = TYPE_ANNONCE_LABELS[a.typeAnnonce] ?? a.typeAnnonce;
    const bienLabel = a.typeBien ? (TYPE_BIEN_LABELS[a.typeBien] ?? a.typeBien) : '';
    const prixStr = a.prix ? formatPrix(a.prix) : '';
    const localite = [a.quartier, a.commune, a.prefecture, a.region].filter(Boolean).join(', ');
    const title = [typeLabel, bienLabel].filter(Boolean).join(' – ');
    const deepLink = `anoventixapp://annonce/${a.id}`;
    const lines: string[] = [
      `🏠 ${title}`,
    ];
    if (a.titre) lines.push(a.titre);
    if (a.referenceAnnonce) lines.push(`🔖 Réf. ${a.referenceAnnonce}`);
    if (prixStr) lines.push(`💰 ${prixStr}`);
    if (localite) lines.push(`📍 ${localite}`);
    if (a.surface) lines.push(`📏 ${a.surface} m²`);
    lines.push('');
    lines.push(`Voir sur Anoventix : ${deepLink}`);
    try {
      await Share.share({
        title,
        message: lines.join('\n'),
        url: deepLink,
      });
    } catch {
      // annulé par l’utilisateur
    }
  };

  const handleOpenConversation = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    if (isOwnAnnonce) {
      return;
    }

    try {
      const conversation = await openOrCreateConversation({
        annonceId: a.id,
      });
      router.push(`/messagerie/${conversation.id}`);
    } catch {
      // message géré par le store/écran suivant
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Carrousel ─────────────────────────────────────────────── */}
        <ImageCarousel
          medias={sortedMedias}
          isPro={false}
          onBack={() => router.back()}
          onShare={handleShare}
          isFav={!isOwnAnnonce && isAuthenticated && favorisIds.includes(a.id)}
          onFav={isOwnAnnonce ? undefined : handleToggleFavoris}
          canAdd={canAttemptManageMedias}
          isAdding={isAddingMedia}
          onAdd={handleAddMedias}
          canDelete={canAttemptManageMedias && sortedMedias.length > 0}
          isDeleting={isDeletingMedia}
          onDelete={handleDeleteActiveMedia}
          onIndexChange={setActiveMediaIndex}
        />

        {mediaActionError ? (
          <View style={s.inlineError}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={s.inlineErrorText}>{mediaActionError}</Text>
          </View>
        ) : null}

        {/* ── Titre, prix & localisation ────────────────────────────── */}
        <View style={s.titleBlock}>
          {/* Badge type + stats vues/favoris */}
          <View style={s.typeBadgeRow}>
            <View style={[s.typeBadge, { backgroundColor: isLocation ? colors.accent : colors.primary }]}>
              <Text style={s.typeBadgeText}>{TYPE_ANNONCE_LABELS[a.typeAnnonce]}</Text>
            </View>
            {(a.vueCount != null || a.nbFavoris != null) && (
              <View style={s.statsRow}>
                {a.vueCount != null && (
                  <View style={s.statPill}>
                    <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
                    <Text style={s.statText}>{a.vueCount}</Text>
                  </View>
                )}
                {a.nbFavoris != null && (
                  <View style={s.statPill}>
                    <Ionicons name="heart-outline" size={12} color={colors.error} />
                    <Text style={s.statText}>{a.nbFavoris}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <Text style={s.titre}>{a.titre}</Text>

          <View style={s.prixRow}>
            {hasRevised ? (
              <>
                <Text style={s.prixPrincipal}>{formatPrix(a.prixRevise!)}</Text>
                <Text style={s.prixBarre}>{formatPrix(a.prix)}</Text>
              </>
            ) : (
              <Text style={s.prixPrincipal}>{formatPrix(a.prix)}</Text>
            )}
            {isLocation && <Text style={s.prixSuffix}>/mois</Text>}
          </View>

          {hasRevised && <DealBadge label="Très bonne affaire" />}

          {a.fraisHonoraire != null && (
            <Text style={s.frais}>+ {formatPrix(a.fraisHonoraire)} frais d'honoraires</Text>
          )}

          <View style={s.divider} />

          <View style={s.sellerRow}>
            <Ionicons name="location-sharp" size={15} color={colors.primary} />
            <Text style={s.sellerName}>{locLabel}</Text>
            {codeZip ? <Text style={s.sellerCode}>{codeZip}</Text> : null}
          </View>

          <View style={s.refRow}>
            <Ionicons name="barcode-outline" size={13} color={colors.textMuted} />
            <Text style={s.refText}>Réf. {a.referenceAnnonce}</Text>
          </View>
        </View>

        {/* ── Description ───────────────────────────────────────────── */}
        {a.description ? (
          <Section title="Description" icon="document-text-outline">
            <Text
              style={s.description}
              numberOfLines={descExpanded ? undefined : 4}
            >
              {a.description}
            </Text>
            {a.description.length > 160 && (
              <TouchableOpacity
                onPress={() => setDescExpanded((v) => !v)}
                style={s.voirPlusBtn}
                activeOpacity={0.7}
              >
                <Text style={s.voirPlusText}>
                  {descExpanded ? 'Voir moins' : 'Voir plus'}
                </Text>
                <Ionicons
                  name={descExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          </Section>
        ) : null}

        {/* ── Points forts ──────────────────────────────────────────── */}
        {pointsForts.length > 0 && (
          <Section title="Points forts" icon="thumbs-up-outline">
            <View style={s.pointsRow}>
              {pointsForts.map((p, i) => (
                <React.Fragment key={p.label}>
                  <PointFort icon={p.icon} label={p.label} value={p.value} />
                  {i < pointsForts.length - 1 && <View style={s.vertDiv} />}
                </React.Fragment>
              ))}
            </View>
          </Section>
        )}

        {/* ── Informations ──────────────────────────────────────────── */}
        <Section title="Informations" icon="information-circle-outline">
          <View style={s.infoGrid}>
            <PointFort icon="pricetag-outline" label="Type" value={TYPE_ANNONCE_LABELS[a.typeAnnonce]} />
            <View style={s.infoGridDividerV} />
            <PointFort icon="home-outline" label="Bien" value={TYPE_BIEN_LABELS[a.typeBien]} />
          </View>
          <View style={s.infoGridDividerH} />
          <View style={s.infoGrid}>
            <PointFort icon="calendar-outline" label="Publiée le" value={formatDate(a.dateCreation)} />
            <View style={s.infoGridDividerV} />
            <PointFort icon="refresh-outline" label="Modifiée le" value={formatDate(a.dateModification)} />
          </View>
          {a.nbFavoris != null && (
            <>
              <View style={s.infoGridDividerH} />
              <View style={s.infoGrid}>
                <PointFort icon="heart-outline" label="Favoris" value={String(a.nbFavoris)} />
                {a.vueCount != null && (
                  <>
                    <View style={s.infoGridDividerV} />
                    <PointFort icon="eye-outline" label="Vues" value={String(a.vueCount)} />
                  </>
                )}
              </View>
            </>
          )}
          {a.vueCount != null && a.nbFavoris == null && (
            <>
              <View style={s.infoGridDividerH} />
              <View style={s.infoGrid}>
                <PointFort icon="eye-outline" label="Vues" value={String(a.vueCount)} />
              </View>
            </>
          )}
        </Section>

        {/* ── Annonceur ─────────────────────────────────────────────── */}
        {a.annonceur && (
          <AnnonceurCard annonceur={a.annonceur} />
        )}

        {/* ── Signaler ──────────────────────────────────────────────── */}
        {isAuthenticated && !isOwnAnnonce && (
          <TouchableOpacity
            style={s.signalerLink}
            onPress={() => setSignalerVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={13} color={colors.textMuted} />
            <Text style={s.signalerLinkText}>Signaler cette annonce</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* ── Modal Signalement ─────────────────────────────────── */}
      <Modal
        visible={signalerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSignalerVisible(false)}
      >
        <TouchableOpacity style={s.signalerOverlay} activeOpacity={1} onPress={() => setSignalerVisible(false)} />
        <View style={s.signalerSheet}>
          <View style={s.signalerHandle} />
          <Text style={s.signalerTitle}>Signaler cette annonce</Text>
          {signalSuccess ? (
            <View style={s.signalerSuccess}>
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
              <Text style={s.signalerSuccessText}>Signalement envoyé, merci !</Text>
            </View>
          ) : (
            <>
              <Text style={s.signalerSubtitle}>Choisissez un motif</Text>
              <View style={s.motifGrid}>
                {(Object.keys(MOTIF_LABELS) as MotifSignalement[]).map((motif) => (
                  <TouchableOpacity
                    key={motif}
                    style={[s.motifChip, selectedMotif === motif && s.motifChipActive]}
                    onPress={() => setSelectedMotif(motif)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.motifChipText, selectedMotif === motif && s.motifChipTextActive]}>
                      {MOTIF_LABELS[motif]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={s.signalerInput}
                placeholder="Commentaire optionnel (500 caractères max)"
                placeholderTextColor={colors.placeholder}
                value={commentaireSignal}
                onChangeText={(t) => setCommentaireSignal(t.slice(0, 500))}
                multiline
                numberOfLines={3}
              />
              <View style={s.signalerActions}>
                <TouchableOpacity style={s.signalerCancel} onPress={() => setSignalerVisible(false)}>
                  <Text style={s.signalerCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.signalerSubmit, (!selectedMotif || isSignaling) && s.ctaDisabled]}
                  onPress={handleSubmitSignalement}
                  disabled={!selectedMotif || isSignaling}
                >
                  {isSignaling ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={s.signalerSubmitText}>Envoyer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* ── Barre d'action fixe (masquée pour le propriétaire) ───────── */}
      {!isOwnAnnonce && (
        <View style={s.cta}>
          <TouchableOpacity
            style={[s.ctaMessage, creatingConversationForAnnonceId === a.id && s.ctaDisabled]}
            onPress={handleOpenConversation}
            disabled={creatingConversationForAnnonceId === a.id}
          >
            {creatingConversationForAnnonceId === a.id ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="mail-outline" size={20} color={colors.white} />
                <Text style={s.ctaMessageText}>Message</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.ctaCall, !a.annonceur?.telephone && s.ctaDisabled]}
            onPress={() => {
              const tel = a.annonceur?.telephone;
              if (tel) Linking.openURL(`tel:${tel}`);
            }}
            disabled={!a.annonceur?.telephone}
          >
            <Ionicons name="call-outline" size={20} color={colors.white} />
            <Text style={s.ctaCallText}>Appeler</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

// ─── Styles globaux ───────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },

  // Bloc titre/prix
  titleBlock: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  titre: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 28,
  },
  prixRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  prixPrincipal: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '800',
    color: colors.textPrimary,
  },
  prixBarre: {
    fontSize: typography.sizes.md,
    fontWeight: '500',
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  prixSuffix: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.textMuted,
    alignSelf: 'flex-end',
    marginBottom: 3,
  },
  frais: { fontSize: typography.sizes.sm, color: colors.textMuted, fontStyle: 'italic' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },

  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error + '10',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.error + '40',
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.error,
    fontWeight: '600',
  },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sellerName: { fontSize: typography.sizes.sm, color: colors.textSecondary, flex: 1 },
  sellerCode: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  refText: { fontSize: typography.sizes.xs, color: colors.textMuted, letterSpacing: 0.3 },

  // Points forts
  pointsRow: { flexDirection: 'row', alignItems: 'stretch' },
  vertDiv: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },

  // Informations grid
  infoGrid: { flexDirection: 'row', alignItems: 'stretch' },
  infoGridDividerV: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  infoGridDividerH: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },

  // Description
  description: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  voirPlusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  voirPlusText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.primary,
  },

  // Badge type d'annonce + stats
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  typeBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: '600',
  },

  // États loading/erreur
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: { fontSize: typography.sizes.md, color: colors.textMuted },
  errorTitle: { fontSize: typography.sizes.xl, fontWeight: '700', color: colors.textPrimary },
  errorSub: { fontSize: typography.sizes.md, color: colors.textMuted, textAlign: 'center' },
  retryBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  retryText: { fontSize: typography.sizes.md, fontWeight: '600', color: colors.white },

  // CTA bas fixe
  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'android' ? spacing.base : spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.md,
  },
  ctaMessage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.textPrimary,
    borderRadius: radius.lg,
    paddingVertical: 15,
  },
  ctaMessageText: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.white },
  ctaCall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#E53935',
    borderRadius: radius.lg,
    paddingVertical: 15,
  },
  ctaCallText: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.white },
  ctaDisabled: { opacity: 0.45 },

  // Signaler
  signalerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: spacing.xl,
    paddingBottom: 100,
  },
  signalerLinkText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  signalerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  signalerSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'android' ? spacing.xl : spacing['2xl'],
    gap: spacing.md,
  },
  signalerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  signalerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  signalerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  motifGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  motifChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  motifChipActive: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  motifChipText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  motifChipTextActive: {
    color: colors.error,
    fontWeight: '700',
  },
  signalerInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  signalerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  signalerCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  signalerCancelText: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  signalerSubmit: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.lg,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  signalerSubmitText: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.white,
  },
  signalerSuccess: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  signalerSuccessText: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.success,
  },
});
