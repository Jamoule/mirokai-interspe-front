# Mirokaï Front

Interface visiteur et back-office d'administration pour la **Mirokaï Experience** — parcours de visite immersif chez [Enchanted Tools](https://www.enchanted.tools/) (Paris 11e).

Les visiteurs scannent des QR codes sur chaque module d'exposition, écoutent un audioguide adapté à leur tranche d'âge, répondent à un quiz et obtiennent un mot secret à donner au robot Mirokaï pour recevoir un tampon sur leur carnet physique.  
Public cible : familles avec enfants de 3 à 10 ans. Supports : smartphones des parents + tablettes musée (mode kiosque).

---

## Stack

| | |
|---|---|
| Framework | **SvelteKit** (Svelte 5, runes) · Vite |
| Styles | **Tailwind CSS v4** — config via `@theme` dans `layout.css`, pas de `tailwind.config` |
| UI admin | bits-ui, svelte-sonner, @neodrag/svelte |
| Icônes | Lucide Svelte |
| Déploiement | Vercel (`@sveltejs/adapter-vercel`) |
| Package manager | pnpm |

---

## Démarrage rapide

```bash
pnpm install
cp .env.example .env        # configurer VITE_API_URL
pnpm dev
```

| Commande | |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production |
| `pnpm preview` | Prévisualiser le build |
| `pnpm check` | Vérification TypeScript + Svelte |
| `pnpm lint` | Prettier + ESLint |
| `pnpm format` | Formatage Prettier |

### Variable d'environnement

| Variable | Description | Défaut |
|---|---|---|
| `VITE_API_URL` | URL du backend API (sans trailing slash) | `http://localhost:5000` |

---

## Architecture

```
src/
├── routes/
│   ├── +layout.svelte              # Layout racine (CSS, favicon)
│   ├── layout.css                   # @theme, @font-face
│   ├── +page.svelte                 # Accueil visiteur (email → âge → intro → hub)
│   ├── +page.ts                     # ssr = false
│   │
│   ├── module/[qr_code]/            # Page module visiteur
│   │   ├── +page.svelte             #   audio → quiz → écran de fin
│   │   └── +page.ts
│   │
│   ├── kiosk/[qr_code]/             # Mode kiosque (tablette musée)
│   │   ├── +page.svelte             #   boucle âge → audio → quiz → reset auto
│   │   └── +page.ts
│   │
│   └── admin/                       # Back-office (JWT)
│       ├── +layout.svelte           #   sidebar, auth guard, Toaster
│       ├── +layout.ts               #   ssr = false
│       ├── +page.svelte             #   dashboard
│       ├── login/                   #   connexion
│       ├── modules/ · [id]/         #   CRUD modules
│       ├── plan/                    #   positionnement modules sur le plan
│       ├── settings/                #   paramètres du parcours
│       └── admins/                  #   gestion des comptes admin
│
└── lib/
    ├── visitor-api.ts               # Client API visiteur (publique)
    ├── api.ts                       # Client API admin (JWT Bearer)
    ├── visitor.svelte.ts            # Store visiteur (runes, localStorage)
    ├── auth.svelte.ts               # Store auth admin (JWT)
    ├── utils.ts
    └── components/
        ├── EmailCaptureOverlay.svelte
        ├── AgeSelectionOverlay.svelte
        ├── AudioPlayer.svelte
        ├── Character.svelte
        ├── ModuleBackground.svelte
        ├── PlanBubble.svelte
        ├── PlanModal.svelte
        └── QuizOverlay.svelte
```

> SSR désactivé sur toutes les routes (`export const ssr = false`).

---

## Expérience visiteur

L'expérience se déroule en **5 vues séquentielles** au premier lancement, puis le Hub devient le point d'ancrage.

### 1. Capture email (`/`)

Plein écran. Champ email + bouton "Lancer l'aventure". L'email sert à recevoir la photo souvenir en fin de visite. Étape skippable.

> `EmailCaptureOverlay.svelte`

### 2. Sélection de l'âge

4 options : 3–4 ans, 5–7 ans, 8–10 ans, Autre. Conditionne le contenu audio et les questions du quiz.

> `AgeSelectionOverlay.svelte`

### 3. Prologue (`/`)

Le personnage Miroki se présente. S'affiche une seule fois (persisté `localStorage`).

### 4. Hub (`/`)

Vue centrale. Le visiteur y revient entre chaque module. Bouton carte → Plan (vue 5b).

### 5a. Module (`/module/[qr_code]`)

Lancé par scan QR ou depuis le plan. 3 phases internes :

| Phase | Description |
|---|---|
| `audio` | Lecteur audio + personnage animé + fond du module |
| `quiz` | Quiz adapté par âge → mot secret si bonne réponse |
| `complete` | Félicitations, boutons "Retour au plan" / "Rejouer" |

### 5b. Plan du parcours (modal)

Marqueurs positionnés sur l'image du plan. Jaune = non fait, vert = complété. Clic → navigation vers le module.

> `PlanModal.svelte`

### Flux résumé

```
Arrivée → Email → Âge → Prologue → Hub ◄──────────┐
                                    │               │
                                    ├─► Plan        │
                                    │    │          │
                                    └─► Module ─────┘
                                     audio → quiz → complete
```

---

## Mode Kiosque (`/kiosk/[qr_code]`)

Variante pour les **tablettes fixes** du musée (une par module).

```
âge → audio → quiz → complete (5s) → reset → âge …
```

- Reset automatique après 5 secondes — l'âge est redemandé à chaque visiteur
- Pas de navigation, pas de plan, pas de progression persistée

---

## Panneau admin (`/admin`)

Protégé par JWT. Le store `auth` gère l'authentification et le guard.

| Route | Description |
|---|---|
| `/admin/login` | Connexion |
| `/admin` | Dashboard |
| `/admin/modules` | Liste des modules (création, activation, suppression) |
| `/admin/modules/[id]` | Édition module : médias, transcript, questions, QR code |
| `/admin/plan` | Positionnement drag & drop des modules sur le plan |
| `/admin/settings` | Paramètres du parcours (image plan, messages, avatar) |
| `/admin/admins` | Gestion des comptes admin |

---

## Stores

### `visitor` — `src/lib/visitor.svelte.ts`

Singleton Svelte 5 runes. Persisté en `localStorage`. Appeler `visitor.init()` dans `onMount`.

```ts
// Email
visitor.email              // string | null
visitor.hasEmail           // boolean
visitor.setEmail(value)
visitor.skipEmail()

// Âge
visitor.ageGroup           // '3-4' | '5-7' | '8-10' | '11-13' | '14+' | null
visitor.hasAge             // boolean
visitor.setAge(group)
visitor.clearAge()         // utilisé par le kiosque au reset

// Progression
visitor.introDone          // boolean
visitor.markIntroDone()
visitor.completedModules   // string[]
visitor.hasCompleted(id)   // boolean
visitor.markComplete(id)
visitor.clearProgress()
```

| Clé localStorage | Contenu |
|---|---|
| `mirokai_email` | Email visiteur |
| `mirokai_age_group` | Tranche d'âge |
| `mirokai_intro_done` | Prologue vu |
| `mirokai_completed` | IDs modules terminés (JSON) |

### `auth` — `src/lib/auth.svelte.ts`

Singleton Svelte 5 runes. JWT stocké dans `localStorage` (`mirokai_token`).

```ts
auth.init()
auth.login(email, password)
auth.logout()
auth.isAuthenticated       // boolean
auth.admin                 // { id, email, name } | null
auth.token                 // string | null
```

---

## Clients API

### Visiteur — `src/lib/visitor-api.ts`

Routes publiques, sans authentification.

```ts
visitorApi.getModules()
visitorApi.getModuleByQr(qr_code)
visitorApi.getQuestions(module_id, age_group)
visitorApi.getSettings()
visitorApi.validateAnswer(question_id, answer_id)

resolveMediaUrl(url)       // préfixe BACKEND_ORIGIN si URL relative
AVATAR_VIDEO_URL           // URL de la vidéo avatar
```

### Admin — `src/lib/api.ts`

Routes protégées, JWT Bearer.

| Domaine | Méthodes |
|---|---|
| Auth | `login`, `me`, `logout` |
| Modules | `getModules`, `getModule`, `createModule`, `updateModule`, `toggleModule`, `deleteModule`, `updatePositions` |
| Questions | `getQuestionsAll`, `createQuestion`, `updateQuestion`, `deleteQuestion` |
| Admins | `getAdmins`, `createAdmin`, `updateAdmin`, `deleteAdmin` |
| Settings | `getSettings`, `updateSettings` |
| Upload | `upload`, `deleteUpload` |

---

## Composants visiteur

| Composant | Rôle | z-index |
|---|---|---|
| `ModuleBackground` | Image de fond du module + overlay, fade transition | 10 |
| `Character` | Avatar vidéo Mirokaï, animé pendant la lecture audio | 20 |
| `AudioPlayer` | Bouton play/pause, autoplay, segments transcript | 25 |
| `PlanBubble` | Bouton carte fixe top-right (smartphone uniquement) | 30 |
| `AgeSelectionOverlay` | Sélection tranche d'âge | 40 |
| `EmailCaptureOverlay` | Capture email premier lancement | 50 |
| `QuizOverlay` | Quiz par âge, validation, affichage mot secret | 50 |
| `PlanModal` | Plan du parcours, marqueurs, navigation modules | 50 |

---

## Types principaux

```ts
type AgeGroup = '3-4' | '5-7' | '8-10' | '11-13' | '14+';

type Module = {
  id: string;
  number: number;
  name: string;
  description: string;
  media_type: 'image' | 'video' | 'audio' | 'none';
  media_url: string | null;
  image_urls: string[];
  qr_code: string;
  position_x: number;           // 0.0–1.0
  position_y: number;
  has_quiz: boolean;
  is_active: boolean;
  suggested_order: number;
  transcript_segments?: TranscriptSegment[];
};

type Question = {
  id: string;
  module_id: string;
  age_group: string;
  question_text: string;
  display_order: number;
  answers: Answer[];
};

type Answer = {
  id: string;
  answer_text: string;
  is_correct: number;            // 0 | 1
  display_order: number;
};
```

---

## Design system

### Couleurs (`@theme` dans `layout.css`)

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#1d3aa2` | Bleu profond, fonds |
| `--color-secondary` | `#1a1337` | Violet foncé |
| `--color-purple` | `#601f48` | Accents |
| `--color-accent` | `#3995ff` | Bleu clair, interactions |
| `--color-cta` | `#ffbd14` | Jaune-orange, boutons d'action |
| `--color-surface` | `#0f0b24` | Fond body |
| `--color-surface-2` | `#1a1540` | Surface secondaire |
| `--color-surface-3` | `#221c4a` | Surface tertiaire |

### Typographie

| Classe Tailwind | Police | Usage |
|---|---|---|
| `font-title` | AcuminVariableConcept | Titres courts |
| `font-body` | ESPeak | Corps de texte |

Les fichiers de police vont dans `static/fonts/` (non versionné).

### Conventions

- Toujours `h-dvh` (jamais `h-screen`) pour les layouts plein écran mobile
- Dégradés bleu/violet pour les fonds visiteur
- `bits-ui` et `svelte-sonner` réservés aux pages admin — ne pas importer côté visiteur
- `audio.play()` retourne une Promise → toujours `.catch()` pour le fallback lecture manuelle
- Les positions X/Y du plan sont des flottants 0.0–1.0 relatifs à l'image

---

## Déploiement

Configuré pour **Vercel** (`@sveltejs/adapter-vercel`).

```bash
pnpm build
vercel --prod
```

Configurer `VITE_API_URL` dans les variables d'environnement Vercel.

---

## Licence

Projet privé — Enchanted Tools. Tous droits réservés.
