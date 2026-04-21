// ─── Entreprise ───────────────────────────────────────────────────────────────

export interface AgentDTO {
  id: string;
  username: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  entrepriseId: string;
  statut: string;
}

export interface EntrepriseDTO {
  id: string;
  nom: string;
  description: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  pays: string | null;
  numeroRCCM: string | null;
  proprietaireId: string;
  proprietaireUsername: string;
  agents: AgentDTO[];
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface CreateEntrepriseRequest {
  nom: string;
  description?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  pays?: string;
  numeroRCCM?: string;
}

export type UpdateEntrepriseRequest = CreateEntrepriseRequest;

export interface CreateAgentRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  username: string;
}
