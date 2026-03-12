# CLAUDE.md — Mirokaï Front

## Projet

PWA SvelteKit pour la **Mirokaï Experience** — parcours de visite immersif chez Enchanted Tools (18 rue de la Fontaine au Roi, Paris 11e). Public cible : familles avec enfants de 3 à 10 ans. Support principal : tablettes musée + smartphones parents.

**Concept** : les visiteurs scannent des QR codes sur chaque module, écoutent un audioguide adapté à leur âge, répondent à un quiz et obtiennent un mot secret à donner au robot Mirokaï pour recevoir un tampon sur leur carnet physique.

## Stack

- **SvelteKit** (Svelte 5, runes) + Vite
- **Tailwind CSS v4** — pas de `tailwind.config.js`, tout dans `layout.css` via `@theme`
- **pnpm** — utiliser `pnpm dev` / `pnpm build`
- **API** : NestJS REST sur `http://localhost:5000/api`
- lucide-svelte, bits-ui, svelte-sonner, @neodrag/svelte (admin seulement)

## Architecture des routes

```
src/routes/
├── +page.svelte          # Page d'accueil visiteur (prologue + plan)
├── +page.ts              # export const ssr = false
├── module/[qr_code]/     # Page module visiteur (audio → quiz → complet)
│   ├── +page.svelte
│   └── +page.ts          # export const ssr = false
├── kiosk/[qr_code]/      # Variante kiosk (tablette musée)
└── admin/                # Back-office protégé (JWT)
    ├── +layout.svelte
    ├── +layout.ts
    ├── login/
    ├── modules/
    │   └── [id]/
    ├── plan/
    ├── settings/
    └── admins/
```

**Règle critique** : toutes les routes visiteur ont `export const ssr = false`.

## Composants (`src/lib/components/`)

| Composant | Rôle | z-index |
|---|---|---|
| `Character.svelte` | Avatar vidéo Mirokaï (video loop), animé quand audio joue | z-20 |
| `ModuleBackground.svelte` | Fond image + overlay `#0F0B24/45`, fade transition | z-10 |
| `AudioPlayer.svelte` | Bouton play/pause `#FFBD14`, autoplay, segments transcript | z-25 |
| `PlanBubble.svelte` | Bouton fixe top-right, ouvre PlanModal | z-30 |
| `AgeSelectionOverlay.svelte` | Sélection tranche d'âge au 1er lancement | z-40 |
| `EmailCaptureOverlay.svelte` | Capture email visiteur, première vue affichée | z-50 |
| `QuizOverlay.svelte` | Quiz adapté par âge, valide réponse, affiche mot secret | z-50 |
| `PlanModal.svelte` | Plan du parcours avec modules positionnés, drag admin | z-50 |

## Stores

### `visitor` (`src/lib/visitor.svelte.ts`)
Singleton runes (pas de classe). Persisté en `localStorage`.

```ts
visitor.init()              // à appeler dans onMount
visitor.hasEmail            // boolean
visitor.email               // string | null
visitor.setEmail(value)     // persiste en localStorage
visitor.skipEmail()         // marque comme passé
visitor.hasAge              // boolean
visitor.ageGroup            // AgeGroup | null
visitor.setAge(group)       // persiste en localStorage
visitor.introDone           // boolean
visitor.markIntroDone()     // persiste en localStorage
visitor.completedModules    // string[] (IDs)
visitor.markComplete(id)    // persiste en localStorage
visitor.clearProgress()
```

- `AgeGroup = '3-4' | '5-7' | '8-10' | '11-13' | '14+'`
- localStorage keys : `mirokai_email`, `mirokai_age_group`, `mirokai_intro_done`, `mirokai_completed`

### `auth` (`src/lib/auth.svelte.ts`)
Singleton runes pour l'admin. JWT Bearer token.

## APIs

### `src/lib/visitor-api.ts` (public, sans auth)

```ts
visitorApi.getModules()                        // GET /modules
visitorApi.getModuleByQr(qr_code)             // GET /modules/qr/:qr_code
visitorApi.getQuestions(id, age_group)        // GET /modules/:id/questions?age_group=
visitorApi.getSettings()                      // GET /settings
visitorApi.validateAnswer(question_id, answer_id) // POST /quiz/validate

resolveMediaUrl(url)   // préfixe BACKEND_ORIGIN si URL relative
BACKEND_ORIGIN         // 'http://localhost:5000'
AVATAR_VIDEO_URL       // URL de la vidéo avatar
```

### `src/lib/api.ts` (admin, Bearer token)
CRUD complet modules, questions, admins, settings, upload.

## API Backend — Points clés

Base : `http://localhost:5000/api`

| Route | Auth | Rôle |
|---|---|---|
| `GET /modules` | public | Modules actifs |
| `GET /modules/qr/:qr_code` | public | Module par QR |
| `GET /modules/:id/questions?age_group=` | public | Questions (sans `secret_word`) |
| `POST /quiz/validate` | public | Valide réponse → retourne `secret_word` si correct |
| `GET /settings` | public | Config parcours |
| `POST /upload?folder=` | admin | Upload fichier (max 100MB) |
| `PATCH /modules/:id/position` | admin | Position X/Y sur plan (0.0–1.0) |

`age_group` acceptés : `5-7`, `8-10`, `11-13`, `14+`

Toutes les erreurs : `{ "error": "Message" }`

## Design system

### Couleurs (`@theme` dans `layout.css`)

```
--color-primary:   #1d3aa2   (bleu profond, fonds)
--color-secondary: #1a1337   (violet foncé)
--color-purple:    #601f48
--color-accent:    #3995ff   (bleu clair, détails)
--color-cta:       #ffbd14   (jaune-orange, boutons d'action)
--color-surface:   #0f0b24   (fond body)
--color-surface-2: #1a1540
--color-surface-3: #221c4a
```

### Typographie

- `--font-title` : `AcuminVariableConcept` (titres courts)
- `--font-body` : `ESPeak` (corps de texte, sous-titres)
- Classes Tailwind : `font-title`, `font-body`

### Règles CSS

- **Toujours `h-dvh`** (jamais `h-screen`) pour mobile
- Dégradés bleu/violet pour les fonds
- Icônes style filaire (pack Anron)

## Variables d'environnement

```env
VITE_API_URL=http://localhost:5000
VITE_S3_BASE_URL=https://bucket.s3.region.amazonaws.com
```

(Actuellement les URLs sont hardcodées dans `visitor-api.ts` — à migrer vers env)

## Vues de l'expérience visiteur

L'expérience se déroule en **5 vues séquentielles** au premier lancement, puis la vue Hub est le point d'ancrage central.

---

### Vue 1 — Capture email (`/`) · **Implémenté** (`EmailCaptureOverlay.svelte`)

**Première chose vue par le visiteur.** Plein écran, fond dégradé bleu/violet.

- Logo Enchanted Tools + titre "BIENVENUE DANS L'AVENTURE MIROKAI"
- Champ email + bouton "Lancer l'aventure"
- Email envoyé à l'API pour recevoir la photo souvenir en fin de visite
- Stocké localement (`mirokai_email`) pour ne pas redemander à chaque page
- Lien "Passer cette étape" (email optionnel)
- Après validation → Vue 2 (Age)

> **Composant** : `src/lib/components/EmailCaptureOverlay.svelte`

---

### Vue 2 — Sélection de l'âge · **Implémenté** (`AgeSelectionOverlay.svelte`)

Plein écran, même fond dégradé bleu/violet que Vue 1. Logo Enchanted Tools en haut.

- Titre "POUR QUI COMMENCE L'AVENTURE ?" + sous-titre explicatif
- 4 options checkbox arrondies : 3–4 ans (`'3-4'`), 5–7 ans (`'5-7'`), 8–10 ans (`'8-10'`), Autre (`'14+'`)
- Bouton "Continuer" (désactivé tant qu'aucune option sélectionnée)
- Sélection persistée dans `localStorage` (`mirokai_age_group`)
- S'affiche uniquement si `!visitor.hasAge` (et après la capture email)
- Après sélection → Vue 3 (Introduction)

> **Composant** : `src/lib/components/AgeSelectionOverlay.svelte`

---

### Vue 3 — Introduction / Prologue · **Implémenté** (`/`, phase `'intro'`)

Le personnage Miroki se présente. S'affiche une seule fois (premier lancement), puis le Hub prend le relais.

- Fond : image atmosphérique plein écran (`/images/intro-background.jpg`) + gradient overlay
- Logo Enchanted Tools en haut (pas de header bar)
- Personnage Miroki centré, plus grand que le hub (`/images/miroki-character.png`, 467×228px)
- Bulle de dialogue sous le personnage avec le texte introductif
- Bouton "Continuer" pour passer au Hub
- Progression persistée dans `localStorage` (`mirokai_intro_done`)
- Fin de l'intro → marque `introDone`, transition vers Vue 4 (Hub)

> **État** : visuel en place. Audio + défilement texte synchronisé à câbler depuis `data.settings` ou un module "prologue" dédié. Quand l'audio sera branché, le bouton "Continuer" sera remplacé par la fin de l'audio.
> **Route** : `src/routes/+page.svelte` (phase `'intro'`)

---

### Vue 4 — Hub principal · **Partiellement implémenté** (`/`)

**Vue centrale de l'expérience.** Le visiteur revient ici entre chaque module.

- Même layout que l'intro (fond dégradé, personnage, bulle texte)
- Header avec nom du module actuel ou "Explore" + **bouton carte** (icône map → ouvre Vue 5b)
- Le personnage peut donner des indications contextuelles
- Bouton carte = accès à la Vue 5b (PlanModal) pour choisir le prochain module
- Modules complétés visibles sur le plan (badge ✓ vert)

> **État** : la page `/` joue ce rôle mais sans transition claire depuis le prologue.
> **Route** : `src/routes/+page.svelte`

---

### Vue 5a — Lecteur de module · **Implémenté** (`/module/[qr_code]`)

Lancé par scan QR ou sélection depuis le plan. Se déroule en 3 phases internes :

| Phase | Déclencheur | Description |
|---|---|---|
| `'audio'` | Arrivée sur la page | `AudioPlayer` + `Character` animé + fond `ModuleBackground` |
| `'quiz'` | Fin de l'audio (si `module.has_quiz`) | `QuizOverlay` — questions adaptées à l'âge, affiche le mot secret |
| `'complete'` | Fin du quiz (ou fin audio si pas de quiz) | Écran plein écran, bouton "Retour au plan" + "Rejouer" |

> **Route** : `src/routes/module/[qr_code]/+page.svelte`

---

### Vue 5b — Plan du parcours · **Implémenté** (`PlanModal`)

Modal plein écran `z-50`, accessible depuis le bouton carte du Hub et du lecteur de module.

- Image du plan (ratio 1000:700) chargée depuis `settings.plan_image_url`
- Marqueurs numérotés positionnés en `%` depuis `position_x / 1000` et `position_y / 700`
- Badge jaune `#FFBD14` = module non complété, badge vert `#22c55e` = complété (✓)
- Clic sur un marqueur → `goto('/module/' + qr_code)` + fermeture de la modal

> **Composant** : `src/lib/components/PlanModal.svelte`

---

### Vue kiosk · **Implémenté** (`/kiosk/[qr_code]`)

Variante pour les **tablettes fixes** du musée (une tablette par module). Différences vs vue module :

- Pas de navigation vers `/` — reset automatique après 5 secondes à la fin
- `visitor.clearAge()` au reset → l'age est redemandé à chaque visiteur
- Pas de `PlanBubble` / `PlanModal` (tablette fixée sur un module)
- Phases : `'age'` → `'audio'` → `'quiz'` → `'complete'` (avec countdown)

> **Route** : `src/routes/kiosk/[qr_code]/+page.svelte`

---

### Résumé du flux global

```
[Arrivée]
    │
    ▼
Vue 1 — Email (à créer)
    │ email saisi ou passé
    ▼
Vue 2 — Sélection âge (AgeSelectionOverlay)
    │ âge choisi
    ▼
Vue 3 — Prologue / Introduction (/)
    │ audio + texte défilant terminé
    ▼
Vue 4 — Hub (/) ◄──────────────────────────────┐
    │ bouton carte                              │
    ├──► Vue 5b — Plan (PlanModal)              │
    │         │ clic module                     │
    │         ▼                                 │
    └──► Vue 5a — Module (/module/[qr_code])   │
              │ phase audio → quiz → complete   │
              └─ "Retour au plan" ──────────────┘
```

## Modèle de données

```ts
type Module = {
  id: string
  number: number
  name: string
  description: string
  media_type: 'image' | 'video' | 'audio' | 'none'
  media_url: string | null
  image_urls: string[]          // déjà string[], pas besoin de re-parser
  qr_code: string
  position_x: number            // 0.0–1.0 relatif au plan
  position_y: number
  has_quiz: boolean
  is_active: boolean
  suggested_order: number
  transcript_segments?: TranscriptSegment[]
}

type Question = {
  id: string
  module_id: string
  age_group: string
  question_text: string
  display_order: number
  answers: Answer[]
  // secret_word absent côté visiteur (révélé par /quiz/validate)
}

type Answer = {
  id: string
  question_id: string
  answer_text: string
  is_correct: number  // 0 | 1
  display_order: number
}
```

## Pièges connus

- `audio.play()` retourne une Promise → toujours `.catch()` pour le fallback lecture manuelle
- `bits-ui` et `svelte-sonner` : **ne pas importer dans les pages visiteur** (admin seulement)
- Les positions X/Y sur le plan sont des flottants 0.0–1.0 (relatifs à l'image du plan)
- Le `secret_word` n'est jamais exposé par `GET /questions` — il faut passer par `POST /quiz/validate`
- La progression visiteur est **physique** (tampons carnet) — pas de suivi en base côté visiteur

## Commandes

```bash
pnpm dev      # serveur dev
pnpm build    # build production
pnpm preview  # prévisualiser le build
```
