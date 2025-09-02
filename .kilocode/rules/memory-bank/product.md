# Product Description - The Beast Project

## Vue d'ensemble

**The Beast Project** est un dashboard de gestion et d'automatisation avancé pour les applications de rencontres (Bumble, Badoo, Tinder) avec intégration Instagram. C'est une solution complète de marketing automation orientée dating apps avec analytics en temps réel.

## Problèmes résolus

### 1. Gestion centralisée des comptes de dating apps
- **Problème** : Gérer manuellement des dizaines/centaines de comptes sur différentes plateformes de dating
- **Solution** : Interface unifiée pour superviser tous les comptes par ville et plateforme

### 2. Automatisation des profils Instagram
- **Problème** : Créer et maintenir des profils Instagram authentiques pour supporter les dating apps
- **Solution** : Système de gestion des comptes Instagram avec tracking des changements (pseudo, bio, photo, etc.)

### 3. Monitoring et analytics des performances
- **Problème** : Manque de visibilité sur les performances des campagnes dating
- **Solution** : Dashboard analytique avec métriques détaillées (clics, inscrits, revenus, etc.)

### 4. Gestion des phases de warming
- **Problème** : Éviter la détection et les bans lors de la création de nouveaux comptes
- **Solution** : Système de phases de warmup avec tracking automatique

## Fonctionnalités principales

### Module Dashboard (Accueil)
- Statistiques temps réel (revenus, clics, inscriptions)
- Graphiques de performance avec filtres par période
- Métriques financières détaillées (essais, bills, upsells, rebills, impayés)
- Integration Plausible.io pour l'analytics web

### Module Instagram
- Gestion complète des comptes Instagram
- Tracking interactif des changements (username, bio, photo, nom, URL, statut, type)
- Système de statuts (actif, disponible, en cours, utilisé, nouveau, erreur, banni, warmup)
- Phases de warmup avec progression automatique (1-5)
- Gestion des proxies avec renouvellement automatique
- Modification en masse et opérations bulk
- Terminal intégré pour opérations avancées

### Module Applications (Dating Apps)
- Gestion par ville française (36+ villes supportées)
- Support multi-plateformes (Bumble, Badoo, Tinder)
- Liaison avec comptes Instagram disponibles
- Tracking des statuts et performances par compte
- Interface de création/édition avec géolocalisation

### Module Launchers (Agents)
- Gestion d'agents automatisés pour les dating apps
- Monitoring en temps réel avec logs détaillés
- Filtrage par application (Fruitz, Happn)
- Interface de contrôle et supervision des agents

## Architecture utilisateur

### Expérience utilisateur optimisée
- Interface moderne avec Svelte 5 + SvelteKit
- Design responsive adaptatif (mobile/desktop)
- Navigation intuitive par modules spécialisés
- Thème sombre professionnel
- Composants UI réutilisables (shadcn/ui inspiré)

### Workflows principaux

1. **Création d'un nouveau compte dating** :
   - Sélection ville + plateforme → Liaison compte Instagram → Configuration → Activation

2. **Gestion du warmup Instagram** :
   - Nouveau compte → Phase 1 → ... → Phase 5 (Terminé) → Disponible

3. **Analytics et monitoring** :
   - Tableau de bord → Filtres temporels → Métriques détaillées → Actions correctives

4. **Opérations bulk** :
   - Sélection multiple → Actions groupées → Monitoring → Validation

## Objectifs business

### Court terme
- Automatisation complète du processus de création de comptes
- Réduction du taux de ban grâce au système de warmup
- Optimisation des performances par analyse des métriques

### Long terme  
- Scalabilité pour gérer des milliers de comptes simultanément
- Intelligence artificielle pour optimiser automatiquement les profils
- Expansion vers d'autres plateformes de dating
- API publique pour intégrations tierces

## Public cible

- **Professionnels du marketing digital** spécialisés dans les dating apps
- **Agences de rencontres** gérant de multiples profils clients
- **Entrepreneurs** dans le secteur des applications de rencontres
- **Équipes techniques** nécessitant un contrôle granulaire des opérations

## Valeur ajoutée unique

1. **Intégration complète Instagram ↔ Dating Apps** : Synchronisation automatique
2. **Analytics avancés** : Métriques financières précises avec ROI tracking
3. **Système de warmup intelligent** : Réduction significative des bans
4. **Gestion par géolocalisation** : Ciblage précis par ville française
5. **Interface technique avancée** : Terminal, bulk operations, monitoring temps réel
