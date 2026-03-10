# Context — PWA Mirokaï Experience (Front-end SvelteKit)

> Document de contexte pour le développement front-end.
> À lire avant toute contribution au projet.

---

## 1. Présentation du projet

### 1.1 Qu'est-ce qu'on construit ?

Une **Progressive Web App (PWA)** pour la **Mirokaï Experience**, un parcours de visite immersif au sein de l'espace démo d'Enchanted Tools, situé au 18 rue de la Fontaine au Roi, Paris 11e.

### 1.2 Pour qui ?

Un **public familial** : familles accompagnées d'enfants âgés de **3 à 10 ans**.
L'enfant est au centre de l'expérience, les parents sont accompagnants.

### 1.3 Pourquoi ?

- Transformer les audioguides existants en une expérience **narrative, immersive et ludique**
- Permettre aux familles de découvrir la robotique comme une **aventure**
- Guider les visiteurs de manière fluide et intuitive à travers les modules de l'espace démo
- Permettre à l'équipe Enchanted Tools de faire évoluer l'espace facilement via un back-office admin

### 1.4 Big Idea

**"Découvrez la robotique comme une aventure"**
Trois piliers : **Curiosité**, **Aventure**, **Accessibilité**.

### 1.5 Durée de visite

Environ **30 à 45 minutes**.

### 1.6 Support

- **Tablettes** mises à disposition par le musée (support principal)
- **Smartphones** des parents (alternative)

---

## 2. Architecture technique

### 2.1 Vue d'ensemble

Architecture **client-serveur découplée (headless)** :

```
┌─────────────────────┐       API REST        ┌─────────────────────┐
│                     │  ◄──────────────────►  │                     │
│   Front-end (PWA)   │                        │   Back-end (BaaS)   │
│   SvelteKit + Vite  │                        │     Supabase        │
│                     │                        │   (PostgreSQL)      │
│   Déployé sur       │                        │   Supabase Cloud    │
│   Vercel / Netlify  │                        │                     │
└─────────────────────┘                        └─────────────────────┘
        │                                              │
        │  Service Worker                              │
        │  (cache offline)                             ├── Auth (admin)
        │                                              ├── Storage (médias)
        │                                              └── Realtime (optionnel)
```

### 2.2 Stack front-end

| Technologie | Rôle | Version |
|---|---|---|
| **SvelteKit** | Framework front (SSR/SPA/PWA) | 2.x (Svelte 5) |
| **Vite** | Build tool (intégré à SvelteKit) | 5.x |
| **TypeScript** | Typage statique | 5.x |
| **Tailwind CSS** | Styling utilitaire | 3.x |
| **@vite-pwa/sveltekit** | Plugin PWA (service worker, manifest) | 0.3+ |
| **svelte-dnd-action** | Drag & drop (back-office admin) | latest |
| **@supabase/supabase-js** | Client Supabase (API, auth, storage) | 2.x |

### 2.3 Stack back-end (Supabase)

| Service | Usage |
|---|---|
| **PostgreSQL** | Base de données relationnelle |
| **API REST auto-générée** | CRUD modules, questions, sessions |
| **Auth** | Authentification admin (email/password) |
| **Storage** | Upload et service des fichiers médias (audio, vidéo, images) |
| **Realtime** | Optionnel — sync live si besoin |

### 2.4 Justification des choix

**Pourquoi SvelteKit plutôt que React/Vite ou Vue/Vite ?**

- Bundle compilé ultra-léger (pas de runtime embarqué) → pertinent pour une PWA sur tablette
- Réactivité native sans boilerplate (`ref()`, `useState` inutiles)
- Routing file-based intégré, pas de lib externe
- Support PWA natif (service worker détecté automatiquement dans `src/`)
- Syntaxe proche du HTML/JS/CSS standard → code lisible et maintenable
- Enchanted Tools utilise déjà NuxtJS (Vue), mais NuxtJS est un meta-framework SSR/SSG non pertinent pour une app fermée sans enjeu SEO

**Pourquoi Supabase plutôt qu'Express/Fastify ?**

- API REST + Auth + Storage + BDD en un seul service, sans coder de backend
- Free tier généreux, open source, faible vendor lock-in
- PostgreSQL relationnel adapté à la structure des données (modules → questions par tranche d'âge)
- Gain de temps critique sur un projet d'une semaine en solo

**Pourquoi pas JAMstack ?**

- Le contenu est dynamique (modules configurables, quiz adaptatifs, positions drag & drop)
- Pas de pré-rendu statique nécessaire
- Pas d'enjeu SEO (app fermée sur tablette)

---

## 3. Structure du projet SvelteKit

```
mirokai-experience/
├── src/
│   ├── app.html                    # Template HTML principal
│   ├── app.css                     # Styles globaux (Tailwind imports)
│   ├── service-worker.ts           # Service worker PWA (cache offline)
│   │
│   ├── lib/                        # Code partagé (importable via $lib)
│   │   ├── components/             # Composants réutilisables
│   │   │   ├── ui/                 # Composants UI génériques
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Modal.svelte
│   │   │   │   └── ProgressBar.svelte
│   │   │   ├── map/                # Composants liés au plan interactif
│   │   │   │   ├── InteractiveMap.svelte
│   │   │   │   ├── ModulePin.svelte
│   │   │   │   └── MapOverlay.svelte
│   │   │   ├── quiz/               # Composants quiz
│   │   │   │   ├── QuizCard.svelte
│   │   │   │   ├── QuizAnswer.svelte
│   │   │   │   └── QuizResult.svelte
│   │   │   ├── audioguide/         # Composants audioguide / vidéo
│   │   │   │   ├── VideoPlayer.svelte
│   │   │   │   └── AudioPlayer.svelte
│   │   │   └── admin/              # Composants back-office
│   │   │       ├── ModuleEditor.svelte
│   │   │       ├── DragDropMap.svelte
│   │   │       └── MediaUploader.svelte
│   │   │
│   │   ├── stores/                 # Svelte stores (état global)
│   │   │   ├── session.ts          # Session visiteur (enfants, âges, progression)
│   │   │   ├── modules.ts          # Données des modules
│   │   │   └── quiz.ts             # État du quiz en cours
│   │   │
│   │   ├── services/               # Appels API / Supabase
│   │   │   ├── supabase.ts         # Client Supabase (singleton)
│   │   │   ├── modules.ts          # CRUD modules
│   │   │   ├── questions.ts        # CRUD questions / quiz
│   │   │   ├── sessions.ts         # Gestion sessions visiteurs
│   │   │   └── storage.ts          # Upload / récupération médias
│   │   │
│   │   ├── types/                  # Types TypeScript
│   │   │   ├── module.ts           # Module, ModulePosition, etc.
│   │   │   ├── question.ts         # Question, AgeGroup, etc.
│   │   │   ├── session.ts          # VisitorSession, Child, etc.
│   │   │   └── admin.ts            # Types admin
│   │   │
│   │   └── utils/                  # Utilitaires
│   │       ├── age-groups.ts       # Logique tranches d'âge
│   │       └── progression.ts      # Calcul progression visiteur
│   │
│   ├── routes/                     # Routes (file-based routing)
│   │   ├── +layout.svelte          # Layout global (header, navigation)
│   │   ├── +layout.ts              # Data loader global
│   │   ├── +page.svelte            # Page d'accueil / inscription
│   │   │
│   │   ├── visit/                  # ── Parcours visiteur ──
│   │   │   ├── +layout.svelte      # Layout visite (barre progression)
│   │   │   ├── +page.svelte        # Plan interactif principal
│   │   │   ├── module/
│   │   │   │   └── [id]/
│   │   │   │       ├── +page.svelte      # Contenu du module (vidéo/audio)
│   │   │   │       └── +page.ts          # Loader données module
│   │   │   ├── quiz/
│   │   │   │   └── [moduleId]/
│   │   │   │       ├── +page.svelte      # Quiz du module
│   │   │   │       └── +page.ts          # Loader questions par âge
│   │   │   └── complete/
│   │   │       └── +page.svelte          # Fin de visite (badge, photo, goodies)
│   │   │
│   │   ├── admin/                  # ── Back-office admin ──
│   │   │   ├── +layout.svelte      # Layout admin (sidebar, auth guard)
│   │   │   ├── +page.svelte        # Dashboard admin
│   │   │   ├── login/
│   │   │   │   └── +page.svelte    # Connexion admin
│   │   │   ├── modules/
│   │   │   │   ├── +page.svelte    # Liste des modules (CRUD)
│   │   │   │   ├── [id]/
│   │   │   │   │   └── +page.svelte    # Édition d'un module
│   │   │   │   └── new/
│   │   │   │       └── +page.svelte    # Création d'un module
│   │   │   ├── map/
│   │   │   │   └── +page.svelte    # Placement drag & drop sur le plan
│   │   │   └── questions/
│   │   │       └── +page.svelte    # Gestion des questions par module/âge
│   │   │
│   │   └── game/                   # ── Mini-jeu (bonus) ──
│   │       └── +page.svelte        # Mini-jeu lié à l'univers Mirokaï
│   │
│   └── server/                     # Code serveur uniquement ($lib/server)
│       └── auth.ts                 # Vérification auth admin côté serveur
│
├── static/                         # Assets statiques
│   ├── manifest.json               # Manifest PWA
│   ├── favicon.png
│   ├── icons/                      # Icônes PWA (192x192, 512x512)
│   ├── images/                     # Images du plan, backgrounds
│   └── fonts/                      # Polices custom (charte Enchanted Tools)
│
├── svelte.config.js                # Config SvelteKit (adapter, alias)
├── vite.config.ts                  # Config Vite (plugins PWA, etc.)
├── tailwind.config.js              # Config Tailwind (couleurs charte ET)
├── tsconfig.json                   # Config TypeScript
├── package.json
└── .env                            # Variables Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
```

---

## 4. Spécifications fonctionnelles

### 4.1 PWA Visiteur (obligatoire — priorité maximale)

#### 4.1.1 Inscription / Configuration de la visite
- Formulaire d'accueil : nombre d'enfants, nombre d'adultes, âge de chaque enfant
- Sélection automatique de la tranche d'âge pour adapter les quiz (3-4 ans, 5-7 ans, 8-10 ans)
- Stockage de la session en local (store Svelte) + optionnellement en BDD

#### 4.1.2 Plan interactif
- Affichage du plan de l'espace démo avec les modules positionnés
- Chaque module est cliquable → ouvre la page du module
- Indication visuelle des modules visités / non visités / en cours
- Parcours libre : aucun ordre imposé, le visiteur choisit

#### 4.1.3 Audioguide interactif par module
- Au clic sur un module : lancement d'une vidéo explicative
- Vidéo dans un univers visuel féérique, cohérent avec la charte graphique
- Personnage animé qui accompagne la narration
- À la fin de la vidéo : invitation à rejoindre le robot au centre

#### 4.1.4 Système de quiz adaptatif
- Après la vidéo, le visiteur répond à une question sur la tablette/téléphone
- Questions adaptées à la tranche d'âge de l'enfant
- 10 questions par tranche d'âge (3-4 / 5-7 / 8-10 / parents)
- Le robot félicite les participants après validation
- Invitation à faire tamponner le carnet physique

#### 4.1.5 Suivi de progression
- Barre ou indicateur de progression (modules complétés / total)
- Visualisation des tampons obtenus sur le plan
- Écran de fin : badge collector, goodies, photo souvenir

#### 4.1.6 Fin de visite
- Récapitulatif de la visite
- Prise de photo souvenir avec le robot (envoi par mail)
- Mail de satisfaction avec invitation à laisser un avis

### 4.2 Back-office admin (fortement recommandé)

#### 4.2.1 Authentification
- Login admin (email + mot de passe via Supabase Auth)
- Protection des routes admin (auth guard dans `+layout.ts`)

#### 4.2.2 Gestion des modules
- CRUD complet : créer, lire, modifier, supprimer un module
- Champs : numéro, nom, cartel/description, média (audio ou vidéo), images
- Upload de fichiers médias vers Supabase Storage

#### 4.2.3 Placement sur le plan (drag & drop)
- Affichage du plan de l'espace en mode édition
- Drag & drop des modules sur le plan (lib `svelte-dnd-action`)
- Sauvegarde des positions (x, y) en base de données
- Prévisualisation du rendu visiteur

#### 4.2.4 Gestion des questions
- CRUD des questions liées à chaque module
- Attribution par tranche d'âge
- Prévisualisation du quiz

### 4.3 Mini-jeu (bonus)

- Jeu intégré à la PWA, accessible depuis le parcours ou en fin de visite
- Lié à l'univers Mirokaï / planète Nimira
- Objectifs : engagement, découverte des modules, gamification
- Exemples possibles : memory des robots, quiz chrono, chasse au trésor sur le plan

### 4.4 Fonctionnalités transverses

- **Mode offline / cache** : le service worker cache les assets, le plan, et les audioguides déjà chargés pour fonctionner même avec un réseau faible
- **Responsive** : optimisé tablette en priorité, compatible smartphone
- **Envoi de mail** : photo souvenir + satisfaction (via Supabase Edge Functions ou service externe)
- **Accessibilité** : contrastes suffisants, tailles de police adaptées aux enfants, navigation simple

---

## 5. Modèle de données (PostgreSQL / Supabase)

### 5.1 Table `modules`

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Identifiant unique |
| `number` | integer | Numéro d'ordre du module |
| `name` | text | Nom du module |
| `description` | text | Cartel / description |
| `media_type` | enum('audio', 'video') | Type de média |
| `media_url` | text | URL du fichier média (Supabase Storage) |
| `image_urls` | text[] | URLs des images associées |
| `position_x` | float | Position X sur le plan (%) |
| `position_y` | float | Position Y sur le plan (%) |
| `is_active` | boolean | Module actif ou masqué |
| `created_at` | timestamptz | Date de création |
| `updated_at` | timestamptz | Dernière modification |

### 5.2 Table `questions`

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Identifiant unique |
| `module_id` | uuid (FK → modules) | Module associé |
| `age_group` | enum('3-4', '5-7', '8-10', 'parents') | Tranche d'âge |
| `question_text` | text | Texte de la question |
| `answers` | jsonb | Réponses possibles `[{text, is_correct}]` |
| `order` | integer | Ordre d'affichage |

### 5.3 Table `visitor_sessions`

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Identifiant unique |
| `adults_count` | integer | Nombre d'adultes |
| `children` | jsonb | `[{name?, age, age_group}]` |
| `started_at` | timestamptz | Début de la visite |
| `completed_at` | timestamptz | Fin de la visite (nullable) |
| `modules_completed` | uuid[] | IDs des modules terminés |
| `quiz_results` | jsonb | `[{module_id, question_id, answer, correct}]` |
| `photo_url` | text | URL photo souvenir (nullable) |
| `email` | text | Email pour envoi photo/satisfaction (nullable) |

---

## 6. Conventions de développement

### 6.1 Conventions SvelteKit

- **Routing file-based** : chaque route = un dossier dans `src/routes/` avec `+page.svelte`
- **Layouts** : `+layout.svelte` pour le contenu partagé (header, sidebar admin, barre progression)
- **Data loading** : `+page.ts` pour le chargement de données côté client, `+page.server.ts` pour le serveur uniquement
- **Composants partagés** dans `$lib/components/`, organisés par domaine
- **Stores** dans `$lib/stores/` pour l'état global (session visiteur, modules)
- **Services** dans `$lib/services/` pour les appels Supabase

### 6.2 Conventions de nommage

- Fichiers composants : **PascalCase** (`ModuleEditor.svelte`)
- Fichiers utilitaires/services : **kebab-case** ou **camelCase** (`age-groups.ts`, `supabase.ts`)
- Variables/fonctions : **camelCase** (`getModuleById`, `visitorSession`)
- Types : **PascalCase** (`Module`, `Question`, `VisitorSession`)
- Routes : **kebab-case** dans l'URL (`/admin/modules/new`)

### 6.3 Conventions Svelte 5

- Utiliser les **runes** Svelte 5 : `$state`, `$derived`, `$effect` (pas les anciens `$:` et `let` réactifs)
- Pas de `onMount` sauf si nécessaire → préférer `$effect`
- Props avec `$props()` au lieu de `export let`

### 6.4 Styling

- **Tailwind CSS** pour tout le styling
- Couleurs définies dans `tailwind.config.js` selon la charte Enchanted Tools
- Pas de CSS global sauf pour les imports Tailwind et les polices
- Classes utilitaires directement dans les composants Svelte

### 6.5 TypeScript

- Typage strict activé
- Tous les types métier dans `$lib/types/`
- Pas de `any` sauf cas exceptionnel documenté
- Utiliser les types générés par Supabase quand possible

---

## 7. PWA — Configuration

### 7.1 Manifest (`static/manifest.json`)

```json
{
  "name": "Mirokaï Experience",
  "short_name": "Mirokaï",
  "description": "Parcours de visite interactif — Enchanted Tools",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0F0E17",
  "theme_color": "#6C63FF",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 7.2 Service Worker

Utiliser `@vite-pwa/sveltekit` pour la génération automatique, ou le service worker natif SvelteKit dans `src/service-worker.ts`.

Stratégie de cache :
- **Cache-first** pour les assets statiques (images du plan, icônes, polices)
- **Network-first** pour les données API (modules, questions)
- **Stale-while-revalidate** pour les médias audioguides déjà consultés

### 7.3 Mode offline

- Le plan et les modules déjà visités restent accessibles offline
- Les médias (vidéos/audios) sont mis en cache après premier chargement
- Un indicateur visuel prévient si le réseau est indisponible

---

## 8. Contraintes du robot Mirokaï

À garder en tête pour l'intégration robot ↔ PWA :

- Le robot ne reconnaît pas les individus et ne retient pas les conversations longues
- Les prompts doivent rester **courts** (pas de contexte trop long)
- Il faut parler **fort et proche** du robot
- Autonomie d'environ **1 heure** (doit rester branché pour usage prolongé)
- Le robot est positionné **au centre du parcours** → les visiteurs viennent à lui après chaque module
- L'interaction robot se fait **vocalement**, la validation quiz se fait **sur la tablette/téléphone**

---

## 9. Commandes de développement

```bash
# Installation
npm install

# Développement (hot reload)
npm run dev

# Build production
npm run build

# Preview du build
npm run preview

# Linting
npm run lint

# Type checking
npm run check
```

---

## 10. Variables d'environnement

```env
# Supabase
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Optionnel — Service d'envoi de mail
VITE_MAIL_SERVICE_URL=https://...
```

> **Important** : les variables préfixées `VITE_` sont exposées côté client.
> Ne jamais mettre la `SUPABASE_SERVICE_ROLE_KEY` dans une variable `VITE_`.
> Utiliser les variables non préfixées uniquement dans `+page.server.ts` ou `$lib/server/`.

---

## 11. Ressources et liens utiles

- [Documentation SvelteKit](https://svelte.dev/docs/kit)
- [Documentation Svelte 5 (runes)](https://svelte.dev/docs/svelte)
- [Documentation Supabase](https://supabase.com/docs)
- [@vite-pwa/sveltekit](https://vite-pwa-org.netlify.app/frameworks/sveltekit)
- [svelte-dnd-action (drag & drop)](https://github.com/isaacHagworthy/svelte-dnd-action)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Charte graphique Enchanted Tools](Branding_Book.pdf)
- [JS Framework Benchmark](https://krausest.github.io/js-framework-benchmark/2026/chrome145.html)