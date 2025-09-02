# Technologies - The Beast Project

## Stack technique principal

### Frontend Framework
- **SvelteKit 2.16.0** : Framework full-stack avec SSR/SPA
- **Svelte 5.0.0** : Utilisation des nouvelles runes (`$state`, `$derived`, `$effect`)
- **TypeScript 5.0.0** : Typage statique pour JavaScript
- **Vite 6.2.6** : Build tool et dev server ultra-rapide

### Styling & UI
- **TailwindCSS 4.1.7** : Framework CSS utility-first
- **DaisyUI 5.0.37** : Composants UI pré-construits pour Tailwind
- **@tailwindcss/vite 4.1.7** : Plugin Vite pour TailwindCSS 4
- **bits-ui 2.9.1** : Composants UI headless pour Svelte
- **Lucide Svelte 0.511.0** : Icônes SVG optimisées
- **@lucide/svelte 0.482.0** : Package additionnel d'icônes

### Base de données & Backend
- **Supabase 2.49.8** : Backend-as-a-Service avec PostgreSQL
- **SvelteKit API routes** : Endpoints serveur intégrés
- **@supabase/supabase-js** : Client JavaScript pour Supabase

### Analytics & Monitoring
- **Plausible.io** : Web analytics respectueux de la vie privée
- **Custom API integration** : Connexion directe aux APIs Plausible

### Utilitaires & Libraries
- **dayjs 1.11.13** : Manipulation des dates (alternative à moment.js)
- **clsx 2.1.1** : Utilitaire pour combiner des classes CSS
- **tailwind-merge 3.3.0** : Fusion intelligente des classes Tailwind
- **tailwind-variants 1.0.0** : Variants conditionnelles pour composants

### Charts & Data Visualization
- **Chart.js 4.4.9** : Bibliothèque de graphiques
- **ApexCharts 4.7.0** : Graphiques interactifs avancés
- **layerchart 2.0.0-next.10** : Composants de graphiques pour Svelte

### Communication temps réel
- **socket.io-client 4.8.1** : WebSocket client pour temps réel
- **svelte-sonner 1.0.5** : Notifications toast pour Svelte

### Fonts
- **@fontsource-variable/inter 5.2.5** : Police Inter variable
- **@fontsource/saira-semi-condensed 5.2.5** : Police Saira Semi Condensed

## Configuration de développement

### Build & Development Tools
```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build", 
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
  }
}
```

### Code Quality & Formatting
- **Prettier 3.4.2** : Formatage automatique du code
- **prettier-plugin-svelte 3.3.3** : Support Svelte pour Prettier
- **svelte-check 4.0.0** : Validation TypeScript pour Svelte

### Testing
- **Vitest 3.0.0** : Framework de tests unitaires
- **@testing-library/svelte 5.2.4** : Utilitaires de test pour Svelte
- **@testing-library/jest-dom 6.6.3** : Matchers Jest pour DOM
- **jsdom 26.0.0** : Implémentation DOM pour Node.js

### Adapters & Deployment
- **@sveltejs/adapter-auto 6.0.0** : Adaptateur automatique pour SvelteKit
- **@sveltejs/kit 2.16.0** : Core SvelteKit
- **@sveltejs/vite-plugin-svelte 5.0.0** : Plugin Vite pour Svelte

## Patterns techniques utilisés

### Svelte 5 Runes Pattern
```typescript
// State management moderne
let accounts = $state<Account[]>([]);
let isLoading = $state(false);

// Derived state
let filteredAccounts = $derived(() => {
    return accounts.filter(account => account.status === 'active');
});

// Effects pour side effects  
$effect(() => {
    console.log('Accounts changed:', accounts.length);
});
```

### Store Pattern avec Classes
```typescript
class InstagramAccountsStore {
    accounts = $state<InstagramAccount[]>([]);
    isLoading = $state({ 
        fetch: false, 
        create: false, 
        update: false, 
        delete: false 
    });
    
    async fetchAccounts() { /* implémentation */ }
    async createAccount(data) { /* implémentation */ }
    async updateAccount(id, data) { /* implémentation */ }
    async deleteAccount(id) { /* implémentation */ }
}
```

### API Integration Pattern
```typescript
// Supabase client singleton
export const supabase = createClient(supabaseUrl, supabaseKey);

// Service layer avec error handling
private async executeOperation<T>(
    operation: () => Promise<T>,
    operationType: 'fetch' | 'create' | 'update' | 'delete'
): Promise<T | null> {
    this.isLoading[operationType] = true;
    try {
        return await operation();
    } catch (error) {
        this.errors[operationType] = error.message;
        return null;
    } finally {
        this.isLoading[operationType] = false;
    }
}
```

## Configuration environnement

### Variables d'environnement
```bash
VITE_SUPABASE_URL=https://ncdhbospnqaadrtmzvcs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Configuration Plausible
```typescript
export const PLAUSIBLE_CONFIG = {
    API_KEY: "LmE81N650YhlNrIAL8ge0Li20mVaoK1YhOvHZCRQkYkRfUc9WNM6X2KF7MgdcCCw",
    SITE_ID: "my-secret.net",
    BASE_URL: "https://plausible.io/api/v2/query"
};
```

### TailwindCSS Setup
- **TailwindCSS 4** : Dernière version avec @tailwindcss/vite
- **DaisyUI themes** : Thèmes pré-construits
- **Custom CSS properties** : Variables CSS pour cohérence
- **Responsive design** : Mobile-first approach

## Contraintes techniques

### Performance
- **Bundle size** : Optimisation via tree shaking automatique
- **Code splitting** : Lazy loading des composants lourds
- **SSR/SPA** : Rendu hybride selon le contexte

### Compatibilité
- **Browsers** : Dernières versions des navigateurs modernes
- **Node.js** : Version 18+ requise pour Vite 6
- **TypeScript** : Configuration stricte pour la sécurité de type

### Sécurité
- **Environment variables** : Séparation dev/prod
- **API keys** : Gestion sécurisée des clés sensibles
- **CORS** : Configuration via SvelteKit

## Development Workflow

### 1. Installation
```bash
npm install          # Installation des dépendances
npm run prepare     # Sync SvelteKit (post-install)
```

### 2. Développement
```bash
npm run dev         # Serveur de développement (Vite)
npm run check       # Vérification TypeScript
npm run format      # Formatage Prettier
```

### 3. Tests
```bash
npm run test        # Tests unitaires (Vitest)
npm run test:unit   # Tests unitaires en mode watch
```

### 4. Build & Deploy
```bash
npm run build       # Build production
npm run preview     # Preview build local
```

## Intégrations spéciales

### Supabase Integration
- **Real-time subscriptions** : Potentiel mais non utilisé actuellement
- **Row Level Security** : À configurer pour sécuriser les données
- **Storage** : Disponible pour fichiers/images si nécessaire

### Plausible Analytics
- **API v2** : Pour les données structurées
- **Main-graph API** : Pour les graphiques avec cookies
- **Custom metrics** : Tracking d'événements spécifiques

### Socket.io Integration  
- **Real-time updates** : Pour les logs et monitoring
- **Agent communication** : Communication avec les agents externes
- **Live dashboard** : Mise à jour temps réel des métriques

## Optimisations futures possibles

### Performance
- **Service Workers** : Cache stratégique
- **Database indexing** : Optimisation requêtes Supabase
- **CDN integration** : Assets statiques optimisés

### Monitoring
- **Error tracking** : Sentry ou équivalent
- **Performance monitoring** : Web Vitals tracking
- **User analytics** : Comportement utilisateur avancé

### Scalabilité
- **Database sharding** : Si volume important
- **Redis caching** : Cache distribué
- **Load balancing** : Distribution de charge
