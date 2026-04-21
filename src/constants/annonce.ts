import type { RoleAnnonceur } from '../types/annonce.types';

/**
 * Labels lisibles pour les rôles d'annonceur.
 */
export const ROLE_LABELS: Record<RoleAnnonceur, string> = {
  PARTICULIER: 'Particulier',
  PROFESSIONNEL: 'Professionnel',
  MODERATEUR: 'Modérateur',
  ADMINISTRATEUR: 'Admin',
};

/**
 * Couleurs associées aux rôles d'annonceur.
 */
export const ROLE_COLORS: Record<RoleAnnonceur, string> = {
  PARTICULIER: '#1A3C6E',
  PROFESSIONNEL: '#D4A017',
  MODERATEUR: '#6B7280',
  ADMINISTRATEUR: '#EF4444',
};
