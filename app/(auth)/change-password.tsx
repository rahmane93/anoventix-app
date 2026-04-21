import { AlertBanner } from '@/src/components/ui/alert-banner';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { ScreenContainer } from '@/src/components/ui/screen-container';
import { ChangePasswordFormData, changePasswordSchema } from '@/src/lib/validation';
import { useAuthStore } from '@/src/stores/auth.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ChangePasswordScreen() {
  const { changePassword } = useAuthStore();

  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setApiError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const message = await changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      setSuccessMessage(message ?? 'Mot de passe modifié avec succès !');
      reset();
      setTimeout(() => router.back(), 2000);
    } catch (err: unknown) {
      const error = err as { message?: string; status?: number };
      if (error?.status === 400) {
        setApiError('Ancien mot de passe incorrect.');
      } else {
        setApiError(error?.message ?? 'Impossible de modifier le mot de passe. Réessayez.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>Changer mon mot de passe</Text>
        <Text style={styles.subtitle}>
          Entrez votre mot de passe actuel puis choisissez-en un nouveau
        </Text>
      </View>

      {/* Formulaire */}
      <View style={styles.card}>
        {apiError && <AlertBanner message={apiError} variant="error" />}
        {successMessage && <AlertBanner message={successMessage} variant="success" />}

        {/* Ancien mot de passe */}
        <Controller
          control={control}
          name="oldPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Mot de passe actuel"
              placeholder="Votre mot de passe actuel"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.oldPassword?.message}
              secureTextEntry={!showOld}
              rightIcon={
                <TouchableOpacity onPress={() => setShowOld((v) => !v)} activeOpacity={0.7}>
                  <Ionicons name={showOld ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              }
            />
          )}
        />

        {/* Nouveau mot de passe */}
        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Nouveau mot de passe"
              placeholder="Minimum 8 caractères"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.newPassword?.message}
              secureTextEntry={!showNew}
              rightIcon={
                <TouchableOpacity onPress={() => setShowNew((v) => !v)} activeOpacity={0.7}>
                  <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              }
            />
          )}
        />

        {/* Confirmation */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirmer le nouveau mot de passe"
              placeholder="Répétez le nouveau mot de passe"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.confirmPassword?.message}
              secureTextEntry={!showConfirm}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} activeOpacity={0.7}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              }
            />
          )}
        />

        {/* Règles */}
        <View style={styles.rulesBox}>
          <Text style={styles.rulesTitle}>Le mot de passe doit contenir :</Text>
          {[
            'Au moins 8 caractères',
            'Une lettre majuscule',
            'Un chiffre',
            'Un caractère spécial (!@#$…)',
          ].map((rule) => (
            <View key={rule} style={styles.ruleRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color={colors.textMuted} />
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>

        <Button
          title="Modifier le mot de passe"
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          style={styles.btn}
        />
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: spacing.sm,
    padding: spacing.sm,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight ?? '#EAF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing.base,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.base,
    ...shadows.sm,
  },
  rulesBox: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    padding: spacing.base,
    gap: spacing.xs,
  },
  rulesTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ruleText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  btn: {
    marginTop: spacing.sm,
  },
});
