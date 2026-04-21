import { AlertBanner } from '@/src/components/ui/alert-banner';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { ScreenContainer } from '@/src/components/ui/screen-container';
import { ForgotPasswordFormData, forgotPasswordSchema } from '@/src/lib/validation';
import { useAuthStore } from '@/src/stores/auth.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setApiError(null);
    setIsLoading(true);
    try {
      await forgotPassword({ email: data.email });
      // Naviguer vers l'écran de réinitialisation avec l'email pré-rempli
      router.push({ pathname: '/(auth)/reset-password', params: { email: data.email } });
    } catch (err: unknown) {
      const error = err as { message?: string };
      setApiError(error?.message ?? 'Impossible d\'envoyer l\'email. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="key" size={40} color={colors.accent} />
        </View>
        <Text style={styles.title}>Mot de passe oublié ?</Text>
        <Text style={styles.subtitle}>
          Entrez votre email et nous vous enverrons un code de réinitialisation
        </Text>
      </View>

      {/* Formulaire */}
      <View style={styles.card}>
        {apiError && <AlertBanner message={apiError} variant="error" />}

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Adresse email"
              placeholder="ex: jean@example.com"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.email?.message}
              keyboardType="email-address"
              autoComplete="email"
            />
          )}
        />

        <Button
          title="Envoyer le code"
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
        />
      </View>

      {/* Retour connexion */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    paddingBottom: spacing['2xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.md,
    marginBottom: spacing.xl,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing['3xl'],
  },
  backLink: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
});
