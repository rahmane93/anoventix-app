import type { Localisation } from '../types/annonce.types';

/**
 * Formate un prix en Francs Guinéens (GNF).
 */
export function formatPrix(prix: number): string {
  return prix.toLocaleString('fr-FR') + ' GNF';
}

/**
 * Formate une date ISO en date lisible fr-FR.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formate l'affichage d'une localisation : quartier, commune, préfecture.
 */
export function formatFullLocalisation(
  loc?: Partial<Pick<Localisation, 'quartier' | 'commune' | 'prefecture'>> | null,
): string {
  const parts = [loc?.quartier, loc?.commune, loc?.prefecture].filter(Boolean) as string[];
  return parts.join(', ');
}

// ─── Utilitaires numériques (saisie formulaire) ───────────────────────────────

/**
 * Supprime tout caractère non numérique d'une chaîne.
 */
export function sanitizeNumericInput(value: string): string {
  return value.replace(/\D+/g, '');
}

/**
 * Formate un nombre saisi en séparant les milliers par des espaces.
 * Ex : "1200000" → "1 200 000"
 */
export function formatNumericInput(value: string): string {
  const digits = sanitizeNumericInput(value);
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

/**
 * Parse une valeur saisie (potentiellement formatée) en nombre.
 * Retourne `null` si la valeur est vide ou invalide.
 */
export function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(sanitizeNumericInput(value));
  return Number.isFinite(n) ? n : null;
}

/**
 * Retourne true si la valeur saisie représente un nombre valide.
 */
export function isValidNumber(value: string): boolean {
  return parseOptionalNumber(value) !== null;
}

// ─── Utilitaires d'erreurs API ────────────────────────────────────────────────

/**
 * Extrait un message d'erreur lisible depuis une erreur inconnue.
 * Compatible avec les erreurs normalisées par l'intercepteur Axios
 * (`{ message, status, raw, errors }`) ou n'importe quel autre throw.
 */
export function getErrorMessage(err: unknown, fallback = 'Une erreur est survenue'): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string' && msg.trim().length > 0) return msg;
  }
  return fallback;
}

/**
 * Détecte les erreurs Hibernate de lazy-loading renvoyées par le backend.
 * Dans ce cas, l'action a peut-être réussi mais la réponse est corrompue.
 */
export function isHibernateLazyError(err: unknown): boolean {
  const msg = getErrorMessage(err, '').toLowerCase();
  return (
    msg.includes('failed to lazily initialize') ||
    msg.includes('could not initialize proxy') ||
    (msg.includes('lazy') && msg.includes('no session'))
  );
}

/**
 * Retourne un message d'erreur adapté pour les opérations sur les médias,
 * en détectant les erreurs Hibernate de lazy-loading.
 */
export function humanizeMediaError(err: unknown, fallback: string): string {
  if (isHibernateLazyError(err)) {
    return "Erreur serveur lors du chargement des médias. L'action a peut-être été appliquée. Rafraîchissez l'annonce ou réessayez.";
  }
  return getErrorMessage(err, fallback);
}

