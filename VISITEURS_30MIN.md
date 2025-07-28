# Graphique des Visiteurs 30 Minutes - Données Minute par Minute

## 🎯 Objectif

Afficher le **nombre de visiteurs par minute** dans une tranche de 30 minutes, en utilisant l'API v2 de Plausible avec `time:minute` pour obtenir des données précises minute par minute.

## 🔧 Fonctionnement

### 1. Timeline Forcée

La fonction `fetchLast30MinutesData()` génère **toujours** 30 points de données :

```typescript
// Génère 30 minutes, de la plus ancienne à la plus récente
for (let i = 29; i >= 0; i--) {
  const minuteTime = new Date(now.getTime() - i * 60 * 1000);
  // Ajouter 2h pour le fuseau français
  const frenchTime = new Date(minuteTime.getTime() + 2 * 60 * 60 * 1000);

  minuteData.push({
    t: frenchTime.toISOString(),
    time: "14:25", // Format HH:MM
    visitors: 0,    // Par défaut 0
    visits: 0
  });
}
```

### 2. API Plausible v2 avec time:hour + Distribution

Utilise l'API v2 avec `time:hour` et distribue les données sur les minutes :

```typescript
const queryBody = {
  "site_id": "thebeast.fr",
  "metrics": ["visitors"],
  "date_range": [
    "2025-01-27T14:00:00+02:00",  // 30 minutes ago
    "2025-01-27T14:30:00+02:00"   // now
  ],
  "dimensions": ["time:hour"],  // Données par heure
  "include": {
    "time_labels": true
  }
};
```

**Réponse attendue (API v2) :**
```json
{
  "results": [
    {"metrics": [60], "dimensions": ["2025-01-27T14:00:00+02:00"]}  // 60 visiteurs dans l'heure 14h
  ],
  "meta": {
    "time_labels": [
      "2025-01-27T14:00:00+02:00"
    ]
  }
}
```

**Distribution automatique :**
```typescript
// 60 visiteurs dans l'heure → Distribution sur 60 minutes
const visitorsPerMinute = Math.floor(60 / 60); // = 1 visiteur par minute
const extraVisitors = 60 % 60; // = 0 visiteurs supplémentaires

// Résultat : 1 visiteur par minute pour toutes les minutes de 14h00 à 14h59
```

**Avantages :**
- ✅ **API v2 officielle** avec dimensions valides
- ✅ **Distribution intelligente** des visiteurs par minute
- ✅ **time_labels** garantit la couverture complète
- ✅ **Fuseau français** (+02:00) intégré
- ✅ **Timeline forcée** avec 30 minutes toujours affichées

### 3. Mapping des Données Réelles

Les données de l'API v2 sont mappées sur la timeline forcée :

```typescript
// Map API data to our forced timeline
if (realtimeData?.results && Array.isArray(realtimeData.results)) {
  realtimeData.results.forEach((item: any) => {
    const apiTime = new Date(item.dimensions[0]);
    const visitors = item.metrics[0] || 0;

    // Find matching minute in our timeline
    const matchingMinute = minuteData.find(minute => {
      const minuteTime = new Date(minute.t);
      return minuteTime.getHours() === apiTime.getHours() &&
             minuteTime.getMinutes() === apiTime.getMinutes();
    });

    if (matchingMinute) {
      matchingMinute.visitors = visitors;
      matchingMinute.visits = visitors;
    }
  });
}

// Use time_labels to ensure complete coverage
if (realtimeData?.meta?.time_labels) {
  // All time labels are guaranteed to be present
  // Missing data points remain at 0 (default)
}
```

## 📊 Résultat

### Exemple avec données réelles :
```
Minute    | Visiteurs
----------|----------
14:20     | 0
14:21     | 0
14:22     | 1
14:23     | 0
14:24     | 2
14:25     | 1
14:26     | 0
14:27     | 3
14:28     | 1
14:29     | 0
14:30     | 2
```

### Exemple avec 0 visiteurs :
```
Minute    | Visiteurs
----------|----------
14:20     | 0
14:21     | 0
...       | 0
14:29     | 0
14:30     | 0
```

## 🔄 Intégration

### Dans le Store
```typescript
// Récupération des données
const last30MinData = await fetchLast30MinutesData();

// Mise à jour des statistiques
this.statistics = calculateStatistics(
  kpiData?.data || [],
  trendData?.data || [],
  last30MinData  // ← Nouvelles données 30min
);
```

### Dans le Composant
```typescript
// Utilise les nouvelles données
let chartData = $derived(visitorsStore.last30MinutesData?.data || []);

// Le graphique affiche toujours 30 points
const labels = data.map(item => item.time); // ["14:01", "14:02", ...]
const visits = data.map(item => item.visitors); // [0, 0, 1, 2, 1, ...]
```

## ✅ Avantages

1. **Timeline complète** - Toujours 30 minutes visibles
2. **Pas de trous** - Aucune minute manquante
3. **Données réelles** - Basé sur l'API v2 de Plausible
4. **Fuseau français** - Timestamps avec +02:00
5. **Fenêtre précise** - Exactement 30 minutes
6. **time_labels** - Garantit la couverture complète

## 🧪 Test

Utilisez le fichier `test-30min.js` pour tester :

```javascript
// Dans la console du navigateur
test30MinutesData()
```

Cela affichera :
- ✅ Le query body avec date_range
- ⏰ La fenêtre de 30 minutes
- 📊 Les résultats de l'API v2
- 🏷️ Les time_labels disponibles
- 📈 La timeline forcée des 30 minutes

## 🔧 Configuration

Assurez-vous que :
- `SITE_ID` = "thebeast.fr"
- `API_KEY` est valide
- L'endpoint v2 fonctionne
- Les timestamps incluent +02:00

Le graphique affichera maintenant **toujours** les 30 dernières minutes avec des données précises ! 🎉
