# The Beast Project

## Description
Dashboard de gestion et d'automatisation pour applications de rencontres (dating apps) avec intégration Instagram avancée. Solution complète de marketing automation orientée dating avec analytics en temps réel.

## Objectifs principaux
- **Automatisation** : Gestion centralisée de comptes Instagram et dating apps
- **Scaling** : Support de multiples comptes par ville française (36+ villes)
- **Analytics** : Monitoring des performances avec métriques financières détaillées
- **Sécurité** : Système de warmup anti-détection (5 phases)

## Fonctionnalités clés
- **Dashboard Analytics** : Revenus, clics, inscriptions en temps réel
- **Module Instagram** : CRUD complet avec tracking des changements interactifs
- **Module Applications** : Gestion Bumble/Badoo/Tinder par géolocalisation
- **Module Launchers** : Supervision d'agents automatisés

## Technologies utilisées
- **Frontend** : SvelteKit 2, Svelte 5 (runes), TailwindCSS 4, DaisyUI
- **Backend** : SvelteKit API routes, Supabase PostgreSQL
- **Analytics** : Plausible.io integration
- **Real-time** : Socket.io, Chart.js/ApexCharts

## Architecture technique
- **Pattern Svelte 5** : Stores basés sur classes avec `$state`, `$derived`, `$effect`
- **Base de données** : Tables `instagram_accounts`, `apps_accounts` avec liaisons
- **API Integration** : Supabase client + Plausible.io APIs (v2 + Main-graph)
- **State Management** : Gestion d'erreur centralisée, optimistic updates

## Significance
Plateforme professionnelle pour automatiser les campagnes de dating apps avec une approche technique avancée, réduisant significativement les tâches manuelles tout en optimisant les performances marketing via des analytics précis et un système de warmup intelligent.
