import { z } from 'zod';

// ─── Signup Schema ────────────────────────────────────────────────────────────

export const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
      .max(30, 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Seules les lettres, chiffres et _ sont autorisés',
      ),
    email: z
      .string()
      .email('Adresse email invalide')
      .toLowerCase(),
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Le mot de passe doit contenir au moins un caractère spécial',
      ),
    confirmPassword: z.string(),
    role: z.enum(['particulier', 'professionnel'], {
      error: 'Veuillez sélectionner un type de compte',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

// ─── Signin Schema ────────────────────────────────────────────────────────────

export const signinSchema = z.object({
  usernameOrEmail: z
    .string()
    .min(1, 'Ce champ est requis'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis'),
});

export type SigninFormData = z.infer<typeof signinSchema>;

// ─── Forgot Password Schema ───────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Adresse email invalide')
    .toLowerCase(),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password Schema ────────────────────────────────────────────────────

export const resetPasswordSchema = z
  .object({
    email: z.string().email('Adresse email invalide').toLowerCase(),
    token: z.string().min(1, 'Le token est requis'),
    newPassword: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Caractère spécial requis'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Change Password Schema ──────────────────────────────────────

const passwordRules = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Caractère spécial requis');

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'L\'ancien mot de passe est requis'),
    newPassword: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'Le nouveau mot de passe doit être différent de l\'ancien',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ─── Entreprise Schema ──────────────────────────────────────────

export const entrepriseSchema = z.object({
  nom: z.string().min(1, "Le nom de l'entreprise est obligatoire").max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string().max(200, 'La description ne peut pas dépasser 200 caractères').optional().or(z.literal('')),
  telephone: z
    .string()
    .regex(/^(\+|00)[1-9]\d{6,14}$/, 'Le téléphone doit être au format international (+22462457411 ou 0022462457411)')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Format d\'email invalide').max(100, "L'email ne peut pas dépasser 100 caractères").optional().or(z.literal('')),
  adresse: z.string().max(100, "L'adresse ne peut pas dépasser 100 caractères").optional().or(z.literal('')),
  pays: z.string().max(50, 'Le pays ne peut pas dépasser 50 caractères').optional().or(z.literal('')),
  numeroRCCM: z.string().max(50, 'Le numéro RCCM ne peut pas dépasser 50 caractères').optional().or(z.literal('')),
});

export type EntrepriseFormData = z.infer<typeof entrepriseSchema>;

// ─── Agent Schema ─────────────────────────────────────────────────

export const agentSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(50, 'Nom trop long'),
  prenom: z.string().min(1, 'Le prénom est requis').max(50, 'Prénom trop long'),
  email: z.string().email('Adresse email invalide').toLowerCase(),
  telephone: z.string().max(20, 'Téléphone trop long').optional().or(z.literal('')),
  username: z
    .string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(30, 'Nom d\'utilisateur trop long')
    .regex(/^[a-zA-Z0-9_.]+$/, 'Seuls lettres, chiffres, _ et . sont autorisés'),
});

export type AgentFormData = z.infer<typeof agentSchema>;
