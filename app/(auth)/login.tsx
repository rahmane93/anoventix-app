import { AlertBanner } from '@/src/components/ui/alert-banner';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { ScreenContainer } from '@/src/components/ui/screen-container';
import { SigninFormData, signinSchema } from '@/src/lib/validation';
import { useAuthStore } from '@/src/stores/auth.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Composant ────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { signin } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
    },
  });

  const onSubmit = async (data: SigninFormData) => {
    setApiError(null);
    setInfoMessage(null);
    setIsLoading(true);
    try {
      await signin(data);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const error = err as { message?: string; status?: number };
      if (error?.status === 403) {
        setInfoMessage(
          'Votre compte n\'est pas encore activé.\n' +
          'Vérifiez votre boîte mail et cliquez sur le lien d\'activation reçu lors de votre inscription.',
        );
      } else if (error?.status === 401) {
        setApiError('Email/nom d\'utilisateur ou mot de passe incorrect.');
      } else {
        setApiError(error?.message ?? 'Impossible de se connecter. Réessayez.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="home" size={38} color={colors.white} />
        </View>
        <Text style={styles.title}>Anoventix</Text>
        <Text style={styles.subtitle}>
          Connectez-vous pour accéder à vos annonces
        </Text>
      </View>

      {/* Formulaire */}
      <View style={styles.card}>
        {infoMessage && <AlertBanner message={infoMessage} variant="info" />}
        {apiError && <AlertBanner message={apiError} variant="error" />}

        {/* Identifiant */}
        <Controller
          control={control}
          name="usernameOrEmail"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email ou nom d'utilisateur"
              placeholder="ex: rahmane@example.com"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.usernameOrEmail?.message}
              keyboardType="email-address"
              autoComplete="email"
            />
          )}
        />

        {/* Mot de passe */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Mot de passe"
              placeholder="Votre mot de passe"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.password?.message}
              isPassword
              autoComplete="password"
            />
          )}
        />

        {/* Lien mot de passe oublié */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          style={styles.forgotBtn}
        >
          <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        {/* Soumettre */}
        <Button
          title="Se connecter"
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
        />
      </View>

      {/* Lien inscription */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Pas encore de compte ? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.footerLink}>S'inscrire</Text>
        </TouchableOpacity>
      </View>

      {/* Retour sans connexion */}
      <TouchableOpacity
        style={styles.backLink}
        onPress={() => router.replace('/(tabs)/explore')}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back-outline" size={15} color={colors.textMuted} />
        <Text style={styles.backLinkText}>Parcourir les annonces sans connexion</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: spacing['5xl'],
    paddingBottom: spacing['2xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    ...shadows.lg,
  },

  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.extrabold,
    color: colors.primary,
    letterSpacing: -1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.md,
    marginBottom: spacing.xl,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing.base,
    marginTop: -spacing.xs,
  },
  forgotText: {
    fontSize: typography.sizes.sm,
    color: colors.primaryLight,
    fontWeight: typography.weights.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  footerLink: {
    color: colors.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingBottom: spacing['3xl'],
  },
  backLinkText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
