import { API_BASE_URL } from '@/src/api/client';
import { AlertBanner } from '@/src/components/ui/alert-banner';
import { Input } from '@/src/components/ui/input';
import { getRoleFlags, getRoleLabels, hasRole } from '@/src/lib/roles';
import { useAnnonceStore } from '@/src/stores/annonce.store';
import { useAuthStore } from '@/src/stores/auth.store';
import { useMessagerieStore } from '@/src/stores/messagerie.store';
import { useUserStore } from '@/src/stores/user.store';
import { colors, radius, spacing, typography } from '@/src/theme';
import { StatutPieceIdentite, TypePieceIdentite, UserProfile } from '@/src/types/user.types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { formatPrix } from '@/src/utils/format';

// ─── Constantes

const AVATAR_SIZE = 96;
const BANNER_HEIGHT = 160;

const PIECES: { label: string; value: TypePieceIdentite }[] = [
  { label: "Carte d'identité", value: 'CARTE_IDENTITE' },
  { label: 'Passeport', value: 'PASSEPORT' },
  { label: 'Permis de conduire', value: 'PERMIS_DE_CONDUIRE' },
];

function buildPhotoUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

// ─── Mini carte annonce ───────────────────────────────────────────────────────

function MiniAnnonceCard({ item, onPress }: { item: any; onPress: () => void }) {
  const firstMedia = item.medias?.[0];
  const imageUri = firstMedia?.url
    ? firstMedia.url.startsWith('http')
      ? firstMedia.url
      : `${API_BASE_URL}${firstMedia.url}`
    : null;

  const statusColor =
    item.statut === 'PUBLIEE'
      ? '#16A34A'
      : item.statut === 'EN_ATTENTE'
        ? '#D97706'
        : '#6B7280';
  const statusLabel =
    item.statut === 'PUBLIEE'
      ? 'Publiée'
      : item.statut === 'EN_ATTENTE'
        ? 'En attente'
        : (item.statut ?? '—');

  return (
    <TouchableOpacity style={miniStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={miniStyles.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={miniStyles.image} resizeMode="cover" />
        ) : (
          <View style={[miniStyles.image, miniStyles.imageFallback]}>
            <Ionicons name="home-outline" size={28} color={colors.textMuted} />
          </View>
        )}
        <View style={[miniStyles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={miniStyles.statusText}>{statusLabel}</Text>
        </View>
        {(item.medias?.length ?? 0) > 0 && (
          <View style={miniStyles.photoCount}>
            <Ionicons name="camera-outline" size={10} color={colors.white} />
            <Text style={miniStyles.photoCountText}>{item.medias.length}</Text>
          </View>
        )}
      </View>
      <View style={miniStyles.body}>
        <Text style={miniStyles.type} numberOfLines={1}>
          {item.typeBien ?? '—'}
        </Text>
        <Text style={miniStyles.title} numberOfLines={2}>
          {item.titre ?? item.description ?? '—'}
        </Text>
        <Text style={miniStyles.price}>{item.prix ? formatPrix(item.prix) : '—'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const miniStyles = StyleSheet.create({
  card: {
    width: 168,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 110 },
  imageFallback: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusText: { fontSize: 10, fontWeight: '700', color: colors.white },
  photoCount: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  photoCountText: { fontSize: 10, color: colors.white, fontWeight: '600' },
  body: { padding: spacing.sm, gap: 2 },
  type: {
    fontSize: typography.sizes['2xs'],
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: { fontSize: typography.sizes.sm, fontWeight: '600', color: colors.textPrimary, lineHeight: 18 },
  price: { fontSize: typography.sizes.sm, fontWeight: '800', color: colors.primary, marginTop: 2 },
});

// ─── Carte Niveau de sécurité ─────────────────────────────────────────────────

function SecurityCard({ profile }: { profile: UserProfile | null }) {
  const emailOk = true;
  const docOk = profile?.statutPieceIdentite === 'VALIDEE';

  const steps = [
    { key: 'email', label: 'E-mail\nvérifié', done: emailOk },
    { key: 'doc', label: 'Document\nvérifié', done: docOk },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const percent = Math.round((doneCount / steps.length) * 100);

  const actions: { label: string; onPress: () => void }[] = [];
  if (!docOk) {
    actions.push({ label: "Ajouter document d'identité", onPress: () => {} });
  }

  return (
    <View style={secCardStyles.card}>
      <View style={secCardStyles.left}>
        <View style={secCardStyles.stepsRow}>
          {steps.map((step, i) => (
            <React.Fragment key={step.key}>
              <View style={secCardStyles.stepItem}>
                <View style={[secCardStyles.stepDot, step.done && secCardStyles.stepDotDone]}>
                  {step.done && <Ionicons name="checkmark" size={10} color={colors.white} />}
                </View>
                <Text style={secCardStyles.stepLabel}>{step.label}</Text>
              </View>
              {i < steps.length - 1 && (
                <View
                  style={[
                    secCardStyles.stepLine,
                    steps[i + 1].done && secCardStyles.stepLineDone,
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
        <View style={secCardStyles.track}>
          <View style={[secCardStyles.fill, { width: `${percent}%` as any }]} />
        </View>
        <Text style={secCardStyles.percent}>{percent}%</Text>
      </View>

      {actions.length > 0 && <View style={secCardStyles.divider} />}

      {actions.length > 0 && (
        <View style={secCardStyles.right}>
          <Text style={secCardStyles.actionsTitle}>Actions à faire</Text>
          {actions.map((a) => (
            <View key={a.label} style={secCardStyles.actionRow}>
              <Text style={secCardStyles.actionLabel}>{a.label}</Text>
              <TouchableOpacity
                style={secCardStyles.actionBtn}
                onPress={a.onPress}
                activeOpacity={0.8}
              >
                <Text style={secCardStyles.actionBtnText}>Vérifier</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const secCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  left: { flex: 1, gap: spacing.sm },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginTop: 9,
    borderRadius: 1,
  },
  stepLineDone: { backgroundColor: '#16A34A' },
  stepLabel: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 12,
  },
  track: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%' as any,
    backgroundColor: '#16A34A',
    borderRadius: radius.full,
  },
  percent: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: -spacing.base,
  },
  right: { flex: 1, gap: spacing.sm },
  actionsTitle: { fontSize: typography.sizes.sm, fontWeight: '700', color: colors.textPrimary },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  actionLabel: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  actionBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  actionBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.white,
  },
});

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { conversations, loadConversations } = useMessagerieStore();
  const { mesAnnonces, loadMesAnnonces } = useAnnonceStore();
  const {
    profile,
    isLoading,
    uploadingPiece,
    error,
    fetchProfile,
    uploadPhoto,
    uploadPieceIdentite,
    clearError,
  } = useUserStore();

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<'profil' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [pieceFormOpen, setPieceFormOpen] = useState(false);
  const [pieceTypeSel, setPieceTypeSel] = useState<TypePieceIdentite | ''>('');
  const [pieceNumero, setPieceNumero] = useState('');
  const [pieceFile, setPieceFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [viewingPiece, setViewingPiece] = useState(false);

  const pickAndUploadPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const fileName = asset.uri.split('/').pop() ?? 'photo.jpg';
    const fileType = asset.mimeType ?? 'image/jpeg';
    setUploadingPhoto('profil');
    clearError();
    try {
      await uploadPhoto({ uri: asset.uri, name: fileName, type: fileType }, 'profil');
      setSuccessMsg('Photo mise à jour avec succès !');
    } catch {
      // erreur gérée dans le store
    } finally {
      setUploadingPhoto(null);
    }
  };

  const pickPieceFile = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPieceFile({
      uri: asset.uri,
      name: asset.uri.split('/').pop() ?? 'piece.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    });
  };

  const handleSubmitPiece = async () => {
    if (!pieceTypeSel || !pieceNumero.trim() || !pieceFile) return;
    clearError();
    setSuccessMsg(null);
    try {
      await uploadPieceIdentite(pieceFile, pieceTypeSel as TypePieceIdentite, pieceNumero.trim());
      setSuccessMsg('Pièce soumise ! Elle sera validée par un modérateur.');
      setPieceFormOpen(false);
      setPieceFile(null);
    } catch {
      // erreur gérée dans le store
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchProfile();
        loadConversations();
        loadMesAnnonces();
      }
    }, [fetchProfile, loadConversations, loadMesAnnonces, isAuthenticated]),
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)/explore');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setSuccessMsg(null);
    clearError();
    try {
      await Promise.all([fetchProfile(), loadMesAnnonces()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const avatarUri = buildPhotoUrl(profile?.photoProfil ?? null);
  const displayName =
    profile
      ? [profile.prenom, profile.nom].filter(Boolean).join(' ') || profile.username
      : (user?.username ?? '');
  const email = profile?.email ?? user?.email ?? '';
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';
  const roleLabels = getRoleLabels(profile?.roles ?? user?.roles, profile?.type ?? null);
  const roleDisplay = roleLabels[0] || '—';
  const unreadMessagesCount = conversations.reduce(
    (total, c) => total + (c.unreadCount ?? 0),
    0,
  );
  const { canAccessEntreprise } = getRoleFlags(
    profile?.roles ?? user?.roles,
    profile?.type ?? null,
  );
  const allRoles = Array.from(new Set([...(profile?.roles ?? []), ...(user?.roles ?? [])]));
  const isAdminOrMod =
    hasRole(allRoles, 'ROLE_ADMINISTRATEUR') || hasRole(allRoles, 'ROLE_MODERATEUR');

  const docStatut = profile?.statutPieceIdentite ?? null;
  const docTrailingLabel =
    docStatut === 'VALIDEE'
      ? 'Vérifié'
      : docStatut === 'EN_ATTENTE'
        ? 'En attente'
        : docStatut === 'REJETEE'
          ? 'Rejeté'
          : 'Maybe';
  const docTrailingColor =
    docStatut === 'VALIDEE'
      ? '#16A34A'
      : docStatut === 'EN_ATTENTE'
        ? '#D97706'
        : docStatut === 'REJETEE'
          ? colors.error
          : colors.textMuted;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isLoading && !profile) {
    return (
      <View style={styles.loadingFull}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Bannières ─────────────────────────────────────────────────── */}
      {(error || successMsg) && (
        <View style={styles.bannerArea}>
          {error ? <AlertBanner message={error} variant="error" /> : null}
          {successMsg ? <AlertBanner message={successMsg} variant="success" /> : null}
        </View>
      )}

      {/* ── Héro : bannière + avatar ───────────────────────────────────── */}
      <View style={styles.heroContainer}>
        <View style={styles.bannerWrap}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.bannerImage}
              resizeMode="cover"
              blurRadius={20}
            />
          ) : null}
          <View style={styles.bannerOverlay} />
        </View>
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            style={styles.avatarRing}
            onPress={pickAndUploadPhoto}
            disabled={uploadingPhoto !== null}
            activeOpacity={0.85}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploadingPhoto === 'profil' ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="pencil" size={11} color={colors.white} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Carte identité ────────────────────────────────────────────── */}
      <View style={styles.identityCard}>
        <Text style={styles.displayName}>{displayName}</Text>
        {roleLabels.length > 0 && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{roleDisplay}</Text>
          </View>
        )}
        <Text style={styles.memberSince}>Membre depuis : {memberSince}</Text>
        {(profile?.telephone || email) ? (
          <View style={styles.contactRow}>
            {profile?.telephone ? (
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.contactText}>{profile.telephone}</Text>
              </View>
            ) : null}
            {email ? (
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.contactText} numberOfLines={1}>{email}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* ── Mes Annonces ──────────────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes Annonces</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mes-annonces')} activeOpacity={0.7}>
          <Text style={styles.sectionLink}>Gérer</Text>
        </TouchableOpacity>
      </View>

      {mesAnnonces.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.annoncesList}
        >
          {mesAnnonces.slice(0, 5).map((a) => (
            <MiniAnnonceCard
              key={a.id}
              item={a}
              onPress={() => router.push(`/annonce/${a.id}`)}
            />
          ))}
        </ScrollView>
      ) : (
        <TouchableOpacity
          style={styles.annoncesEmpty}
          onPress={() => router.push('/(tabs)/publier')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.annoncesEmptyText}>Publier ma première annonce</Text>
        </TouchableOpacity>
      )}

      {/* ── Menu principal ────────────────────────────────────────────── */}
      <View style={styles.menuCard}>
        <MenuRow
          iconName="heart-outline"
          label="Mes Favoris"
          onPress={() => router.push('/(tabs)/favoris')}
        />
        <MenuRow
          iconName="chatbubbles-outline"
          label="Messagerie"
          onPress={() => router.push('/messagerie')}
          badgeCount={unreadMessagesCount > 0 ? unreadMessagesCount : undefined}
        />
        <MenuRow
          iconName="notifications-outline"
          label="Gérer les alertes"
          onPress={() => {}}
        />
        <MenuRow
          iconName="create-outline"
          label="Mettre à jour mes informations"
          onPress={() => router.push('/edit-profile')}
        />
        <MenuRow
          iconName="lock-closed-outline"
          label="Changer mon mot de passe"
          onPress={() => router.push('/(auth)/change-password')}
        />
        {isAdminOrMod && (
          <MenuRow
            iconName="shield-outline"
            label="Panel modérateur"
            onPress={() => router.push('/admin')}
          />
        )}
        {(canAccessEntreprise || !!profile?.entrepriseId) && (
          <MenuRow
            iconName="business-outline"
            label="Mon entreprise"
            onPress={() => router.push('/entreprise')}
          />
        )}
        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
          <View style={[secStyles.menuIconWrap, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
          </View>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* ── Formulaire pièce d'identité ───────────────────────────────── */}
      {pieceFormOpen && (!docStatut || docStatut === 'REJETEE') && (
        <>
          <Text style={secStyles.sectionLabel}>Soumettre un document d'identité</Text>
          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>Type de pièce</Text>
            <View style={styles.pieceRow}>
              {PIECES.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.pieceBtn, pieceTypeSel === p.value && styles.pieceBtnActive]}
                  onPress={() => setPieceTypeSel(p.value)}
                >
                  <Text
                    style={[
                      styles.pieceBtnText,
                      pieceTypeSel === p.value && styles.pieceBtnTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input
              label="Numéro"
              placeholder="Numéro sur le document"
              value={pieceNumero}
              onChangeText={setPieceNumero}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.filePicker} onPress={pickPieceFile} activeOpacity={0.75}>
              <Ionicons name="image-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.filePickerText} numberOfLines={1}>
                {pieceFile ? pieceFile.name : 'Choisir une photo du document…'}
              </Text>
              {pieceFile && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!pieceTypeSel || !pieceNumero.trim() || !pieceFile) && styles.saveBtnDisabled,
            ]}
            onPress={handleSubmitPiece}
            disabled={uploadingPiece || !pieceTypeSel || !pieceNumero.trim() || !pieceFile}
            activeOpacity={0.85}
          >
            {uploadingPiece ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Uploader la pièce</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* Infos pièce soumise */}
      {docStatut && docStatut !== 'REJETEE' && (
        <View style={styles.pieceInfoCard}>
          <PieceStatusBadge statut={docStatut} />
          {profile?.typePieceIdentite && (
            <View style={styles.pieceInfoRow}>
              <View style={styles.pieceInfoItem}>
                <Text style={styles.pieceInfoLabel}>Type</Text>
                <Text style={styles.pieceInfoValue}>{profile.typePieceIdentite}</Text>
              </View>
              <View style={styles.pieceInfoItem}>
                <Text style={styles.pieceInfoLabel}>Numéro</Text>
                <Text style={styles.pieceInfoValue}>{profile.numeroPieceIdentite}</Text>
              </View>
            </View>
          )}
          {profile?.pieceIdentiteUrl && (
            <TouchableOpacity
              style={styles.pieceViewBtn}
              onPress={() => setViewingPiece(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="eye-outline" size={16} color={colors.primary} />
              <Text style={styles.pieceViewBtnText}>Voir le document</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Niveau de sécurité ────────────────────────────────────────── */}
      <Text style={secStyles.sectionLabel}>Niveau de sécurité</Text>
      <SecurityCard profile={profile} />

      {/* ── Modal visualisation pièce ────────────────────────────────── */}
      <Modal
        visible={viewingPiece}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingPiece(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setViewingPiece(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            {profile?.pieceIdentiteUrl ? (
              <Image
                source={{ uri: buildPhotoUrl(profile.pieceIdentiteUrl) ?? '' }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : null}
            <Text style={styles.modalCaption}>
              {profile?.typePieceIdentite} · {profile?.numeroPieceIdentite}
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function PieceStatusBadge({ statut }: { statut: StatutPieceIdentite | null }) {
  if (!statut) return null;
  const config: Record<string, { icon: IoniconsName; color: string; label: string }> = {
    EN_ATTENTE: { icon: 'time-outline', color: '#D97706', label: 'En attente de validation' },
    VALIDEE: { icon: 'checkmark-circle', color: '#16A34A', label: 'Identité vérifiée' },
    REJETEE: { icon: 'close-circle', color: colors.error, label: 'Document rejeté' },
  };
  const { icon, color, label } = config[statut] ?? {
    icon: 'help-circle-outline' as IoniconsName,
    color: colors.textMuted,
    label: statut,
  };
  return (
    <View style={secStyles.pieceBadgeRow}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[secStyles.pieceBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

function MenuRow({
  iconName,
  label,
  onPress,
  badgeCount,
  trailing,
}: {
  iconName: IoniconsName;
  label: string;
  onPress: () => void;
  badgeCount?: number;
  trailing?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={secStyles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={secStyles.menuLeft}>
        <View style={secStyles.menuIconWrap}>
          <Ionicons name={iconName} size={18} color={colors.primary} />
        </View>
        <Text style={secStyles.menuLabel}>{label}</Text>
      </View>
      <View style={secStyles.menuRight}>
        {trailing ?? null}
        {badgeCount && badgeCount > 0 ? (
          <View style={secStyles.menuBadge}>
            <Text style={secStyles.menuBadgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const secStyles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xs,
  },
  menuRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.md },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF4FF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  menuRight: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm },
  menuLabel: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: '500' as const,
  },
  menuBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  menuBadgeText: {
    fontSize: typography.sizes.xs,
    color: colors.white,
    fontWeight: '700' as const,
  },
  pieceBadgeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  pieceBadgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600' as const,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 48 },
  loadingFull: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bannerArea: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    gap: spacing.sm,
  },

  // Héro
  heroContainer: {
    position: 'relative',
    marginBottom: AVATAR_SIZE / 2 + spacing.md,
  },
  bannerWrap: {
    height: BANNER_HEIGHT,
    backgroundColor: colors.headerBackground,
    overflow: 'hidden',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,60,110,0.15)',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -(AVATAR_SIZE / 2 + spacing.md),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  avatarRing: {
    position: 'relative',
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '700' as const,
    color: colors.white,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 4,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },

  // Identité
  identityCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.base,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  displayName: {
    fontSize: typography.sizes.xl,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  roleBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700' as const,
    color: colors.white,
    letterSpacing: 0.3,
  },
  memberSince: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    maxWidth: 180,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  sectionLink: {
    fontSize: typography.sizes.sm,
    color: colors.accent,
    fontWeight: '600' as const,
  },

  // Annonces
  annoncesList: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  annoncesEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    marginHorizontal: spacing.base,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  annoncesEmptyText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: '600' as const,
  },

  // Menu card
  menuCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.base,
    borderRadius: radius.xl,
    overflow: 'hidden' as const,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  menuTrailingText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600' as const,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  logoutText: {
    fontSize: typography.sizes.md,
    color: colors.error,
    fontWeight: '600' as const,
  },

  // Formulaires
  formCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.base,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  saveBtn: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: '600' as const,
    color: colors.white,
  },
  pieceRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  pieceBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
  },
  pieceBtnActive: { borderColor: colors.primary, backgroundColor: '#EEF4FF' },
  pieceBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  pieceBtnTextActive: { color: colors.primary, fontWeight: '600' as const },
  filePicker: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.inputBackground,
  },
  filePickerText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },

  // Pièce info card
  pieceInfoCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.base,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pieceInfoRow: {
    flexDirection: 'row' as const,
    gap: spacing.md,
  },
  pieceInfoItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  pieceInfoLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  pieceInfoValue: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: '600' as const,
  },
  pieceViewBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignSelf: 'flex-start' as const,
    backgroundColor: '#EEF4FF',
  },
  pieceViewBtnText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: '600' as const,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing.base,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    paddingBottom: spacing.base,
  },
  modalClose: {
    alignSelf: 'flex-end' as const,
    padding: spacing.md,
  },
  modalImage: {
    width: '100%',
    height: 380,
    backgroundColor: colors.background,
  },
  modalCaption: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
});
