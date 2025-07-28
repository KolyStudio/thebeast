/**
 * Test script pour vérifier les fuseaux horaires
 * Exécutez dans la console du navigateur
 */

function testTimezone() {
  const now = new Date();
  
  console.log('🕐 Test des fuseaux horaires...');
  console.log('');
  
  console.log('⏰ Heure système (locale):', now.toString());
  console.log('🌍 Heure UTC:', now.toISOString());
  console.log('🇫🇷 Heure française (Europe/Paris):', now.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }));
  console.log('🇫🇷 Heure française (HH:MM):', now.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  }));
  
  console.log('');
  console.log('📊 Timeline des 5 dernières minutes:');
  
  const timeline = [];
  for (let i = 4; i >= 0; i--) {
    const minuteTime = new Date(now.getTime() - i * 60 * 1000);
    
    timeline.push({
      utc: minuteTime.toISOString(),
      french: minuteTime.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/Paris'
      }),
      local: minuteTime.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    });
  }
  
  console.table(timeline);
  
  console.log('');
  console.log('🔍 Vérifications:');
  console.log('- Si vous êtes en France, "french" et "local" devraient être identiques');
  console.log('- "french" devrait afficher l\'heure française correcte (8:00 si c\'est 8h en France)');
  console.log('- "utc" sera différent selon votre fuseau horaire');
  
  return timeline;
}

// Exécuter le test
console.log('Pour tester les fuseaux horaires, exécutez: testTimezone()');

// Si vous voulez l'exécuter automatiquement:
// testTimezone();
