// ─── User Profile ─────────────────────────────────────────────────────────────

export type TypePieceIdentite = 'CARTE_IDENTITE' | 'PASSEPORT' | 'PERMIS_DE_CONDUIRE';
export type TypeCompte = 'PARTICULIER' | 'PROFESSIONNEL';
export type StatutCompte = 'EN_ATTENTE_ACTIVATION' | 'ACTIF' | 'INACTIF' | 'SUSPENDU';

// ─── Pièce d'identité ────────────────────────────────────────────────────────

/** Statut du document d'identité soumis par l'utilisateur. */
export type StatutPieceIdentite = 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE';

export interface PieceIdentite {
  id: string;
  typeDocument: TypePieceIdentite;
  numero: string;
  fichierUrl: string;
  statut: StatutPieceIdentite;
  /** Motif fourni par le modérateur en cas de rejet. */
  motifRejet: string | null;
  uploadedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  type: TypeCompte | null;
  photoProfil: string | null;
  // Pièce d'identité — champs plats retournés par le backend
  typePieceIdentite: TypePieceIdentite | null;
  numeroPieceIdentite: string | null;
  pieceIdentiteUrl: string | null;
  statutPieceIdentite: StatutPieceIdentite | null;
  motifRejetPieceIdentite: string | null;
  statut: StatutCompte;
  roles: string[];
  createdAt: string;
  entrepriseId: string | null;
  entrepriseNom: string | null;
  parentUserId: string | null;
  parentUsername: string | null;
}

// ─── Update Profile Request ───────────────────────────────────────────────────

export interface UpdateProfileRequest {
  nom?: string;
  prenom?: string;
  telephone?: string;
  typePieceIdentite?: TypePieceIdentite;
  numeroPieceIdentite?: string;
}

// ─── Admin – mise à jour du statut d'une pièce ────────────────────────────────

export interface UpdatePieceStatutRequest {
  statut: StatutPieceIdentite;
  motifRejet?: string;
}

// ─── Profile Store State ──────────────────────────────────────────────────────

export interface UserProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}
