import { AlertBanner } from '@/src/components/ui/alert-banner';
import { Input } from '@/src/components/ui/input';
import { useUserStore } from '@/src/stores/user.store';
import { colors, radius, spacing, typography } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, isSaving, error, fetchProfile, updateProfile, clearError } = useUserStore();

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setNom(profile.nom ?? '');
      setPrenom(profile.prenom ?? '');
      setTelephone(profile.telephone ?? '');
    }
  }, [profile]);

  const handleSave = async () => {
    clearError();
    setSuccessMsg(null);
    try {
      await updateProfile({
        nom: nameIsLocked ? undefined : (nom.trim() || undefined),
        prenom: nameIsLocked ? undefined : (prenom.trim() || undefined),
        telephone: telephone.trim() || undefined,
      });
      await fetchProfile();
      setSuccessMsg('Profil mis à jour avec succès !');
    } catch {
      // erreur gérée dans le store
    }
  };

  const nameIsLocked =
    !!profile?.nom && !!profile?.prenom && profile?.statutPieceIdentite === 'VALIDEE';

  return (
    <View style={styles.root}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mettre à jour mes informations</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Banners ─────────────────────────────────────────────────── */}
        {(error || successMsg) && (
          <View style={styles.bannerArea}>
            {error ? <AlertBanner message={error} variant="error" /> : null}
            {successMsg ? <AlertBanner message={successMsg} variant="success" /> : null}
          </View>
        )}

        {/* ── Formulaire ──────────────────────────────────────────────── */}
        {nameIsLocked && (
          <>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Prénom</Text>
                  <Text style={styles.infoValue}>{profile?.prenom}</Text>
                </View>
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed-outline" size={12} color={colors.textMuted} />
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Nom</Text>
                  <Text style={styles.infoValue}>{profile?.nom}</Text>
                </View>
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed-outline" size={12} color={colors.textMuted} />
                </View>
              </View>
            </View>
            <Text style={styles.infoNote}>
              Le nom et prénom ne peuvent plus être modifiés après validation de votre pièce d'identité.
            </Text>
          </>
        )}
        <View style={styles.formCard}>
          {!nameIsLocked && (
            <>
              <Input
                label="Prénom"
                placeholder="Votre prénom"
                value={prenom}
                onChangeText={setPrenom}
                autoCapitalize="words"
              />
              <Input
                label="Nom"
                placeholder="Votre nom"
                value={nom}
                onChangeText={setNom}
                autoCapitalize="words"
              />
            </>
          )}
          <Input
            label="Téléphone"
            placeholder="+224 6 00 00 00 00"
            value={telephone}
            onChangeText={setTelephone}
            keyboardType="phone-pad"
          />
        </View>

        {/* ── Infos non modifiables ────────────────────────────────────── */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Adresse e-mail</Text>
              <Text style={styles.infoValue}>{profile?.email ?? '—'}</Text>
            </View>
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed-outline" size={12} color={colors.textMuted} />
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Nom d'utilisateur</Text>
              <Text style={styles.infoValue}>{profile?.username ?? '—'}</Text>
            </View>
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed-outline" size={12} color={colors.textMuted} />
            </View>
          </View>
        </View>
        <Text style={styles.infoNote}>
          L'e-mail et le nom d'utilisateur ne peuvent pas être modifiés.
        </Text>

        {/* ── Bouton Enregistrer ───────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.headerBackground,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    marginRight: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  bannerArea: {
    marginBottom: spacing.base,
    gap: spacing.xs,
  },
  formCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: spacing.base,
  },
  infoCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  lockBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoNote: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.base,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
