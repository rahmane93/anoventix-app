import { filterAnnonces, getPublicAnnonces } from '@/src/api/annonce.api';
import { getLocalisationsByRegion } from '@/src/api/localisation.api';
import { REGIONS_GUINEE, useAnnonceStore } from '@/src/stores/annonce.store';
import { useAuthStore } from '@/src/stores/auth.store';
import { useFavorisStore } from '@/src/stores/favoris.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import type { AnnonceFilterParams, BienImmo, Localisation, RoleAnnonceur } from '@/src/types/annonce.types';
import { TYPE_ANNONCE_LABELS, TYPE_BIEN_LABELS } from '@/src/types/annonce.types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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

// ─── Annonce Card ─────────────────────────────────────────────────────────────

function AnnonceCard({
  item,
  isFav,
  isFavBusy,
  isOwner,
  onPress,
  onToggleFav,
  onCall,
  style,
}: {
  item: BienImmo;
  isFav: boolean;
  isFavBusy?: boolean;
  isOwner?: boolean;
  onPress: () => void;
  onToggleFav: () => void;
  onCall: () => void;
  style?: object;
}) {
  const medias = Array.isArray(item.medias) ? item.medias : [];
  const m0 = medias[0];
  const isLocation = item.typeAnnonce === 'LOCATION';
  const isBail = item.typeAnnonce === 'BAIL';
  const hasRevised = item.prixRevise != null;
  const locText =
    formatFullLocalisation(item.localisation) ||
    item.complementAdresse ||
    '';

  return (
    <TouchableOpacity
      style={[cardStyles.card, style]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <View style={cardStyles.imageWrap}>
        {m0 ? (
          <Image source={{ uri: m0.url }} style={cardStyles.image} resizeMode="cover" />
        ) : (
          <View style={cardStyles.imagePlaceholder}>
            <Ionicons name="image-outline" size={40} color={colors.textMuted} />
          </View>
        )}
        <View style={[
          cardStyles.badge,
          { backgroundColor: isBail ? '#F0EAD6' : isLocation ? colors.accentSurface : colors.primarySurface },
        ]}>
          <Text style={[cardStyles.badgeText, {
            color: isBail ? '#7A5C2E' : isLocation ? colors.accent : colors.primary,
          }]}>
            {TYPE_ANNONCE_LABELS[item.typeAnnonce]}
          </Text>
        </View>
        {medias.length > 0 && (
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
                onToggleFav();
              }}
              activeOpacity={0.85}
              disabled={!!isFavBusy}
              accessibilityRole="button"
              accessibilityLabel={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              {isFavBusy ? (
                <ActivityIndicator size="small" color={colors.textMuted} />
              ) : (
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isFav ? colors.error : colors.textPrimary}
                />
              )}
            </TouchableOpacity>
          )}

          {!isOwner && (
            <TouchableOpacity
              style={cardStyles.actionBtnSolid}
              onPress={(e) => {
                e.stopPropagation();
                onCall();
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Contacter l'annonceur"
            >
              <Ionicons name="call-outline" size={18} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
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
  imageArea: { width: '100%', height: 170, backgroundColor: colors.divider },
  body: { padding: spacing.base, gap: spacing.sm },
  line1: { height: 10, width: '35%', backgroundColor: colors.border, borderRadius: 4 },
  line2: { height: 16, width: '80%', backgroundColor: colors.border, borderRadius: 4 },
  line3: { height: 14, width: '50%', backgroundColor: colors.border, borderRadius: 4 },
  lineFooter: { height: 10, width: '65%', backgroundColor: colors.border, borderRadius: 4, marginTop: 4 },
});

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
  imageWrap: {
    width: '100%',
    height: 210,
    backgroundColor: colors.background,
    position: 'relative',
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
    top: spacing.sm,
    left: spacing.sm,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
  photosCountText: { fontSize: typography.sizes.xs, color: '#fff', fontWeight: '600' },
  body: { padding: spacing.base, gap: 4 },
  typeBien: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.textMuted,
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
  prix: { fontSize: typography.sizes.xl, fontWeight: '800', color: colors.textPrimary },
  prixRevise: { fontSize: typography.sizes.xl, fontWeight: '800', color: colors.success },
  prixBarre: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  prixSuffix: { fontSize: typography.sizes.sm, fontWeight: '500', color: colors.textMuted },
  currency: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.textMuted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
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

// ─── Suggest Card (scroll horizontal "Vous pourriez aimer aussi") ─────────────

function SuggestCard({ item, onPress }: { item: BienImmo; onPress: () => void }) {
  const m0 = Array.isArray(item.medias) ? item.medias[0] : null;
  return (
    <TouchableOpacity style={scStyles.card} onPress={onPress} activeOpacity={0.85}>
      {m0?.url ? (
        <Image source={{ uri: m0.url }} style={scStyles.image} resizeMode="cover" />
      ) : (
        <View style={[scStyles.image, scStyles.placeholder]}>
          <Ionicons name="image-outline" size={24} color={colors.textMuted} />
        </View>
      )}
      <View style={scStyles.overlay}>
        <Text style={scStyles.overlayTitle} numberOfLines={2}>{item.titre}</Text>
      </View>
    </TouchableOpacity>
  );
}
const scStyles = StyleSheet.create({
  card: {
    width: 140,
    height: 110,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  overlayTitle: { fontSize: typography.sizes.xs, fontWeight: '600', color: '#fff' },
});

// ─── Helpers filtres ──────────────────────────────────────────────────────────

const EMPTY_FILTERS: AnnonceFilterParams = {};

function countActiveFilters(f: AnnonceFilterParams): number {
  return ([
    f.typeAnnonce,
    f.typeBien,
    f.typeUsage,
    f.prixMin != null ? true : null,
    f.prixMax != null ? true : null,
    f.region,
    f.prefecture,
    f.commune,
    f.quartier,
    f.sort,
  ] as unknown[]).filter(Boolean).length;
}

// ─── Modale Filtres ───────────────────────────────────────────────────────────

const TYPE_ANNONCE_CHIPS: AnnonceFilterParams['typeAnnonce'][] = ['VENTE', 'LOCATION', 'BAIL'] as const;
const TYPE_ANNONCE_CHIP_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  VENTE: 'home-outline',
  LOCATION: 'key-outline',
  BAIL: 'document-text-outline',
};
const TYPE_BIEN_CHIPS: AnnonceFilterParams['typeBien'][] = [
  'APPARTEMENT', 'MAISON', 'VILLA',
  'TERRAIN', 'MAGASIN', 'BUREAU', 'ENTREPOT', 'AUTRE',
] as const;
const SORT_OPTIONS = [
  { label: 'Prix \u2191', sort: 'prix', direction: 'asc' as const },
  { label: 'Prix \u2193', sort: 'prix', direction: 'desc' as const },
  { label: 'Plus récent', sort: 'dateCreation', direction: 'desc' as const },
];

function FilterModal({
  visible,
  draft,
  onChange,
  onApply,
  onClose,
}: {
  visible: boolean;
  draft: AnnonceFilterParams;
  onChange: (next: AnnonceFilterParams) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  const set = (patch: Partial<AnnonceFilterParams>) => onChange({ ...draft, ...patch });

  // ── Localisation cascade ─────────────────────────────────────────────────
  const [locByRegion, setLocByRegion] = useState<Localisation[]>([]);
  const [isLoadingLoc, setIsLoadingLoc] = useState(false);

  // Charge les localisations quand la modale s'ouvre et qu'une région est déjà sélectionnée
  useEffect(() => {
    if (visible && draft.region) {
      setIsLoadingLoc(true);
      getLocalisationsByRegion(draft.region)
        .then((list) => setLocByRegion(Array.isArray(list) ? list : []))
        .catch(() => setLocByRegion([]))
        .finally(() => setIsLoadingLoc(false));
    } else if (!visible) {
      // Reset quand on ferme
      if (!draft.region) setLocByRegion([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const prefectures = useMemo(
    () => [...new Set(locByRegion.map((l) => l.prefecture))].sort(),
    [locByRegion],
  );

  const communes = useMemo(
    () => [...new Set(locByRegion.filter((l) => l.prefecture === draft.prefecture).map((l) => l.commune))].sort(),
    [locByRegion, draft.prefecture],
  );

  const quartiers = useMemo(
    () => [...new Set(locByRegion.filter((l) => l.prefecture === draft.prefecture && l.commune === draft.commune).map((l) => l.quartier))].sort(),
    [locByRegion, draft.prefecture, draft.commune],
  );

  const handleRegionSelect = async (r: string) => {
    const same = draft.region === r;
    onChange({ ...draft, region: same ? undefined : r, prefecture: undefined, commune: undefined, quartier: undefined });
    if (same) { setLocByRegion([]); return; }
    setIsLoadingLoc(true);
    setLocByRegion([]);
    try {
      const list = await getLocalisationsByRegion(r);
      setLocByRegion(Array.isArray(list) ? list : []);
    } catch { setLocByRegion([]); }
    finally { setIsLoadingLoc(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={fm.overlay}>
        <View style={fm.sheet}>
          {/* En-tête */}
          <View style={fm.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-outline" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={fm.headerTitle}>Filtres</Text>
            <TouchableOpacity onPress={() => { onChange(EMPTY_FILTERS); setLocByRegion([]); }}>
              <Text style={fm.resetBtn}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={fm.body} keyboardShouldPersistTaps="handled">
            {/* Type de transaction */}
            <Text style={fm.sectionTitle}>Type de transaction</Text>
            <View style={fm.chipRow}>
              {TYPE_ANNONCE_CHIPS.map((t) => t && (
                <TouchableOpacity
                  key={t}
                  style={[fm.chip, draft.typeAnnonce === t && fm.chipActive]}
                  onPress={() => set({ typeAnnonce: draft.typeAnnonce === t ? undefined : t })}
                >
                  <Text style={[fm.chipText, draft.typeAnnonce === t && fm.chipTextActive]}>
                    {TYPE_ANNONCE_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Type de bien */}
            <Text style={fm.sectionTitle}>Type de bien</Text>
            <View style={fm.chipRow}>
              {TYPE_BIEN_CHIPS.map((t) => t && (
                <TouchableOpacity
                  key={t}
                  style={[fm.chip, draft.typeBien === t && fm.chipActive]}
                  onPress={() => set({ typeBien: draft.typeBien === t ? undefined : t })}
                >
                  <Text style={[fm.chipText, draft.typeBien === t && fm.chipTextActive]}>
                    {TYPE_BIEN_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Budget */}
            <Text style={fm.sectionTitle}>Budget (GNF)</Text>
            <View style={fm.priceRow}>
              <View style={fm.priceField}>
                <Text style={fm.priceLabel}>Minimum</Text>
                <TextInput
                  style={fm.priceInput}
                  keyboardType="numeric"
                  placeholder="ex : 50 000 000"
                  placeholderTextColor={colors.placeholder}
                  value={draft.prixMin != null ? String(draft.prixMin) : ''}
                  onChangeText={(v) => {
                    const n = parseInt(v.replace(/\D/g, ''), 10);
                    set({ prixMin: isNaN(n) ? undefined : n });
                  }}
                />
              </View>
              <View style={fm.priceSep} />
              <View style={fm.priceField}>
                <Text style={fm.priceLabel}>Maximum</Text>
                <TextInput
                  style={fm.priceInput}
                  keyboardType="numeric"
                  placeholder="ex : 300 000 000"
                  placeholderTextColor={colors.placeholder}
                  value={draft.prixMax != null ? String(draft.prixMax) : ''}
                  onChangeText={(v) => {
                    const n = parseInt(v.replace(/\D/g, ''), 10);
                    set({ prixMax: isNaN(n) ? undefined : n });
                  }}
                />
              </View>
            </View>

            {/* Localisation — cascade région → préfecture → commune → quartier */}
            <Text style={fm.sectionTitle}>Région</Text>
            <View style={fm.chipRow}>
              {REGIONS_GUINEE.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[fm.chip, draft.region === r && fm.chipActive]}
                  onPress={() => handleRegionSelect(r)}
                >
                  <Text style={[fm.chipText, draft.region === r && fm.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {isLoadingLoc && (
              <View style={fm.locLoadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={fm.locLoadingText}>Chargement des localisations…</Text>
              </View>
            )}

            {prefectures.length > 0 && (
              <>
                <Text style={fm.sectionTitle}>Préfecture</Text>
                <View style={fm.chipRow}>
                  {prefectures.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[fm.chip, draft.prefecture === p && fm.chipActive]}
                      onPress={() => onChange({ ...draft, prefecture: draft.prefecture === p ? undefined : p, commune: undefined, quartier: undefined })}
                    >
                      <Text style={[fm.chipText, draft.prefecture === p && fm.chipTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {communes.length > 0 && (
              <>
                <Text style={fm.sectionTitle}>Commune</Text>
                <View style={fm.chipRow}>
                  {communes.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[fm.chip, draft.commune === c && fm.chipActive]}
                      onPress={() => onChange({ ...draft, commune: draft.commune === c ? undefined : c, quartier: undefined })}
                    >
                      <Text style={[fm.chipText, draft.commune === c && fm.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {quartiers.length > 0 && (
              <>
                <Text style={fm.sectionTitle}>Quartier</Text>
                <View style={fm.chipRow}>
                  {quartiers.map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={[fm.chip, draft.quartier === q && fm.chipActive]}
                      onPress={() => onChange({ ...draft, quartier: draft.quartier === q ? undefined : q })}
                    >
                      <Text style={[fm.chipText, draft.quartier === q && fm.chipTextActive]}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Trier par */}
            <Text style={fm.sectionTitle}>Trier par</Text>
            <View style={fm.chipRow}>
              {SORT_OPTIONS.map((opt) => {
                const active = draft.sort === opt.sort && draft.direction === opt.direction;
                return (
                  <TouchableOpacity
                    key={`${opt.sort}-${opt.direction}`}
                    style={[fm.chip, active && fm.chipActive]}
                    onPress={() =>
                      active
                        ? set({ sort: undefined, direction: undefined })
                        : set({ sort: opt.sort, direction: opt.direction })
                    }
                  >
                    <Text style={[fm.chipText, active && fm.chipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Pied de page */}
          <View style={fm.footer}>
            <TouchableOpacity style={fm.applyBtn} onPress={onApply} activeOpacity={0.85}>
              <Text style={fm.applyText}>Appliquer les filtres</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const fm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '92%',
    paddingTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.textPrimary },
  resetBtn: { fontSize: typography.sizes.sm, color: colors.error, fontWeight: '600' },
  body: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl, gap: spacing.xs },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.sizes.sm, fontWeight: '500', color: colors.textSecondary },
  chipTextActive: { color: colors.white, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  priceField: { flex: 1, gap: 4 },
  priceLabel: { fontSize: typography.sizes.xs, color: colors.textMuted, fontWeight: '500' },
  priceInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  priceSep: { width: 16, height: 1, backgroundColor: colors.border, marginTop: spacing.lg },
  locLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  locLoadingText: { fontSize: typography.sizes.sm, color: colors.textMuted },
  locInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  applyText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: '700' },
});

// ─── Écran Explorer ───────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const { searchResults, isSearching, searchQuery, searchAnnonces, clearSearch } =
    useAnnonceStore();
  const { isAuthenticated, user } = useAuthStore();
  const { favorisIds, toggleFavori, togglingIds, loadFavoris } = useFavorisStore();
  const { q: initialQ } = useLocalSearchParams<{ q?: string }>();

  const [inputValue, setInputValue] = useState('');

  // ── Liste par défaut ──────────────────────────────────────────────────────────
  const [allAnnonces, setAllAnnonces] = useState<BienImmo[]>([]);
  const [allPage, setAllPage] = useState(0);
  const [allHasMore, setAllHasMore] = useState(true);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allError, setAllError] = useState<string | null>(null);
  const [allHasLoaded, setAllHasLoaded] = useState(false);

  // ── Filtres ───────────────────────────────────────────────────────────────────
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<AnnonceFilterParams>({});
  const [filterDraft, setFilterDraft] = useState<AnnonceFilterParams>({});
  const [filteredAnnonces, setFilteredAnnonces] = useState<BienImmo[]>([]);
  const [filteredPage, setFilteredPage] = useState(0);
  const [filteredHasMore, setFilteredHasMore] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isFilterLoadingMore, setIsFilterLoadingMore] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);

  const activeFilterCount = countActiveFilters(filters);
  const mode: 'all' | 'search' | 'filter' = searchQuery
    ? 'search'
    : activeFilterCount > 0
      ? 'filter'
      : 'all';

  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PAGE_SIZE = 20;

  // ── Loaders ───────────────────────────────────────────────────────────────────
  const loadAllPage = useCallback(async (pageToLoad: number, opts?: { replace?: boolean }) => {
    const replace = !!opts?.replace;
    if (replace) { setIsLoadingAll(true); setAllError(null); } else setIsLoadingMore(true);
    try {
      const page = await getPublicAnnonces(pageToLoad, PAGE_SIZE);
      const data = Array.isArray(page.data) ? page.data : [];
      setAllAnnonces((prev) => {
        if (replace) return data;
        const byId = new Map<number, BienImmo>(prev.map((a) => [a.id, a]));
        data.forEach((a) => byId.set(a.id, a));
        return Array.from(byId.values());
      });
      setAllPage(pageToLoad);
      const tp = typeof page.totalPages === 'number' ? page.totalPages : undefined;
      setAllHasMore(tp != null ? pageToLoad < tp - 1 : data.length >= PAGE_SIZE);
    } catch (e: any) {
      setAllError(e?.message ?? 'Impossible de charger les annonces.');
    } finally {
      setIsLoadingAll(false);
      setIsLoadingMore(false);
      if (replace) setAllHasLoaded(true);
    }
  }, []);

  const loadFilteredPage = useCallback(async (
    f: AnnonceFilterParams,
    pageToLoad: number,
    opts?: { replace?: boolean },
  ) => {
    const replace = !!opts?.replace;
    if (replace) { setIsFilterLoading(true); setFilterError(null); } else setIsFilterLoadingMore(true);
    try {
      const page = await filterAnnonces({ ...f, page: pageToLoad, size: PAGE_SIZE });
      const data = Array.isArray(page.data) ? page.data : [];
      setFilteredAnnonces((prev) => {
        if (replace) return data;
        const byId = new Map<number, BienImmo>(prev.map((a) => [a.id, a]));
        data.forEach((a) => byId.set(a.id, a));
        return Array.from(byId.values());
      });
      setFilteredPage(pageToLoad);
      const tp = typeof page.totalPages === 'number' ? page.totalPages : undefined;
      setFilteredHasMore(tp != null ? pageToLoad < tp - 1 : data.length >= PAGE_SIZE);
    } catch (e: any) {
      setFilterError(e?.message ?? 'Impossible de charger les résultats.');
    } finally { setIsFilterLoading(false); setIsFilterLoadingMore(false); }
  }, []);

  // ── Effets ────────────────────────────────────────────────────────────────────
  useEffect(() => { loadAllPage(0, { replace: true }); }, [loadAllPage]);
  useEffect(() => { if (isAuthenticated) loadFavoris(); }, [isAuthenticated, loadFavoris]);

  useEffect(() => {
    if (initialQ?.trim()) { setInputValue(initialQ); searchAnnonces(initialQ); }
  }, [initialQ]); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(useCallback(() => {
    if (!initialQ) { setInputValue(''); clearSearch(); }
  }, [initialQ, clearSearch]));

  useFocusEffect(useCallback(() => {
    if (!searchQuery && !allHasLoaded && !isLoadingAll) {
      loadAllPage(0, { replace: true });
    }
  }, [searchQuery, allHasLoaded, isLoadingAll, loadAllPage]));

  // ── Handlers texte ────────────────────────────────────────────────────────────
  const handleChangeText = useCallback((text: string) => {
    setInputValue(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) { clearSearch(); return; }
    debounceRef.current = setTimeout(() => { searchAnnonces(text); }, 500);
  }, [searchAnnonces, clearSearch]);

  const handleClear = useCallback(() => {
    setInputValue('');
    clearSearch();
    inputRef.current?.focus();
  }, [clearSearch]);

  const handleSubmit = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inputValue.trim()) searchAnnonces(inputValue);
    Keyboard.dismiss();
  }, [inputValue, searchAnnonces]);

  // ── Handlers filtres ──────────────────────────────────────────────────────────
  const handleOpenFilter = useCallback(() => {
    setFilterDraft(filters);
    setFilterVisible(true);
  }, [filters]);

  const handleApplyFilter = useCallback(() => {
    setFilterVisible(false);
    const next = filterDraft;
    setFilters(next);
    if (countActiveFilters(next) > 0) {
      setFilteredAnnonces([]);
      setFilteredPage(0);
      loadFilteredPage(next, 0, { replace: true });
    }
  }, [filterDraft, loadFilteredPage]);

  const handleRemoveFilter = useCallback((keys: (keyof AnnonceFilterParams)[]) => {
    const next = { ...filters };
    keys.forEach((k) => delete next[k]);
    setFilters(next);
    if (countActiveFilters(next) > 0) {
      setFilteredAnnonces([]);
      setFilteredPage(0);
      loadFilteredPage(next, 0, { replace: true });
    }
  }, [filters, loadFilteredPage]);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setFilteredAnnonces([]);
    setFilteredPage(0);
    setFilteredHasMore(true);
    setFilterError(null);
  }, []);

  const handleQuickTypeFilter = useCallback((type: AnnonceFilterParams['typeAnnonce']) => {
    const next: AnnonceFilterParams = filters.typeAnnonce === type ? {} : { typeAnnonce: type };
    setFilters(next);
    setFilterDraft(next);
    setFilteredAnnonces([]);
    setFilteredPage(0);
    if (countActiveFilters(next) > 0) {
      loadFilteredPage(next, 0, { replace: true });
    }
  }, [filters.typeAnnonce, loadFilteredPage]);

  // ── Rendu carte ───────────────────────────────────────────────────────────────
  const renderCard = useCallback((item: BienImmo) => (
    <AnnonceCard
      item={item}
      isFav={favorisIds.includes(item.id)}
      isFavBusy={togglingIds.has(item.id)}
      isOwner={isAuthenticated && !!user?.username && item.annonceur?.username === user.username}
      onPress={() => router.push(`/annonce/${item.id}`)}
      onToggleFav={() => {
        if (!isAuthenticated) { router.push('/(auth)/login'); return; }
        if (item.annonceur?.username === user?.username) return;
        toggleFavori(item.id);
      }}
      onCall={() => router.push(`/annonce/${item.id}`)}
    />
  ), [favorisIds, togglingIds, isAuthenticated, user, toggleFavori]);

  // ── Suggestions "aimer aussi" ──────────────────────────────────────────────────
  const suggestedAnnonces = useMemo(() => {
    if (allAnnonces.length < 2) return [];
    const firstType = allAnnonces[0].typeAnnonce;
    const sameType = allAnnonces.slice(1).filter((a) => a.typeAnnonce === firstType);
    const result = sameType.length >= 3 ? sameType : allAnnonces.slice(1);
    return result.slice(0, 8);
  }, [allAnnonces]);

  // ── Barre de recherche ────────────────────────────────────────────────────────
  const filterBtnActive = activeFilterCount > 0;
  const SearchBar = (
    <View style={styles.searchBarWrap}>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Rechercher une annonce…"
            placeholderTextColor={colors.placeholder}
            value={inputValue}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {inputValue.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, filterBtnActive && styles.filterBtnActive]}
          onPress={handleOpenFilter}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={20} color={filterBtnActive ? colors.white : colors.textPrimary} />
          {filterBtnActive && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Catégories rapides */}
      {mode !== 'search' && (
        <View style={styles.quickChipsRow}>
          {TYPE_ANNONCE_CHIPS.map((t) => t && (
            <TouchableOpacity
              key={t}
              style={[styles.quickChip, filters.typeAnnonce === t && styles.quickChipActive]}
              onPress={() => handleQuickTypeFilter(t)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={TYPE_ANNONCE_CHIP_ICONS[t]}
                size={14}
                color={filters.typeAnnonce === t ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.quickChipText, filters.typeAnnonce === t && styles.quickChipTextActive]}>
                {TYPE_ANNONCE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Chips filtres actifs */}
      {mode === 'filter' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeChipsRow}
        >
          {filters.typeAnnonce && (
            <TouchableOpacity style={styles.activeChip} onPress={() => handleRemoveFilter(['typeAnnonce'])}>
              <Text style={styles.activeChipText}>{TYPE_ANNONCE_LABELS[filters.typeAnnonce]}</Text>
              <Ionicons name="close" size={12} color={colors.primary} />
            </TouchableOpacity>
          )}
          {filters.typeBien && (
            <TouchableOpacity style={styles.activeChip} onPress={() => handleRemoveFilter(['typeBien'])}>
              <Text style={styles.activeChipText}>{TYPE_BIEN_LABELS[filters.typeBien]}</Text>
              <Ionicons name="close" size={12} color={colors.primary} />
            </TouchableOpacity>
          )}
          {filters.prixMin != null && (
            <TouchableOpacity style={styles.activeChip} onPress={() => handleRemoveFilter(['prixMin'])}>
              <Text style={styles.activeChipText}>Min {filters.prixMin.toLocaleString('fr-FR')} GNF</Text>
              <Ionicons name="close" size={12} color={colors.primary} />
            </TouchableOpacity>
          )}
          {filters.prixMax != null && (
            <TouchableOpacity style={styles.activeChip} onPress={() => handleRemoveFilter(['prixMax'])}>
              <Text style={styles.activeChipText}>Max {filters.prixMax.toLocaleString('fr-FR')} GNF</Text>
              <Ionicons name="close" size={12} color={colors.primary} />
            </TouchableOpacity>
          )}
          {filters.quartier && (
            <TouchableOpacity style={styles.activeChip} onPress={() => handleRemoveFilter(['quartier'])}>
              <Text style={styles.activeChipText}>{filters.quartier}</Text>
              <Ionicons name="close" size={12} color={colors.primary} />
            </TouchableOpacity>
          )}
          {filters.commune && (
            <TouchableOpacity style={styles.activeChip} onPress={() => handleRemoveFilter(['commune'])}>
              <Text style={styles.activeChipText}>{filters.commune}</Text>
              <Ionicons name="close" size={12} color={colors.primary} />
            </TouchableOpacity>
          )}
          {filters.prefecture && (
            <TouchableOpacity style={styles.activeChip} onPress={() => handleRemoveFilter(['prefecture'])}>
              <Text style={styles.activeChipText}>{filters.prefecture}</Text>
              <Ionicons name="close" size={12} color={colors.primary} />
            </TouchableOpacity>
          )}
          {filters.region && (
            <TouchableOpacity style={styles.activeChip} onPress={() => handleRemoveFilter(['region'])}>
              <Text style={styles.activeChipText}>{filters.region}</Text>
              <Ionicons name="close" size={12} color={colors.primary} />
            </TouchableOpacity>
          )}
          {filters.sort && (
            <TouchableOpacity style={styles.activeChip} onPress={() => handleRemoveFilter(['sort', 'direction'])}>
              <Text style={styles.activeChipText}>
                {filters.sort === 'prix'
                  ? filters.direction === 'asc' ? 'Prix \u2191' : 'Prix \u2193'
                  : 'Plus r\u00e9cent'}
              </Text>
              <Ionicons name="close" size={12} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.activeChipReset} onPress={handleResetFilters}>
            <Text style={styles.activeChipResetText}>Tout effacer</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );

  // ── Corps ────────────────────────────────────────────────────────────────────
  const renderBody = () => {
    if (mode === 'filter') {
      if (isFilterLoading && filteredAnnonces.length === 0) {
        return (
          <FlatList
            data={SKELETON_DATA}
            keyExtractor={(i) => String(i)}
            renderItem={() => <SkeletonCard />}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        );
      }
      if (filterError && filteredAnnonces.length === 0) {
        return (
          <View style={styles.stateContainer}>
            <View style={styles.stateIconWrap}><Ionicons name="cloud-offline-outline" size={52} color={colors.textMuted} /></View>
            <Text style={styles.stateTitle}>Erreur</Text>
            <Text style={styles.stateSub}>{filterError}</Text>
            <TouchableOpacity style={styles.tipChip} onPress={() => loadFilteredPage(filters, 0, { replace: true })} activeOpacity={0.85}>
              <Text style={styles.tipText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        );
      }
      if (!isFilterLoading && filteredAnnonces.length === 0) {
        return (
          <View style={styles.stateContainer}>
            <View style={styles.stateIconWrap}><Ionicons name="search-outline" size={52} color={colors.textMuted} /></View>
            <Text style={styles.stateTitle}>Aucun résultat</Text>
            <Text style={styles.stateSub}>Aucune annonce ne correspond à vos filtres.</Text>
            <TouchableOpacity style={styles.tipChip} onPress={handleResetFilters} activeOpacity={0.85}>
              <Text style={styles.tipText}>Réinitialiser les filtres</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <FlatList
          data={filteredAnnonces}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => renderCard(item)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {filteredAnnonces.length} résultat{filteredAnnonces.length > 1 ? 's' : ''}
              </Text>
            </View>
          }
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (isFilterLoadingMore || isFilterLoading || !filteredHasMore) return;
            loadFilteredPage(filters, filteredPage + 1);
          }}
          ListFooterComponent={
            isFilterLoadingMore ? (
              <View style={{ paddingVertical: spacing.md }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (mode === 'search') {
      if (isSearching) {
        return (
          <FlatList
            data={SKELETON_DATA}
            keyExtractor={(i) => String(i)}
            renderItem={() => <SkeletonCard />}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        );
      }
      if (searchResults.length === 0) {
        return (
          <View style={styles.stateContainer}>
            <View style={styles.stateIconWrap}>
              <Ionicons name="file-tray-outline" size={52} color={colors.textMuted} />
            </View>
            <Text style={styles.stateTitle}>Aucun résultat</Text>
            <Text style={styles.stateSub}>
              Aucune annonce ne correspond à{'\n'}
              <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                « {searchQuery} »
              </Text>
            </Text>
          </View>
        );
      }
      return (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => renderCard(item)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} pour{' '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  « {searchQuery} »
                </Text>
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      );
    }

    // Mode par défaut: toutes les annonces
    if (isLoadingAll && allAnnonces.length === 0) {
      return (
        <FlatList
          data={SKELETON_DATA}
          keyExtractor={(i) => String(i)}
          renderItem={() => <SkeletonCard />}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      );
    }
    if (allError && allAnnonces.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <View style={styles.stateIconWrap}>
            <Ionicons name="cloud-offline-outline" size={52} color={colors.textMuted} />
          </View>
          <Text style={styles.stateTitle}>Impossible de charger</Text>
          <Text style={styles.stateSub}>{allError}</Text>
          <TouchableOpacity style={styles.tipChip} onPress={() => loadAllPage(0, { replace: true })} activeOpacity={0.85}>
            <Text style={styles.tipText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (!isLoadingAll && allAnnonces.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <View style={styles.stateIconWrap}>
            <Ionicons name="file-tray-outline" size={52} color={colors.textMuted} />
          </View>
          <Text style={styles.stateTitle}>Aucune annonce</Text>
          <Text style={styles.stateSub}>Il n’y a aucune annonce à afficher pour le moment.</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={allAnnonces}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => renderCard(item)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeaderAll}>
            <Text style={styles.listHeaderTitle}>Annonces récentes</Text>
            <TouchableOpacity onPress={() => loadAllPage(0, { replace: true })} activeOpacity={0.7}>
              <Text style={styles.listHeaderLink}>Plus d’annonces</Text>
            </TouchableOpacity>
          </View>
        }
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (isLoadingMore || isLoadingAll || !allHasMore) return;
          loadAllPage(allPage + 1);
        }}
        ListFooterComponent={
          <>
            {isLoadingMore && (
              <View style={{ paddingVertical: spacing.md }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
            {suggestedAnnonces.length > 0 && (
              <View style={styles.suggestSection}>
                <Text style={styles.suggestTitle}>Vous pourriez aimer aussi</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestRow}
                >
                  {suggestedAnnonces.map((a) => (
                    <SuggestCard key={a.id} item={a} onPress={() => router.push(`/annonce/${a.id}`)} />
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {SearchBar}
      {renderBody()}
      <FilterModal
        visible={filterVisible}
        draft={filterDraft}
        onChange={setFilterDraft}
        onApply={handleApplyFilter}
        onClose={() => setFilterVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBarWrap: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    ...shadows.sm,
    gap: spacing.sm,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchIcon: { marginRight: 2 },
  searchInput: { flex: 1, fontSize: typography.sizes.md, color: colors.textPrimary, padding: 0 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  activeChipsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '12',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  activeChipText: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: '600' },
  activeChipReset: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.error + '60',
    backgroundColor: colors.error + '10',
  },
  activeChipResetText: { fontSize: typography.sizes.xs, color: colors.error, fontWeight: '600' },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  stateIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  stateTitle: { fontSize: typography.sizes.xl, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  stateSub: { fontSize: typography.sizes.md, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  tipsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm },
  tipChip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  tipText: { fontSize: typography.sizes.sm, fontWeight: '500', color: colors.primary },
  listContent: { paddingTop: spacing.md, paddingBottom: spacing['4xl'] },
  resultsHeader: { paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  resultsCount: { fontSize: typography.sizes.md, color: colors.textSecondary },
  quickChipsRow: { flexDirection: 'row', paddingVertical: spacing.xs, gap: spacing.sm },
  quickChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  quickChipActive: { backgroundColor: colors.accentSurface, borderColor: colors.accent },
  quickChipText: { fontSize: typography.sizes.sm, fontWeight: '600', color: colors.textSecondary },
  quickChipTextActive: { color: colors.accent },
  listHeaderAll: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listHeaderTitle: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.textPrimary },
  listHeaderSub: { fontSize: typography.sizes.sm, color: colors.textMuted },
  listHeaderLink: { fontSize: typography.sizes.sm, fontWeight: '600', color: colors.accent },
  suggestSection: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  suggestTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },
  suggestRow: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xs,
  },
});

