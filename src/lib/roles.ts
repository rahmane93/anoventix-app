// ─── Libellés officiels des rôles ────────────────────────────────────────────

export const ROLE_DISPLAY_LABELS: Record<string, string> = {
  ROLE_ADMINISTRATEUR: 'Administrateur',
  ROLE_MODERATEUR: 'Modérateur',
  ROLE_PROFESSIONNEL: 'Professionnel',
  ROLE_AGENT_PROFESSIONNEL: 'Agent professionnel',
  ROLE_PARTICULIER: 'Particulier',
  ROLE_USER: 'Utilisateur',
  // Variantes sans préfixe (ancienne API)
  ADMINISTRATEUR: 'Administrateur',
  MODERATEUR: 'Modérateur',
  PROFESSIONNEL: 'Professionnel',
  AGENT_PROFESSIONNEL: 'Agent professionnel',
  PARTICULIER: 'Particulier',
};

/**
 * Retourne le libellé lisible pour un rôle (ex. "ROLE_MODERATEUR" → "Modérateur").
 * Fallback : retire le préfixe ROLE_ et met en titlecase.
 */
export function getRoleLabel(role: string | null | undefined): string {
  if (!role) return '';
  return ROLE_DISPLAY_LABELS[role.trim()]
    ?? role.replace(/^ROLE_/, '').replace(/_/g, ' ').toLowerCase()
         .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Retourne les libellés lisibles pour une liste de rôles, dédupliqués.
 */
export function getRoleLabels(roles?: string[] | null, type?: string | null): string[] {
  const fromRoles = Array.from(new Set((roles ?? []).map(getRoleLabel).filter(Boolean)));
  if (fromRoles.length > 0) return fromRoles;
  if (type) return [ROLE_DISPLAY_LABELS[type.toUpperCase()] ?? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()];
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────

export function normalizeRole(role: string | null | undefined): string {
  if (!role) return '';
  return role.trim().toUpperCase();
}

export function hasRole(roles: string[] | null | undefined, ...expectedRoles: string[]): boolean {
  const normalizedRoles = (roles ?? []).map(normalizeRole);
  return expectedRoles.some((expectedRole) => normalizedRoles.includes(normalizeRole(expectedRole)));
}

export function getRoleFlags(roles?: string[] | null, type?: string | null) {
  const isProfessionnel =
    hasRole(roles, 'ROLE_PROFESSIONNEL', 'PROFESSIONNEL') || normalizeRole(type) === 'PROFESSIONNEL';
  const isAgentProfessionnel = hasRole(roles, 'ROLE_AGENT_PROFESSIONNEL');
  const isParticulier =
    !isProfessionnel &&
    !isAgentProfessionnel &&
    (hasRole(roles, 'ROLE_PARTICULIER', 'PARTICULIER') || normalizeRole(type) === 'PARTICULIER' || !(roles?.length));

  return {
    isProfessionnel,
    isAgentProfessionnel,
    isParticulier,
    canManageEntreprise: isProfessionnel,
    canAccessEntreprise: isProfessionnel || isAgentProfessionnel,
    canPublishAnnonce: isProfessionnel || isAgentProfessionnel || isParticulier,
  };
}