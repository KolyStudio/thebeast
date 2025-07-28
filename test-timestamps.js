/**
 * Test script pour vérifier les timestamps envoyés à l'API
 * Exécutez dans la console du navigateur
 */

function testTimestamps() {
  console.log('🕐 Test des timestamps pour l\'API Plausible...');
  console.log('');
  
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  
  console.log('⏰ Heure actuelle (système):', now.toString());
  console.log('⏰ Il y a 30 minutes (système):', thirtyMinutesAgo.toString());
  console.log('');
  
  // Méthode 1: UTC (ce qui causait le problème)
  const startTimeUTC = thirtyMinutesAgo.toISOString();
  const endTimeUTC = now.toISOString();
  
  console.log('❌ Méthode UTC (problématique):');
  console.log('  Start:', startTimeUTC);
  console.log('  End:', endTimeUTC);
  console.log('  → Affiche 06:xx au lieu de 08:xx');
  console.log('');
  
  // Méthode 2: Conversion française (solution)
  const frenchOffset = 2 * 60 * 60 * 1000; // +2h en millisecondes
  const startTimeFrench = new Date(thirtyMinutesAgo.getTime() + frenchOffset);
  const endTimeFrench = new Date(now.getTime() + frenchOffset);
  
  const startTime = startTimeFrench.toISOString().replace('Z', '+02:00');
  const endTime = endTimeFrench.toISOString().replace('Z', '+02:00');
  
  console.log('✅ Méthode française (corrigée):');
  console.log('  Start:', startTime);
  console.log('  End:', endTime);
  console.log('  → Affiche 08:xx (heure française correcte)');
  console.log('');
  
  // Vérification des heures
  const startHour = parseInt(startTime.split('T')[1].split(':')[0]);
  const endHour = parseInt(endTime.split('T')[1].split(':')[0]);
  const currentHourFrench = parseInt(now.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    timeZone: 'Europe/Paris' 
  }).split(':')[0]);
  
  console.log('🔍 Vérification:');
  console.log('  Heure française actuelle:', currentHourFrench + 'h');
  console.log('  Heure dans le timestamp:', endHour + 'h');
  console.log('  Match:', endHour === currentHourFrench ? '✅ OUI' : '❌ NON');
  
  return {
    utc: { start: startTimeUTC, end: endTimeUTC },
    french: { start: startTime, end: endTime },
    verification: {
      currentHourFrench,
      timestampHour: endHour,
      match: endHour === currentHourFrench
    }
  };
}

// Exécuter le test
console.log('Pour tester les timestamps, exécutez: testTimestamps()');

// Si vous voulez l'exécuter automatiquement:
// testTimestamps();
