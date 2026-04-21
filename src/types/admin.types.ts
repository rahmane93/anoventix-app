// ─── Énumérations ─────────────────────────────────────────────────────────────

export type StatutUtilisateur =
  | 'ACTIF'
  | 'SUSPENDU'
  | 'INACTIF'
  | 'EN_ATTENTE_ACTIVATION';

export type StatutPieceIdentite = 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE';

export type TypePieceIdentite = 'CNI' | 'PASSEPORT' | 'PERMIS' | 'AUTRE';

export const STATUT_USER_LABELS: Record<StatutUtilisateur, string> = {
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  INACTIF: 'Inactif',
  EN_ATTENTE_ACTIVATION: 'En attente',
};

export const STATUT_PIECE_LABELS: Record<StatutPieceIdentite, string> = {
  EN_ATTENTE: 'En attente',
  VALIDEE: 'Validée',
  REJETEE: 'Rejetée',
};

export const TYPE_PIECE_LABELS: Record<TypePieceIdentite, string> = {
  CNI: 'Carte nationale',
  PASSEPORT: 'Passeport',
  PERMIS: 'Permis de conduire',
  AUTRE: 'Autre',
};

// ─── Payloads API ─────────────────────────────────────────────────────────────

export interface ChangeStatutUserRequest {
  statut: 'ACTIF' | 'SUSPENDU' | 'INACTIF';
}

export interface ChangePieceIdentiteStatutRequest {
  statut: 'VALIDEE' | 'REJETEE';
  motifRejet?: string;
}

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUtilisateurs: number;
  totalAnnoncesActives: number;
  totalSignalements: number;
  totalEntreprises: number;
  utilisateursEnAttenteActivation: number;
  piecesIdentiteEnAttente: number;
}

export interface Signalement {
  id: number;
  annonceId: number;
  referenceAnnonce: string;
  titreAnnonce: string;
  reporterId: string;
  reporterUsername: string;
  motif: string;
  commentaire: string;
  date: string;
  annule: boolean;
  dateAnnulation: string | null;
}

export interface SignalementsPage {
  content: Signalement[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  type: string | null;
  photoProfil: string | null;
  typePieceIdentite: TypePieceIdentite | null;
  numeroPieceIdentite: string | null;
  pieceIdentiteUrl: string | null;
  statutPieceIdentite: StatutPieceIdentite | null;
  motifRejetPieceIdentite: string | null;
  statut: StatutUtilisateur;
  roles: string[];
  entrepriseId: string | null;
  entrepriseNom: string | null;
  parentUserId: string | null;
  parentUsername: string | null;
  createdAt: string;
}

export interface AdminAnnonceLocalisation {
  id: number;
  pays: string | null;
  region: string | null;
  commune: string | null;
  quartier: string | null;
  adresse: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface AdminAnnonceMedia {
  id: number;
  url: string;
  typeMedia: 'IMAGE' | 'VIDEO';
  ordre: number;
}

export interface AdminAnnonce {
  id: number;
  referenceAnnonce: string;
  titre: string;
  description: string | null;
  prix: number;
  surface: number | null;
  typeBien: string;
  typeTransaction: string;
  actif: boolean;
  vueCount: number;
  dateCreation: string;
  localisation: AdminAnnonceLocalisation | null;
  medias: AdminAnnonceMedia[];
  proprietaireId: string;
  proprietaireUsername: string;
  entrepriseId: string | null;
}

export interface AdminAnnoncesPage {
  data: AdminAnnonce[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface AnnonceStats {
  annonceId: number;
  referenceAnnonce: string;
  vueCount: number;
}
