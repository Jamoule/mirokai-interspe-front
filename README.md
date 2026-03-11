# Mirokaï Front

Interface visiteur et panneau d'administration du parcours audioguide Mirokaï.
SvelteKit · Tailwind CSS v4 · TypeScript

---

## Lancer le projet

```sh
pnpm install
pnpm dev       # développement
pnpm build     # production
pnpm preview   # aperçu du build
```

Le backend doit tourner sur `http://localhost:5000`.

---

## Accès visiteur — Mode Smartphone

> Les visiteurs utilisent leur propre téléphone.

| Route | Description |
|---|---|
| `/` | Accueil : plan interactif du musée avec les dots de modules |
| `/module/[qr_code]` | Page module : audio → quiz → écran de fin |

**Flux :**
1. Premier accès → sélection du groupe d'âge (stocké en `localStorage`)
2. Accueil `/` : plan du musée avec un dot par module (bleu = non fait, vert = terminé)
3. Clic sur un dot ou scan d'un QR code → `/module/[qr_code]`
4. Audio joue automatiquement → quiz (si activé) → écran "Module terminé !"
5. Bouton "Retour au plan" → retour à `/`, le dot passe au vert
6. Bouton "Plan" (en haut à droite) → PlanModal avec navigation entre modules

**Persistance (localStorage) :**
- `mirokai_age_group` — groupe d'âge sélectionné (`5-7`, `11-13`, `14+`)
- `mirokai_completed` — tableau des IDs de modules terminés

---

## Accès visiteur — Mode Kiosque

> Tablette fixe installée à chaque stand du musée.

| Route | Description |
|---|---|
| `/kiosk/[qr_code]` | Page kiosque complète, état machine, auto-reset |

**Flux (état machine) :**
```
'age' → sélection âge → 'audio' → fin audio → 'quiz' (si activé) → 'complete' → 5s → 'age'
```

1. Overlay de sélection d'âge (s'affiche à chaque nouveau visiteur)
2. Audio joue automatiquement
3. Quiz si le module en a un
4. Écran "Merci !" avec compte à rebours 5 secondes
5. Reset automatique → retour à la sélection d'âge pour le visiteur suivant

**Particularités kiosque :**
- Aucun suivi de progression (pas de localStorage)
- Aucun lien externe
- Aucun bouton "Plan"
- L'âge est effacé à chaque reset

---

## Panneau d'administration

> Accès protégé par token JWT.

| Route | Description |
|---|---|
| `/admin/login` | Connexion administrateur |
| `/admin` | Tableau de bord |
| `/admin/modules` | Gestion des modules (création, édition, activation) |
| `/admin/modules/[id]` | Détail d'un module : médias, questions, QR code |
| `/admin/admins` | Gestion des comptes administrateurs |
| `/admin/settings` | Paramètres du parcours (image du plan, messages, etc.) |

---

## Structure des routes

```
src/routes/
├── +page.ts / +page.svelte          ← accueil smartphone (plan interactif)
├── module/[qr_code]/                ← module smartphone
│   ├── +page.ts
│   └── +page.svelte
├── kiosk/[qr_code]/                 ← mode kiosque (tablette fixe)
│   ├── +page.ts
│   └── +page.svelte
└── admin/                           ← panneau admin (authentifié)
    ├── login/
    ├── modules/
    ├── modules/[id]/
    ├── admins/
    └── settings/
```

## Composants partagés

```
src/lib/components/
├── AgeSelectionOverlay.svelte   ← sélection du groupe d'âge (z-40)
├── AudioPlayer.svelte           ← lecteur audio avec autoplay (z-25)
├── Character.svelte             ← mascotte (z-20)
├── ModuleBackground.svelte      ← fond avec image du module (z-10)
├── PlanBubble.svelte            ← bouton "Plan" fixe (z-30, smartphone uniquement)
├── PlanModal.svelte             ← plan interactif avec dots (z-50, smartphone uniquement)
└── QuizOverlay.svelte           ← quiz (z-50, partagé kiosque + smartphone)
```
