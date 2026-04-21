# Processus de signalement — Guide Frontend

> **Base URL :** `http://<host>/api`  
> **Auth :** Requêtes authentifiées → `Authorization: Bearer <token>`

---

## Vue d'ensemble

```
Utilisateur connecté          Backend                    Admin / Modérateur
       │                         │                               │
       │  POST /{id}/signaler     │                               │
       │────────────────────────▶│  Enregistre le signalement    │
       │  201 Created             │──────────────────────────────▶│
       │◀────────────────────────│                               │
       │                         │  GET /admin/signalements       │
       │                         │◀──────────────────────────────│
       │                         │  Liste paginée                 │
       │                         │──────────────────────────────▶│
       │                         │  PUT /{id}/toggle-actif        │
       │                         │◀──────────────────────────────│
       │                         │  204 No Content                │
       │                         │──────────────────────────────▶│
```

---

## Étape 1 — L'utilisateur signale une annonce

### `POST /api/biens-immo/{id}/signaler`

**Accès :** Tout utilisateur authentifié  
**Condition :** L'annonce doit être active (`actif = true`)

**Body :**
```json
{
  "motif": "ARNAQUE_FRAUDE",
  "commentaire": "Le vendeur demande un virement avant visite."
}
```

**Valeurs possibles pour `motif` :**

| Valeur à envoyer | Libellé affiché |
|---|---|
| `ARNAQUE_FRAUDE` | Arnaque / fraude |
| `INFOS_INCORRECTES` | Infos incorrectes |
| `DEJA_VENDU_LOUE` | Déjà vendu / loué |
| `MAUVAISE_CATEGORIE` | Mauvaise catégorie |
| `PROBLEME_LOCALISATION` | Problème de localisation |
| `AUTRE` | Autre |

> `commentaire` est optionnel (max 500 caractères).  
> Un motif invalide renvoie automatiquement **400**.

**Réponses :**

| Code | Signification |
|------|--------------|
| `201` | Signalement enregistré |
| `400` | Motif manquant ou invalide |
| `401` | Non authentifié |
| `404` | Annonce introuvable ou inactive |

---

## Étape 2 — L'utilisateur retire son signalement *(optionnel)*

### `DELETE /api/biens-immo/{id}/signaler`

**Accès :** L'utilisateur authentifié qui a effectué le signalement  
**Body :** aucun  
**Condition :** Un signalement actif (`annule = false`) doit exister pour cet utilisateur sur cette annonce

**Réponses :**

| Code | Signification |
|------|---------------|
| `204` | Signalement annulé |
| `401` | Non authentifié |
| `404` | Aucun signalement actif trouvé pour cette annonce |

> Le signalement reste visible côté admin avec `annule: true` et `dateAnnulation` renseignée.

---

## Étape 3 — Le modérateur / admin consulte les signalements

### `GET /api/admin/signalements`

**Accès :** `ROLE_ADMINISTRATEUR` ou `ROLE_MODERATEUR`

**Paramètres query :**

| Paramètre | Type | Défaut |
|-----------|------|--------|
| `page` | int | `0` |
| `size` | int | `20` |

**Réponse 200 :**
```json
{
  "content": [
    {
      "id": 1,
      "annonceId": 42,
      "referenceAnnonce": "BIM-XXXXXX",
      "titreAnnonce": "Appartement F3 Cocody",
      "reporterId": "uuid",
      "reporterUsername": "jean.dupont",
      "motif": "Arnaque / fraude",
      "commentaire": "Le vendeur demande un virement avant visite.",
      "date": "2026-04-06T10:32:00",
      "annule": false,
      "dateAnnulation": null
    }
  ],
  "totalElements": 12,
  "totalPages": 1,
  "number": 0,
  "size": 20
}
```

> `motif` est retourné en **libellé lisible** (ex : `"Arnaque / fraude"`), pas en clé enum.

---

## Étape 4 — Le modérateur / admin agit sur l'annonce signalée

### `PUT /api/biens-immo/{annonceId}/toggle-actif`

**Accès :** `ROLE_ADMINISTRATEUR` ou `ROLE_MODERATEUR`  
**Body :** aucun  
**Réponse :** `204 No Content`

> Bascule l'état `actif` de l'annonce. Si elle était active → elle devient inactive (masquée du public). Un second appel la réactive.

---

## Récapitulatif des endpoints

| Méthode | URL | Rôle | Description |
|---------|-----|------|-------------|
| `POST` | `/api/biens-immo/{id}/signaler` | Authentifié | Signaler une annonce |
| `DELETE` | `/api/biens-immo/{id}/signaler` | Authentifié (auteur) | Retirer son signalement |
| `GET` | `/api/admin/signalements?page&size` | ADMIN / MOD | Lister les signalements |
| `PUT` | `/api/biens-immo/{id}/toggle-actif` | ADMIN / MOD | Désactiver / réactiver l'annonce |
| `GET` | `/api/biens-immo/{id}` | Public | Détail de l'annonce signalée |
| `GET` | `/api/users/{reporterId}` | ADMIN / MOD | Profil du signalant |

---

## Flux UI recommandé (côté admin)

```
Liste des signalements
│
├── Colonne "Annonce"   → lien vers GET /api/biens-immo/{annonceId}
├── Colonne "Signalé par" → lien vers GET /api/users/{reporterId}
├── Colonne "Motif"     → libellé lisible (ex: "Arnaque / fraude")
├── Colonne "Date"      → formatée
└── Bouton "Désactiver" → PUT /api/biens-immo/{annonceId}/toggle-actif
                          → rafraîchir la liste après 204
```

---

## Codes HTTP à gérer

| Code | Cause | Action frontend |
|------|-------|----------------|
| `201` | Signalement créé | Afficher confirmation |
| `204` | Annonce désactivée | Toast succès + rafraîchir |
| `400` | Motif invalide / manquant | Afficher `message` de la réponse |
| `401` | Token expiré | Rediriger vers `/login` |
| `403` | Rôle insuffisant | Afficher « Action non autorisée » |
| `404` | Annonce introuvable ou inactive | Afficher message d'erreur |

**Format erreur :**
```json
{ "message": "Description de l'erreur" }
```
