import { AlertBanner } from '@/src/components/ui/alert-banner';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { ScreenContainer } from '@/src/components/ui/screen-container';
import { SignupFormData, signupSchema } from '@/src/lib/validation';
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

// ─── Types ────────────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type RoleOption = {
  value: 'particulier' | 'professionnel';
  label: string;
  description: string;
  iconName: IoniconsName;
};

// ─── Données ──────────────────────────────────────────────────────────────────

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'particulier',
    label: 'Particulier',
    description: 'Acheteur ou vendeur individuel',
    iconName: 'person',
  },
  {
    value: 'professionnel',
    label: 'Professionnel',
    description: 'Agent immobilier ou agence',
    iconName: 'business',
  },
];

// ─── Composant ────────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const { signup } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'particulier',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: SignupFormData) => {
    setApiError(null);
    setIsLoading(true);
    try {
      await signup({
        username: data.username,
        email: data.email,
        password: data.password,
        roles: [data.role],
      });
      // Afficher l'écran de confirmation email (activation via lien)
      setRegisteredEmail(data.email);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setApiError(error?.message ?? 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Écran de confirmation : vérifiez votre email ──────────────────────
  if (registeredEmail) {
    return (
      <View style={styles.successCentered}>
        <View style={styles.successCard}>
          <View style={styles.successIconCircle}>
            <Ionicons name="mail" size={40} color={colors.primary} />
          </View>
          <Text style={styles.successTitle}>Vérifiez votre email !</Text>
          <Text style={styles.successSubtitle}>
            Un lien d’activation a été envoyé à
          </Text>
          <Text style={styles.successEmail}>{registeredEmail}</Text>
          <Text style={styles.successHint}>
            Cliquez sur le lien dans l’email pour activer votre compte.
            Le lien expire dans 24 heures.
          </Text>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.successBtnText}>Aller à la connexion</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="home" size={34} color={colors.white} />
        </View>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>
          Rejoignez Anoventix et gérez vos annonces immobilières
        </Text>
      </View>

      {/* Formulaire */}
      <View style={styles.card}>
        {apiError && <AlertBanner message={apiError} variant="error" />}

        {/* Nom d'utilisateur */}
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Nom d'utilisateur"
              placeholder="ex: rahmane_bah"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.username?.message}
              autoComplete="username"
            />
          )}
        />

        {/* Email */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Adresse email"
              placeholder="ex: rahmane@example.com"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.email?.message}
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
              placeholder="Min. 8 caractères, majuscule, chiffre, spécial"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.password?.message}
              isPassword
              autoComplete="password-new"
            />
          )}
        />

        {/* Confirmation mot de passe */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirmer le mot de passe"
              placeholder="Répétez votre mot de passe"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.confirmPassword?.message}
              isPassword
              autoComplete="password-new"
            />
          )}
        />

        {/* Sélection du rôle */}
        <View style={styles.roleSection}>
          <Text style={styles.roleLabel}>Type de compte</Text>
          {errors.role && (
            <Text style={styles.fieldError}>{errors.role.message}</Text>
          )}
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <View style={styles.roleOptions}>
                {ROLE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.roleCard,
                      value === option.value && styles.roleCardSelected,
                    ]}
                    onPress={() => onChange(option.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={option.iconName}
                      size={26}
                      color={value === option.value ? colors.primary : colors.textSecondary}
                      style={styles.roleCardIconStyle}
                    />
                    <View style={styles.roleCardText}>
                      <Text
                        style={[
                          styles.roleCardTitle,
                          value === option.value && styles.roleCardTitleSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text style={styles.roleCardDesc}>{option.description}</Text>
                    </View>
                    {value === option.value && (
                      <View style={styles.roleCheck}>
                        <Ionicons name="checkmark" size={14} color={colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>

        {/* Soumettre */}
        <Button
          title="Créer mon compte"
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          style={styles.submitBtn}
        />
      </View>

      {/* Lien connexion */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Déjà un compte ? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.footerLink}>Se connecter</Text>
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
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    ...shadows.md,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
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
  roleSection: {
    marginBottom: spacing.md,
  },
  roleLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  fieldError: {
    fontSize: typography.sizes.xs,
    color: colors.error,
    marginBottom: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  roleOptions: {
    gap: spacing.sm,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    gap: spacing.md,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EEF4FF',
  },
  roleCardIconStyle: {
    marginRight: 0,
  },
  roleCardText: {
    flex: 1,
  },
  roleCardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  roleCardTitleSelected: {
    color: colors.primary,
  },
  roleCardDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  roleCheck: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing['3xl'],
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

  // ── Écran succès inscription ──────────────────────────────────────────────
  successCentered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
  },
  successCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    width: '100%',
    maxWidth: 440,
    ...shadows.md,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  successTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  successEmail: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginTop: 2,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successHint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  successBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    width: '100%',
    alignItems: 'center',
  },
  successBtnText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
