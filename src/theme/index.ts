// ─── Palette Anoventix ────────────────────────────────────────────────────────

export const colors = {
  // Primaire — bleu immobilier professionnel
  primary:        '#1A3C6E',
  primaryLight:   '#2A5FA8',
  primaryDark:    '#0F2444',
  primarySurface: '#EEF3FB', // fond léger : chips sélectionnées, états actifs, tags

  // Accent — or/ambre
  accent:      '#D4A017',
  accentLight: '#F0BB30',
  accentSurface: '#FDF6E3', // fond léger accent

  // Surfaces & fonds
  white:           '#FFFFFF',
  background:      '#F2F2F2', // fond général — gris neutre clair
  headerBackground:'#EAE5DC', // en-tête — beige sable chaud
  surface:         '#FFFFFF', // cartes, modales, panneaux
  surfaceElevated: '#FFFFFF', // cartes avec ombre (même valeur, sémantiquement distinct)

  // Bordures & séparateurs
  border:      '#E2D9CC', // bordures principales — ton chaud
  borderFocus: '#2A5FA8', // bordure au focus
  divider:     '#EDE6DC', // séparateurs fins, lignes de liste

  // Texte
  textPrimary:   '#111827', // titres, contenus principaux
  textSecondary: '#4B5563', // texte secondaire
  textMuted:     '#9CA3AF', // placeholder, labels désactivés
  textOnPrimary: '#FFFFFF', // texte sur fond primaire
  textOnAccent:  '#1A1A1A', // texte sur fond accent

  // Inputs
  inputBackground: '#FFFFFF', // fond des champs de saisie — blanc pour la lisibilité

  // États sémantiques
  success:      '#10B981',
  successLight: '#D1FAE5',
  error:        '#EF4444',
  errorLight:   '#FEE2E2',
  warning:      '#F59E0B',
  warningLight: '#FEF3C7',
  info:         '#3B82F6',
  infoLight:    '#DBEAFE',

  // Utilitaires
  overlay:     'rgba(0, 0, 0, 0.5)',
  placeholder: '#9CA3AF',
} as const;

// ─── Typographie ──────────────────────────────────────────────────────────────

export const typography = {
  fonts: {
    regular:   'Nunito_400Regular',
    medium:    'Nunito_500Medium',
    semibold:  'Nunito_600SemiBold',
    bold:      'Nunito_700Bold',
    extrabold: 'Nunito_800ExtraBold',
  },
  sizes: {
    '2xs': 10, // badges, compteurs
    xs:    12, // labels discrets, timestamps
    sm:    14, // corps secondaire, captions
    md:    16, // corps principal
    lg:    18, // sous-titres
    xl:    20, // titres d'écran
    '2xl': 24, // grands titres
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    regular:   '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight:   1.2,
    snug:    1.35,
    normal:  1.5,
    relaxed: 1.7,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  xs:   4,  // badges, tags compacts
  sm:   8,  // boutons sm, icônes
  md:   12, // cartes, inputs
  lg:   16, // boutons principaux, panneaux
  xl:   24, // grands conteneurs, bottom sheets
  '2xl': 32,
  full:  9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#1A3C6E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: '#1A3C6E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#1A3C6E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  lg: {
    shadowColor: '#1A3C6E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
  },
} as const;

// ─── Opacités ─────────────────────────────────────────────────────────────────

export const opacity = {
  disabled: 0.45,
  muted:    0.6,
  overlay:  0.5,
  hover:    0.8,
} as const;

// ─── Z-Index ──────────────────────────────────────────────────────────────────

export const zIndex = {
  base:    0,
  raised:  1,
  dropdown: 10,
  sticky:  20,
  modal:   50,
  toast:   100,
} as const;

// ─── Animation ────────────────────────────────────────────────────────────────

export const animation = {
  duration: {
    fast:   150,
    normal: 250,
    slow:   400,
  },
  easing: {
    standard: 'ease-in-out',
    enter:    'ease-out',
    exit:     'ease-in',
  },
} as const;
