/**
 * Test script pour vérifier les données des 30 dernières minutes avec date_range
 * Exécutez dans la console du navigateur
 */

// Import de la fonction (à adapter selon votre environnement)
// import { fetchLast30MinutesData } from '$lib/api/analytics';

async function test30MinutesData() {
  console.log('🧪 Test des données 30 minutes avec API v2 date_range...');

  try {
    // Configuration API v2 avec date_range personnalisé
    const SITE_ID = 'thebeast.fr';
    const API_KEY = 'ri7WDjH-HjjqUdSRPIBtBTIPMLbqydLgYOJmHGYhxp9UYiYgaHO0-CuqFHb4iBti';

    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Convert to French timezone before sending to API
    const frenchOffset = 2 * 60 * 60 * 1000; // +2h en millisecondes
    const startTimeFrench = new Date(thirtyMinutesAgo.getTime() + frenchOffset);
    const endTimeFrench = new Date(now.getTime() + frenchOffset);

    const startTime = startTimeFrench.toISOString().replace('Z', '+02:00');
    const endTime = endTimeFrench.toISOString().replace('Z', '+02:00');

    const queryBody = {
      "site_id": SITE_ID,
      "metrics": ["visitors"],
      "date_range": [startTime, endTime],
      "dimensions": ["time"],
      "include": {
        "time_labels": true
      }
    };

    console.log('📡 Query body:', queryBody);
    console.log('⏰ Date range:', startTime, 'à', endTime);

    const response = await fetch('https://plausible.io/api/v2/query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryBody)
    });

    if (!response.ok) {
      throw new Error(`API error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    console.log('✅ Réponse API v2:', data);
    console.log('📊 Nombre de résultats:', data.results?.length || 0);
    console.log('⏰ Time labels:', data.meta?.time_labels?.length || 0);

    if (data.results && data.results.length > 0) {
      console.log('📈 Premiers points de données:');
      console.table(data.results.slice(0, 5).map((item) => ({
        time: new Date(item.dimensions[0]).toLocaleTimeString('fr-FR'),
        visitors: item.metrics[0]
      })));
    }

    if (data.meta?.time_labels && data.meta.time_labels.length > 0) {
      console.log('🏷️ Premiers time labels:');
      console.log(data.meta.time_labels.slice(0, 5).map(label =>
        new Date(label).toLocaleTimeString('fr-FR')
      ));
    }

    // Générer la timeline forcée des 30 minutes
    const minuteData = [];

    for (let i = 29; i >= 0; i--) {
      const minuteTime = new Date(now.getTime() - i * 60 * 1000);

      minuteData.push({
        t: minuteTime.toISOString(),
        time: minuteTime.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Paris' // Utilise le fuseau français automatiquement
        }),
        visitors: 0,
        visits: 0
      });
    }

    // Mapper les données API sur la timeline forcée
    if (data.results && data.results.length > 0) {
      data.results.forEach((item) => {
        const apiTime = new Date(item.dimensions[0]);
        const visitors = item.metrics[0] || 0;

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

    console.log('📊 Timeline des 30 minutes (forcée):');
    console.table(minuteData.slice(-10)); // Afficher les 10 dernières minutes

    const totalVisitors = minuteData.reduce((sum, item) => sum + item.visitors, 0);
    console.log('📈 Total visiteurs sur 30min:', totalVisitors);

    return {
      data: minuteData,
      totalVisitors,
      apiResponse: data
    };

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return null;
  }
}

// Exécuter le test
console.log('Pour tester, exécutez: test30MinutesData()');

// Si vous voulez l'exécuter automatiquement:
// test30MinutesData();
