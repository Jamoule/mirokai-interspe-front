# Mirokai API — Documentation

**Base URL** : `http://localhost:5000/api`
**Auth** : JWT Bearer token — `Authorization: Bearer <token>`

---

## Sommaire

- [Auth](#auth)
- [Modules](#modules)
- [Questions](#questions)
- [Quiz](#quiz)
- [Upload](#upload)
- [Admins](#admins)
- [Settings](#settings)

---

## Auth

### POST `/auth/login`

Connexion admin. Retourne un JWT token.

**Public** — pas de token requis

**Body**
```json
{
  "email": "admin@mirokai.fr",
  "password": "admin123"
}
```

**Réponse 200**
```json
{
  "token": "<jwt>",
  "admin": {
    "id": "abc123",
    "email": "admin@mirokai.fr",
    "display_name": "Admin"
  }
}
```

| Code | Cas |
|------|-----|
| 200  | Connexion réussie |
| 400  | Email ou mot de passe manquant |
| 401  | Identifiants incorrects ou compte inactif |

---

### GET `/auth/me`

Retourne le profil de l'admin connecté.

**Auth requise**

**Réponse 200**
```json
{
  "id": "abc123",
  "email": "admin@mirokai.fr",
  "display_name": "Admin",
  "last_login_at": "2026-03-11T10:00:00"
}
```

| Code | Cas |
|------|-----|
| 200  | OK |
| 401  | Token manquant ou invalide |
| 404  | Admin introuvable (supprimé) |

---

### POST `/auth/logout`

Déconnexion (invalide côté client — le token reste valide jusqu'à expiration).

**Auth requise**

**Réponse 200**
```json
{ "message": "Déconnecté" }
```

---

## Modules

### GET `/modules`

Liste les modules **actifs** par ordre suggéré.

**Public**

**Réponse 200** — tableau de modules
```json
[
  {
    "id": "abc123",
    "number": 1,
    "name": "La Forêt",
    "description": "...",
    "media_type": "image",
    "media_url": "/uploads/modules/xxx.jpg",
    "image_urls": ["/uploads/modules/a.jpg"],
    "qr_code": "MOD-001",
    "position_x": 0.25,
    "position_y": 0.40,
    "has_quiz": true,
    "is_active": true,
    "suggested_order": 1,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

---

### GET `/modules/all`

Liste **tous** les modules (actifs et inactifs).

**Auth requise**

**Réponse 200** — même format que `/modules`

---

### GET `/modules/qr/:qr_code`

Récupère un module actif par son QR code.

**Public**

| Code | Cas |
|------|-----|
| 200  | Module trouvé |
| 404  | QR code inconnu ou module inactif |

---

### GET `/modules/:id`

Récupère un module par son ID (actif ou inactif).

**Public**

| Code | Cas |
|------|-----|
| 200  | Module trouvé |
| 404  | ID inconnu |

---

### POST `/modules`

Crée un nouveau module.

**Auth requise**

**Body** (champs requis : `number`, `name`, `qr_code`)
```json
{
  "number": 2,
  "name": "La Rivière",
  "description": "Description du module",
  "media_type": "image",
  "media_url": "/uploads/modules/riviere.jpg",
  "image_urls": ["/uploads/modules/riviere.jpg"],
  "qr_code": "MOD-002",
  "position_x": 0.5,
  "position_y": 0.3,
  "has_quiz": true,
  "is_active": true,
  "suggested_order": 2
}
```

| Code | Cas |
|------|-----|
| 201  | Module créé |
| 400  | Champ requis manquant, `number` ou `qr_code` déjà utilisé |
| 401  | Non authentifié |

---

### PUT `/modules/:id`

Met à jour un module (tous les champs sont optionnels).

**Auth requise**

**Body** — mêmes champs que POST, tous optionnels

| Code | Cas |
|------|-----|
| 200  | Module mis à jour |
| 400  | Conflit `number` ou `qr_code` |
| 401  | Non authentifié |
| 404  | Module introuvable |

---

### PATCH `/modules/:id/position`

Met à jour la position X/Y du module sur le plan.

**Auth requise**

**Body**
```json
{
  "position_x": 0.42,
  "position_y": 0.67
}
```

| Code | Cas |
|------|-----|
| 200  | Position mise à jour |
| 400  | Corps manquant |
| 401  | Non authentifié |
| 404  | Module introuvable |

---

### PATCH `/modules/:id/toggle`

Active ou désactive un module.

**Auth requise**

**Body**
```json
{ "is_active": false }
```

| Code | Cas |
|------|-----|
| 200  | État mis à jour |
| 400  | `is_active` manquant |
| 401  | Non authentifié |
| 404  | Module introuvable |

---

### DELETE `/modules/:id`

Supprime un module.

**Auth requise**

**Réponse 200**
```json
{ "message": "Module supprimé" }
```

| Code | Cas |
|------|-----|
| 200  | Supprimé |
| 401  | Non authentifié |
| 404  | Module introuvable |

---

## Questions

### GET `/modules/:id/questions?age_group=<valeur>`

Liste les questions d'un module pour un groupe d'âge. N'inclut **pas** le `secret_word`.

**Public**

**Query params**

| Param | Requis | Valeurs acceptées |
|-------|--------|-------------------|
| `age_group` | Oui | `5-7`, `8-10`, `11-13`, `14+` |

**Réponse 200**
```json
[
  {
    "id": "q123",
    "module_id": "abc123",
    "age_group": "5-7",
    "question_text": "Quelle est la couleur du ciel ?",
    "display_order": 1,
    "answers": [
      { "id": "a1", "question_id": "q123", "answer_text": "Bleu", "is_correct": 1, "display_order": 1 },
      { "id": "a2", "question_id": "q123", "answer_text": "Rouge", "is_correct": 0, "display_order": 2 }
    ]
  }
]
```

| Code | Cas |
|------|-----|
| 200  | OK |
| 400  | `age_group` absent ou valeur invalide |
| 404  | Module introuvable ou inactif |

---

### GET `/modules/:id/questions/all`

Liste **toutes** les questions d'un module (tous âges), inclut le `secret_word`.

**Auth requise**

| Code | Cas |
|------|-----|
| 200  | OK |
| 401  | Non authentifié |
| 404  | Module introuvable |

---

### POST `/questions`

Crée une question avec ses réponses.

**Auth requise**

**Body** (champs requis : `module_id`, `age_group`, `question_text`)
```json
{
  "module_id": "abc123",
  "age_group": "5-7",
  "question_text": "Quelle est la couleur du ciel ?",
  "secret_word": "AZUR",
  "display_order": 1,
  "answers": [
    { "answer_text": "Bleu",  "is_correct": true,  "display_order": 1 },
    { "answer_text": "Rouge", "is_correct": false, "display_order": 2 },
    { "answer_text": "Vert",  "is_correct": false, "display_order": 3 },
    { "answer_text": "Jaune", "is_correct": false, "display_order": 4 }
  ]
}
```

**Réponse 201** — question complète avec answers et `secret_word`

| Code | Cas |
|------|-----|
| 201  | Question créée |
| 400  | Champ requis manquant, `age_group` invalide, `module_id` introuvable |
| 401  | Non authentifié |

---

### PUT `/questions/:id`

Met à jour une question. Si `answers` est fourni, les réponses existantes sont **remplacées**.

**Auth requise**

**Body** — tous les champs sont optionnels
```json
{
  "age_group": "8-10",
  "question_text": "Texte modifié",
  "secret_word": "NOUVEAU",
  "display_order": 2,
  "answers": [
    { "answer_text": "Bleu",    "is_correct": true,  "display_order": 1 },
    { "answer_text": "Violet",  "is_correct": false, "display_order": 2 }
  ]
}
```

| Code | Cas |
|------|-----|
| 200  | Question mise à jour |
| 400  | `age_group` invalide |
| 401  | Non authentifié |
| 404  | Question introuvable |

---

### DELETE `/questions/:id`

Supprime une question (et ses réponses en cascade).

**Auth requise**

**Réponse 200**
```json
{ "message": "Question supprimée" }
```

| Code | Cas |
|------|-----|
| 200  | Supprimée |
| 401  | Non authentifié |
| 404  | Question introuvable |

---

## Quiz

### POST `/quiz/validate`

Valide une réponse. Si correcte, retourne le `secret_word` de la question.

**Public**

**Body**
```json
{
  "question_id": "q123",
  "answer_id": "a1"
}
```

**Réponse 200 — bonne réponse**
```json
{ "correct": true, "secret_word": "AZUR" }
```

**Réponse 200 — mauvaise réponse**
```json
{ "correct": false, "secret_word": null }
```

| Code | Cas |
|------|-----|
| 200  | Validation effectuée |
| 400  | `question_id` ou `answer_id` manquant |
| 404  | Réponse introuvable pour cette question |

---

## Upload

### POST `/upload?folder=<dossier>`

Uploade un fichier média (image, vidéo, audio).

**Auth requise** — `multipart/form-data`

**Query params**

| Param | Requis | Défaut | Description |
|-------|--------|--------|-------------|
| `folder` | Non | `uploads` | Sous-dossier de destination (alphanumériques, `-`, `_`) |

**Form data**

| Champ | Type | Description |
|-------|------|-------------|
| `file` | File | Fichier à uploader |

**Extensions acceptées** : `png`, `jpg`, `jpeg`, `gif`, `webp`, `mp4`, `webm`, `mp3`, `wav`, `ogg`, `m4a`
**Taille max** : 100 MB

**Réponse 201**
```json
{
  "url": "/uploads/modules/550e8400-e29b-41d4-a716-446655440000.jpg",
  "filename": "550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

| Code | Cas |
|------|-----|
| 201  | Fichier uploadé |
| 400  | Fichier absent, nom vide, ou extension non autorisée |
| 401  | Non authentifié |
| 413  | Fichier trop volumineux (> 100 MB) |

---

### DELETE `/upload`

Supprime un fichier uploadé.

**Auth requise**

**Body**
```json
{ "url": "/uploads/modules/550e8400-e29b-41d4-a716-446655440000.jpg" }
```

**Réponse 200**
```json
{ "message": "Fichier supprimé" }
```

| Code | Cas |
|------|-----|
| 200  | Fichier supprimé |
| 400  | `url` absente ou format invalide (doit commencer par `/uploads/`) |
| 401  | Non authentifié |
| 404  | Fichier introuvable sur le disque |

---

## Admins

### GET `/admins`

Liste tous les admins (le `password_hash` est exclu de la réponse).

**Auth requise**

**Réponse 200**
```json
[
  {
    "id": "abc123",
    "email": "admin@mirokai.fr",
    "display_name": "Admin",
    "is_active": true,
    "last_login_at": "2026-03-11T10:00:00",
    "created_at": "..."
  }
]
```

---

### POST `/admins`

Crée un nouvel admin.

**Auth requise**

**Body** (champs requis : `email`, `password`, `display_name`)
```json
{
  "email": "nouvel-admin@mirokai.fr",
  "password": "motdepasse123",
  "display_name": "Nouvel Admin"
}
```

**Réponse 201** — admin créé (sans `password_hash`)

| Code | Cas |
|------|-----|
| 201  | Admin créé |
| 400  | Champ requis manquant, ou email déjà utilisé |
| 401  | Non authentifié |

---

### PUT `/admins/:id`

Met à jour un admin. Tous les champs sont optionnels.

**Auth requise**

**Body**
```json
{
  "email": "nouveau@mirokai.fr",
  "display_name": "Nom modifié",
  "password": "nouveaumdp",
  "is_active": false
}
```

> **Note** : un admin ne peut pas se désactiver lui-même (`is_active: false` sur son propre compte → 400).

| Code | Cas |
|------|-----|
| 200  | Admin mis à jour |
| 400  | Email déjà utilisé, ou auto-désactivation |
| 401  | Non authentifié |
| 404  | Admin introuvable |

---

### DELETE `/admins/:id`

Supprime un admin.

**Auth requise**

> **Règles** :
> - Impossible de se supprimer soi-même → 400
> - Impossible de supprimer le dernier admin actif → 400

**Réponse 200**
```json
{ "message": "Admin supprimé" }
```

| Code | Cas |
|------|-----|
| 200  | Supprimé |
| 400  | Auto-suppression, ou dernier admin actif |
| 401  | Non authentifié |
| 404  | Admin introuvable |

---

## Settings

Les settings sont stockés dans la table `parcours_settings`. Une seule entrée active existe à la fois.

### GET `/settings`

Retourne les paramètres du parcours.

**Public**

**Réponse 200**
```json
{
  "id": "s1",
  "parcours_name": "Parcours Mirokai",
  "plan_image_url": "/uploads/plan.jpg",
  "welcome_message": "Bienvenue !",
  "completion_message": "Félicitations !",
  "completion_email_template": null,
  "completion_redirect_url": null,
  "estimated_duration_min": 30,
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

| Code | Cas |
|------|-----|
| 200  | OK |
| 404  | Aucun settings actif en base |

---

### PUT `/settings`

Met à jour (ou crée) les paramètres du parcours.

**Auth requise**

**Body** — tous les champs sont optionnels
```json
{
  "parcours_name": "Parcours Mirokai",
  "plan_image_url": "/uploads/plan.jpg",
  "welcome_message": "Bienvenue !",
  "completion_message": "Félicitations !",
  "completion_email_template": null,
  "completion_redirect_url": "https://mirokai.fr",
  "estimated_duration_min": 45
}
```

| Code | Cas |
|------|-----|
| 200  | Settings mis à jour |
| 201  | Settings créés (première fois) |
| 400  | Corps manquant |
| 401  | Non authentifié |

---

## Fichiers statiques

### GET `/uploads/<path>`

Sert les fichiers uploadés directement.

**Public** — pas d'auth requise

**Exemple** : `GET /uploads/modules/550e8400-e29b-41d4-a716-446655440000.jpg`

| Code | Cas |
|------|-----|
| 200  | Fichier retourné |
| 403  | Tentative de path traversal |
| 404  | Fichier inexistant |

---

## Codes d'erreur communs

| Code | Signification |
|------|---------------|
| 400  | Requête invalide (champ manquant, validation échouée) |
| 401  | Non authentifié (token absent ou expiré) |
| 403  | Accès interdit |
| 404  | Ressource introuvable |
| 413  | Fichier trop volumineux |
| 500  | Erreur serveur interne |

Toutes les erreurs retournent :
```json
{ "error": "Message descriptif" }
```
