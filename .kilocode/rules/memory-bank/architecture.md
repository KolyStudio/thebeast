# Architecture - The Beast Project

## Architecture générale

### Stack technique
- **Frontend** : SvelteKit 2 avec Svelte 5 (runes)
- **Backend** : SvelteKit API routes + Supabase
- **Base de données** : PostgreSQL via Supabase
- **Styling** : TailwindCSS 4 + DaisyUI
- **Analytics** : Plausible.io integration
- **Deployment** : SvelteKit adapter-auto

## Structure des dossiers

```
src/
├── app.html                    # Template HTML principal
├── app.css                     # Styles globaux
├── lib/
│   ├── supabaseClient.ts       # Client Supabase configuré
│   ├── utils.ts                # Utilitaires généraux
│   ├── api/                    # Services API avec Svelte stores
│   ├── components/             # Composants réutilisables
│   └── config/                 # Configurations (Plausible)
├── routes/                     # Pages et API routes
└── static/                     # Assets statiques

```

## Modules principaux

### 1. Module Dashboard (/)
**Route principale** : [`src/routes/+page.svelte`](src/routes/+page.svelte)

**Composants clés** :
- [`detailedChart.svelte`](src/lib/components/home/detailedChart.svelte) - Graphiques détaillés des revenus
- [`statsCard.svelte`](src/lib/components/home/statsCard.svelte) - Cartes de statistiques avec onglets
- [`tableStats.svelte`](src/lib/components/home/tableStats.svelte) - Tableau détaillé par source (S1)
- [`visitorsChart.svelte`](src/lib/components/home/visitorsChart.svelte) - Graphiques de visiteurs

**Services** :
- [`statsStore`](src/lib/api/stats.svelte.ts) - Gestion des statistiques financières
- [`visitorsStore`](src/lib/api/visitors.svelte.ts) - Gestion des données de trafic

### 2. Module Instagram (/instagram)
**Route principale** : [`src/routes/instagram/+page.svelte`](src/routes/instagram/+page.svelte)

**Architecture complexe** :
- **Gestion d'état réactive** avec Svelte 5 runes (`$state`, `$derived`)
- **Filtrage multi-niveaux** (statuts + phases de warmup)
- **Opérations bulk** avec sélection multiple
- **Interface CRUD complète** avec modals

**Composants clés** :
- [`tableAccounts.svelte`](src/lib/components/instagram/tableAccounts.svelte) - Table principale des comptes
- [`addAccount.svelte`](src/lib/components/instagram/addAccount.svelte) - Formulaire d'ajout
- [`editAccount.svelte`](src/lib/components/instagram/editAccount.svelte) - Formulaire d'édition
- [`listProxies.svelte`](src/lib/components/instagram/listProxies.svelte) - Gestion des proxies
- [`bulkEditAccounts.svelte`](src/lib/components/instagram/bulkEditAccounts.svelte) - Modification en masse

**Service principal** :
- [`instagramAccountsStore`](src/lib/api/instagramAccounts.svelte.ts) - Store complet avec CRUD operations

### 3. Module Applications (/applications)
**Route principale** : [`src/routes/applications/+page.svelte`](src/routes/applications/+page.svelte)

**Fonctionnalités** :
- **Géolocalisation** : Gestion de 36+ villes françaises avec coordonnées
- **Multi-plateformes** : Bumble, Badoo, Tinder
- **Liaison Instagram** : Assignation dynamique des comptes Instagram disponibles
- **Interface tableau dynamique** avec lignes vides pour créer de nouveaux comptes

**Table Supabase** : `apps_accounts`

### 4. Module Launchers (/launchers)
**Route principale** : [`src/routes/launchers/+page.svelte`](src/routes/launchers/+page.svelte)

**Composants spécialisés** :
- [`AgentsList.svelte`](src/lib/components/launchers/AgentsList.svelte) - Liste des agents
- [`AgentActions.svelte`](src/lib/components/launchers/AgentActions.svelte) - Actions des agents
- [`AppFilters.svelte`](src/lib/components/launchers/AppFilters.svelte) - Filtres par application
- [`ConsoleLogs.svelte`](src/lib/components/global/consoleLogs.svelte) - Console de logs temps réel

**Service** :
- [`modelsStore`](src/lib/api/models.svelte.ts) - Gestion des agents et logs

## Architecture des données

### Tables Supabase principales

**instagram_accounts**
```sql
- id (primary key)
- username, password
- statut (actif, disponible, en cours, utilisé, nouveau, erreur, banni, warmup)
- warmup_phase (1-5)
- changed_* (boolean) - Tracking des modifications
- proxy_* - Configuration proxy
- session, error_message
```

**apps_accounts**
```sql
- id (primary key)
- platform (Bumble, Badoo, Tinder)
- city (ville française)
- statut, application
- instagram_account_id (FK)
- instagram (nom du compte lié)
```

### API Routes structure

```
src/routes/api/
├── orders/                     # Gestion des commandes followers
├── plausible/                  # Intégration analytics
│   ├── 30min/+server.ts        # Stats temps réel
│   └── top-stats/+server.ts    # Top statistiques
```

## Patterns d'architecture

### 1. Svelte 5 Runes Pattern
Utilisation systématique des nouvelles runes Svelte 5 :
```typescript
// State management
let accounts = $state<Account[]>([]);
let isLoading = $state(false);

// Derived values
let filteredAccounts = $derived(() => {
    return accounts.filter(/* logic */);
});

// Effects
$effect(() => {
    // Side effects
});
```

### 2. Store Pattern avec Classes
```typescript
class InstagramAccountsStore {
    accounts = $state<InstagramAccount[]>([]);
    isLoading = $state({ fetch: false, create: false, ... });
    
    async fetchAccounts() { /* implementation */ }
    async createAccount() { /* implementation */ }
}

export const instagramAccountsStore = new InstagramAccountsStore();
```

### 3. Component Communication Pattern
- **Props drilling** minimisé grâce aux stores réactifs
- **Event callbacks** pour les actions (onEdit, onDelete, onToggle...)
- **Binding bidirectionnel** pour les modals et états

### 4. Error Handling Pattern
Gestion d'erreur centralisée dans chaque store :
```typescript
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

## Intégrations externes

### Supabase Integration
- **Client configuré** : [`src/lib/supabaseClient.ts`](src/lib/supabaseClient.ts)
- **Real-time subscriptions** : Possible mais non implémenté actuellement
- **Row Level Security** : Configuration à vérifier
- **URL configurée** : `ncdhbospnqaadrtmzvcs.supabase.co`

### Plausible.io Analytics
- **Configuration** : [`src/lib/config/plausible.ts`](src/lib/config/plausible.ts)
- **Site ID** : `my-secret.net`
- **API v2** + Main-graph API avec cookies
- **Métriques trackées** : visitors, pageviews, visits, duration, bounce_rate

## UI/UX Architecture

### Design System
- **Base** : TailwindCSS 4 avec DaisyUI themes
- **Composants** : Adaptation de shadcn/ui pour Svelte
- **Thème** : Sombre avec accents couleur
- **Responsive** : Mobile-first approach

### Navigation Structure
**Sidebar navigation** : [`src/lib/components/global/sidebar.svelte`](src/lib/components/global/sidebar.svelte)
```
DATING
├── Tableau de bord (/)
├── Launchers (/launchers)  
├── Applications (/applications)
└── Instagram (/instagram)
```

### State Management Philosophy
- **Local state** : Svelte 5 runes pour UI state
- **Global state** : Class-based stores pour data management
- **Server state** : Supabase avec optimistic updates
- **Form state** : Component-level avec validation

## Performance Optimizations

### Code Splitting
- **Automatic** via SvelteKit routing
- **Component lazy loading** pour les modals
- **API route separation** pour les endpoints spécialisés

### Data Management
- **Optimistic updates** dans les stores
- **Local caching** avec state management
- **Batch operations** pour les opérations bulk

### Bundle Optimization
- **Tree shaking** automatique
- **Dynamic imports** pour les composants lourds
- **Asset optimization** via Vite

## Sécurité

### Frontend Security
- **Environment variables** pour les clés sensibles
- **Client-side validation** + server-side validation
- **CORS configuration** via SvelteKit

### Database Security
- **Parameterized queries** via Supabase client
- **Row Level Security** (RLS) sur Supabase
- **API key management** pour Plausible

## Scalabilité

### Horizontal Scaling
- **Stateless architecture** compatible avec load balancing
- **Database scaling** via Supabase managed infrastructure
- **CDN ready** pour les assets statiques

### Vertical Scaling
- **Lazy loading** pour les gros datasets
- **Pagination** à implémenter pour les grandes tables
- **Caching strategies** à améliorer

## Points d'attention architecturaux

### 1. Consistency Patterns
- **Naming conventions** : camelCase JS, snake_case DB
- **Component structure** : Props, state, derived, effects, functions, markup
- **Error handling** : Centralisé dans chaque store

### 2. Technical Debt
- **TypeScript coverage** : Partiel, à améliorer
- **Testing strategy** : Tests unitaires à développer
- **Documentation** : API documentation manquante

### 3. Monitoring & Observability
- **Client-side errors** : À implémenter
- **Performance monitoring** : À intégrer
- **User analytics** : Plausible.io en place
