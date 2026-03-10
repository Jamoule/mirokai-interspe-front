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
- Permettre à l'équipe Enchanted Tools de configurer et faire évoluer le parcours via un back-office admin

### 1.4 Big Idea

**"Découvrez la robotique comme une aventure"**
Trois piliers : **Curiosité**, **Aventure**, **Accessibilité**.

### 1.5 Durée de visite

Environ **30 à 45 minutes**.

### 1.6 Support

- **Tablettes** mises à disposition par le musée (support principal)
- **Smartphones** des parents (alternative)

---

## 2. Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| **Front-end** | SvelteKit (Svelte 5) + Vite | PWA visiteur + back-office admin |
| **Styling** | Tailwind CSS | Styling utilitaire |
| **Back-end** | NestJS | API REST |
| **Base de données** | SQLite | Stockage des données (modules, questions, réponses, config) |
| **Stockage médias** | S3 | Audioguides, vidéos, images |
| **Architecture** | Client-serveur découplée (headless) | Front et back déployés indépendamment |

### Pourquoi SvelteKit ?

- Bundle compilé ultra-léger (pas de runtime embarqué) → pertinent pour une PWA sur tablette
- Réactivité native sans boilerplate
- Routing file-based intégré
- Support PWA natif (service worker détecté automatiquement)
- Syntaxe proche du HTML/JS/CSS standard → code lisible et maintenable
- Enchanted Tools utilise déjà NuxtJS, mais NuxtJS est un meta-framework SSR/SSG non pertinent pour une app fermée sans enjeu SEO

### Pourquoi SQLite ?

- Schéma simple (4 tables), pas besoin d'un SGBD lourd
- Zéro infrastructure à gérer (fichier embarqué)
- Les médias sont externalisés sur S3, la base ne stocke que des URLs et du texte
- Suffisant pour le volume de données (quelques dizaines de modules et questions)

### Pourquoi NestJS ?

- Framework structuré (modules, controllers, services, injection de dépendances)
- Facile à documenter et reprenable par un tiers
- Contrôle total sur l'API sans dépendance à un BaaS

---

## 3. Parcours visiteur — Comment ça marche

```
Scan QR code ou sélection sur tablette
        │
        ▼
  Demande de la tranche d'âge
        │
        ▼
  Ouverture du module (vidéo / audioguide)
        │
        ▼
  Quiz adapté à la tranche d'âge
        │
        ▼
  Bonne réponse → Mot secret affiché
        │
        ▼
  Le visiteur donne le mot secret au robot
        │
        ▼
  Le robot valide → Tampon sur le carnet physique
        │
        ▼
  Module suivant (libre ou ordre conseillé)
        │
        ▼
  Fin de visite → Badge collector, goodies, photo souvenir
```

**La progression est physique** : c'est le carnet à tampons qui fait foi, pas un suivi en base de données. La PWA ne stocke pas de sessions visiteurs. La tranche d'âge est gardée en mémoire locale (store Svelte) le temps de la visite.

---

## 4. Spécifications fonctionnelles

### 4.1 Fonctionnalités visiteur

**Accès et navigation :**
- Scanner le QR code d'un module → ouvre automatiquement le module dans la WebApp
- Accéder au plan du parcours avec les modules positionnés
- Accéder à un menu de navigation
- Sélectionner un autre module depuis le menu ou le plan
- Visualiser les différents modules disponibles
- Suivre l'ordre conseillé ou explorer librement

**Contenu des modules :**
- Ouvrir le contenu d'un module
- Lancer un audioguide
- Lancer une vidéo explicative
- Afficher des contenus visuels et textuels

**Quiz :**
- Répondre à un quiz sur certains modules
- Questions adaptées par tranche d'âge : 3–4 ans, 5–7 ans, 8–10 ans, parents
- Valider une réponse
- Obtenir un mot secret après une bonne réponse
- Donner le mot secret au robot (interaction vocale physique)

**Fin de visite :**
- Saisir un email pour recevoir la photo souvenir
- Recevoir un email de satisfaction / demande d'avis

### 4.2 Fonctionnalités robot

- Recevoir le mot secret communiqué par le visiteur (interaction vocale)
- Vérifier la validation de l'étape
- Confirmer la réussite
- Déclencher le mécanisme physique de tampon
- Tamponner la carte / le carnet

### 4.3 Fonctionnalités administration (back-office)

**Gestion des modules :**
- Créer, modifier, supprimer un module
- Définir le numéro d'un module
- Activer ou désactiver un module
- Définir si un module contient un quiz
- Ajouter un audioguide à un module
- Ajouter une vidéo à un module
- Ajouter un texte / descriptif
- Ajouter un visuel
- Associer un QR code à un module

**Gestion du plan :**
- Gérer le plan du parcours
- Positionner les modules sur le plan (drag & drop)

**Gestion des quiz :**
- Créer des questions
- Gérer les questions par tranche d'âge
- Définir les réponses possibles
- Définir la bonne réponse
- Associer un mot secret à une question

**Configuration :**
- Gérer les emails de fin d'expérience
- Gérer les paramètres du parcours

### 4.4 Fonctionnalités liées à l'expérience terrain

- Remettre un carnet / une carte à tamponner (physique)
- Permettre la validation physique des étapes par le robot
- Distribuer un badge collector en fin de parcours
- Distribuer des goodies
- Proposer une photo souvenir avec le robot

### 4.5 Mini-jeu (bonus)

- Jeu intégré à la PWA, accessible depuis le parcours ou en fin de visite
- Lié à l'univers Mirokaï / planète Nimira
- Objectifs : engagement visiteurs, découverte des modules, gamification

---

## 5. Modèle de données

4 tables uniquement — pas de sessions visiteurs, la progression est physique (tampons).

### `modules`
Numéro, nom, description, type de média (audio/vidéo/none), URL média (S3), URLs images (S3), identifiant QR code, position X/Y sur le plan, a un quiz ou non, actif ou masqué, ordre conseillé.

### `questions`
Liée à un module. Tranche d'âge (3-4, 5-7, 8-10, parents), texte de la question, mot secret (révélé après bonne réponse), ordre d'affichage.

### `answers`
Liée à une question. Texte de la réponse, est-ce la bonne réponse, ordre d'affichage.

### `parcours_settings`
Configuration globale : nom du parcours, image du plan, message d'accueil, message de fin, template email satisfaction, durée estimée, actif ou non.

---

## 6. Contraintes du robot Mirokaï

À garder en tête pour l'intégration robot ↔ PWA :

- Le robot **ne reconnaît pas les individus** et ne retient pas les conversations longues
- Les prompts doivent rester **courts**
- Il faut parler **fort et proche** du robot
- Autonomie d'environ **1 heure** (doit rester branché pour usage prolongé)
- Le robot est positionné **au centre du parcours** → les visiteurs viennent à lui après chaque module
- L'interaction robot se fait **vocalement**, la validation quiz se fait **sur la tablette/téléphone**
- Le robot ne peut pas attraper tous les objets, uniquement les poignées conçues par les enchanteurs
- Il ne navigue pas seul, il est contrôlé à distance
- Il roule sur surfaces lisses uniquement, pas d'escaliers

---

## 7. PWA — Comportement attendu

- **Installable** sur tablette et smartphone (manifest + service worker)
- **Cache offline** : le plan et les contenus déjà consultés restent accessibles même sans réseau
- **Responsive** : optimisé tablette en priorité, compatible smartphone
- **Scan QR code** : ouverture directe du module correspondant via l'URL encodée dans le QR
- **Pas de login visiteur** : l'app est ouverte, seule la tranche d'âge est demandée
- **Login admin** : accès protégé au back-office

---

## 8. Variables d'environnement front

```env
VITE_API_URL=http://localhost:3000
VITE_S3_BASE_URL=https://bucket.s3.region.amazonaws.com
```

---

## 9. Ressources

- [Documentation SvelteKit](https://svelte.dev/docs/kit)
- [Documentation Svelte 5 (runes)](https://svelte.dev/docs/svelte)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [@vite-pwa/sveltekit](https://vite-pwa-org.netlify.app/frameworks/sveltekit)
- [JS Framework Benchmark](https://krausest.github.io/js-framework-benchmark/2026/chrome145.html)
- [Charte graphique Enchanted Tools](Branding_Book.pdf)