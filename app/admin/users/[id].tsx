import { buildMediaUrl } from '@/src/api/annonce.api';
import { getRoleLabel } from '@/src/lib/roles';
import { useAdminStore } from '@/src/stores/admin.store';
import { useAuthStore } from '@/src/stores/auth.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import {
    STATUT_PIECE_LABELS,
    STATUT_USER_LABELS,
    TYPE_PIECE_LABELS,
    type StatutPieceIdentite,
    type StatutUtilisateur,
} from '@/src/types/admin.types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
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

const PIECE_COLORS: Record<StatutPieceIdentite, string> = {
  EN_ATTENTE: colors.warning,
  VALIDEE: colors.success,
  REJETEE: colors.error,
};

// ─── Composants utilitaires ───────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.sCard}>
      <Text style={s.sCardTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Modale de rejet pièce ────────────────────────────────────────────────────

function RejetModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (motif: string) => void;
}) {
  const [motif, setMotif] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modalBox}>
          <Text style={s.modalTitle}>Motif de rejet</Text>
          <Text style={s.modalSub}>Expliquez pourquoi la pièce est rejetée.</Text>
          <TextInput
            style={s.modalInput}
            placeholder="Ex: Document illisible, expiré..."
            placeholderTextColor={colors.placeholder}
            value={motif}
            onChangeText={setMotif}
            multiline
            numberOfLines={3}
          />
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalBtnCancel} onPress={onClose}>
              <Text style={s.modalBtnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalBtnConfirm, !motif.trim() && s.btnDisabled]}
              onPress={() => motif.trim() && onConfirm(motif.trim())}
            >
              <Text style={s.modalBtnConfirmText}>Rejeter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Écran détail utilisateur ─────────────────────────────────────────────────

export default function AdminUserDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: authUser } = useAuthStore();
  const { currentUser, isLoadingUser, usersError, loadUserById, changeUserStatut, changePieceIdentiteStatut } =
    useAdminStore();

  const [actionLoading, setActionLoading] = useState(false);
  const [rejetModalVisible, setRejetModalVisible] = useState(false);

  const isAdmin = authUser?.roles?.includes('ROLE_ADMINISTRATEUR');
  const targetIsModo = currentUser?.roles?.includes('ROLE_MODERATEUR');
  const canActOnUser = isAdmin || !targetIsModo;

  useEffect(() => {
    if (id) loadUserById(id);
  }, [id]);

  const handleChangeStatut = (statut: 'ACTIF' | 'SUSPENDU' | 'INACTIF') => {
    if (!currentUser || !canActOnUser) return;
    Alert.alert(
      'Confirmer',
      `Passer le compte en ${STATUT_USER_LABELS[statut]} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: statut === 'SUSPENDU' ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              await changeUserStatut(currentUser.id, { statut });
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? 'Action impossible');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleValidePiece = () => {
    if (!currentUser || !canActOnUser) return;
    Alert.alert('Confirmer', 'Valider cette pièce d\'identité ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Valider',
        onPress: async () => {
          setActionLoading(true);
          try {
            await changePieceIdentiteStatut(currentUser.id, { statut: 'VALIDEE' });
          } catch (e: any) {
            Alert.alert('Erreur', e?.message ?? 'Action impossible');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleRejetPiece = async (motif: string) => {
    if (!currentUser) return;
    setRejetModalVisible(false);
    setActionLoading(true);
    try {
      await changePieceIdentiteStatut(currentUser.id, { statut: 'REJETEE', motifRejet: motif });
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Action impossible');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoadingUser) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (usersError || !currentUser) {
    return (
      <View style={s.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={s.errorTitle}>Utilisateur introuvable</Text>
        <Text style={s.errorSub}>{usersError}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => id && loadUserById(id)}>
          <Text style={s.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const u = currentUser;
  const statut = u.statut as StatutUtilisateur;
  const fullName = [u.prenom, u.nom].filter(Boolean).join(' ') || u.username;

  return (
    <>
      <RejetModal
        visible={rejetModalVisible}
        onClose={() => setRejetModalVisible(false)}
        onConfirm={handleRejetPiece}
      />
      <ScrollView style={s.scroll} contentContainerStyle={[s.container, Platform.OS === 'web' && { maxWidth: 860, alignSelf: 'center' as const, width: '100%' }]} showsVerticalScrollIndicator={false}>

        {/* En-tête */}
        <View style={s.header}>
          <View style={s.avatarLg}>
            <Text style={s.avatarLgText}>{(u.username[0] ?? '?').toUpperCase()}</Text>
          </View>
          <Text style={s.fullName}>{fullName}</Text>
          <Text style={s.usernameText}>@{u.username}</Text>
          <View style={[s.statutBadge, { backgroundColor: STATUT_COLORS[statut] + '1A' }]}>
            <View style={[s.statutDot, { backgroundColor: STATUT_COLORS[statut] }]} />
            <Text style={[s.statutText, { color: STATUT_COLORS[statut] }]}>
              {STATUT_USER_LABELS[statut]}
            </Text>
          </View>
          {!canActOnUser && (
            <View style={s.warningBanner}>
              <Ionicons name="lock-closed-outline" size={14} color={colors.warning} />
              <Text style={s.warningText}>Action réservée à l'administrateur</Text>
            </View>
          )}
        </View>

        {/* Changer statut */}
        {canActOnUser && (
          <SectionCard title="Statut du compte">
            {actionLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} />
            ) : (
              <View style={s.actionRow}>
                {(['ACTIF', 'SUSPENDU', 'INACTIF'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      s.statBtn,
                      u.statut === st && { backgroundColor: STATUT_COLORS[st], borderColor: STATUT_COLORS[st] },
                    ]}
                    onPress={() => u.statut !== st && handleChangeStatut(st)}
                    disabled={u.statut === st}
                  >
                    <Text
                      style={[s.statBtnText, u.statut === st && { color: colors.white }]}
                    >
                      {STATUT_USER_LABELS[st]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </SectionCard>
        )}

        {/* Infos générales */}
        <SectionCard title="Informations">
          <InfoRow label="Email" value={u.email} />
          <InfoRow label="Téléphone" value={u.telephone} />
          <InfoRow label="Type" value={u.type} />
          <InfoRow label="Rôles" value={u.roles.map(getRoleLabel).join(', ')} />
          <InfoRow label="Entreprise" value={u.entrepriseNom} />
          <InfoRow label="Compte parent" value={u.parentUsername} />
          <InfoRow label="Créé le" value={new Date(u.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} />
        </SectionCard>

        {/* Pièce d'identité */}
        {u.typePieceIdentite && (
          <SectionCard title="Pièce d'identité">
            <InfoRow label="Type" value={u.typePieceIdentite ? TYPE_PIECE_LABELS[u.typePieceIdentite] : null} />
            <InfoRow label="Numéro" value={u.numeroPieceIdentite} />
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Statut</Text>
              <View style={[s.pieceBadge, { backgroundColor: PIECE_COLORS[u.statutPieceIdentite!] + '1A' }]}>
                <Text style={[s.pieceText, { color: PIECE_COLORS[u.statutPieceIdentite!] }]}>
                  {STATUT_PIECE_LABELS[u.statutPieceIdentite!]}
                </Text>
              </View>
            </View>
            {u.motifRejetPieceIdentite && (
              <View style={s.rejetBanner}>
                <Text style={s.rejetText}>Motif : {u.motifRejetPieceIdentite}</Text>
              </View>
            )}
            {u.pieceIdentiteUrl && (
              <Image
                source={{ uri: buildMediaUrl(u.pieceIdentiteUrl) }}
                style={s.pieceImage}
                contentFit="contain"
              />
            )}
            {canActOnUser && u.statutPieceIdentite === 'EN_ATTENTE' && (
              <View style={s.pieceActions}>
                {actionLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <TouchableOpacity style={s.validateBtn} onPress={handleValidePiece}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
                      <Text style={s.validateText}>Valider</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.rejectBtn} onPress={() => setRejetModalVisible(true)}>
                      <Ionicons name="close-circle-outline" size={16} color={colors.white} />
                      <Text style={s.rejectText}>Rejeter</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </SectionCard>
        )}

        {/* Voir annonces */}
        <TouchableOpacity
          style={s.linkBtn}
          onPress={() => router.push('/admin/annonces' as any)}
        >
          <Ionicons name="home-outline" size={16} color={colors.primary} />
          <Text style={s.linkText}>Voir les annonces</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>

      </ScrollView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.base, paddingBottom: spacing['4xl'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'], gap: spacing.md },
  errorTitle: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.textPrimary },
  errorSub: { fontSize: typography.sizes.sm, color: colors.textMuted, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.lg },
  retryText: { color: colors.white, fontWeight: '700', fontSize: typography.sizes.md },
  header: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  avatarLg: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary + '1A',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLgText: { fontSize: typography.sizes.xl, fontWeight: '800', color: colors.primary },
  fullName: { fontSize: typography.sizes.xl, fontWeight: '700', color: colors.textPrimary },
  usernameText: { fontSize: typography.sizes.sm, color: colors.textMuted },
  statutBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
  },
  statutDot: { width: 7, height: 7, borderRadius: 4 },
  statutText: { fontSize: typography.sizes.sm, fontWeight: '700' },
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.warningLight, padding: spacing.sm,
    borderRadius: radius.md, marginTop: spacing.xs,
  },
  warningText: { fontSize: typography.sizes.xs, color: colors.warning, fontWeight: '600' },
  sCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sCardTitle: {
    fontSize: typography.sizes.xs, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  infoLabel: { flex: 1, fontSize: typography.sizes.sm, color: colors.textMuted, fontWeight: '500' },
  infoValue: { flex: 2, fontSize: typography.sizes.sm, color: colors.textPrimary, textAlign: 'right' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  statBtn: {
    flex: 1, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center',
  },
  statBtnText: { fontSize: typography.sizes.sm, fontWeight: '600', color: colors.textSecondary },
  pieceBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  pieceText: { fontSize: typography.sizes.xs, fontWeight: '700' },
  rejetBanner: {
    backgroundColor: colors.errorLight, padding: spacing.sm, borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  rejetText: { fontSize: typography.sizes.sm, color: colors.error },
  pieceImage: {
    width: '100%', height: 200, borderRadius: radius.md,
    backgroundColor: colors.background, marginTop: spacing.md,
  },
  pieceActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  validateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.success,
    paddingVertical: spacing.md, borderRadius: radius.md,
  },
  validateText: { color: colors.white, fontWeight: '700', fontSize: typography.sizes.sm },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.error,
    paddingVertical: spacing.md, borderRadius: radius.md,
  },
  rejectText: { color: colors.white, fontWeight: '700', fontSize: typography.sizes.sm },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.base,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadows.sm,
    marginBottom: spacing.md,
  },
  linkText: { flex: 1, fontSize: typography.sizes.md, fontWeight: '600', color: colors.primary },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing['2xl'] },
  modalBox: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md },
  modalTitle: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.textPrimary },
  modalSub: { fontSize: typography.sizes.sm, color: colors.textMuted },
  modalInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, fontSize: typography.sizes.md, color: colors.textPrimary,
    textAlignVertical: 'top', minHeight: 80,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalBtnCancel: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
  },
  modalBtnCancelText: { fontWeight: '600', color: colors.textSecondary },
  modalBtnConfirm: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    backgroundColor: colors.error, alignItems: 'center',
  },
  modalBtnConfirmText: { fontWeight: '700', color: colors.white },
  btnDisabled: { opacity: 0.4 },
});
