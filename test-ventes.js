/**
 * Script de test pour créer des données de ventes fictives
 * À exécuter avec Node.js pour tester le nouveau système
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ncdhbospnqaadrtmzvcs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZGhib3NwbnFhYWRydG16dmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc2ODI3OTUsImV4cCI6MjA0MzI1ODc5NX0.HmyLRoz39tCaqF4ORwnE2PhI1Dw3GcO8-vB3bWzcxT0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('🚀 Création de données de test pour les ventes...');

  // Créer des ventes pour les 30 derniers jours
  const testVentes = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Nombre aléatoire de ventes par jour (0-10)
    const ventesParJour = Math.floor(Math.random() * 11);
    
    for (let j = 0; j < ventesParJour; j++) {
      const venteDate = new Date(date);
      venteDate.setHours(Math.floor(Math.random() * 24));
      venteDate.setMinutes(Math.floor(Math.random() * 60));

      // Générer un payout aléatoire entre 10$ et 500$
      const payout = Math.round((Math.random() * 490 + 10) * 100) / 100;

      // Sources possibles pour les ventes
      const sources = ['Google Ads', 'Facebook', 'Instagram', 'TikTok', 'Organic', 'Email', 'Direct'];
      const source = sources[Math.floor(Math.random() * sources.length)];

      testVentes.push({
        created_at: venteDate.toISOString(),
        payout: payout,
        source: source
      });
    }
  }

  console.log(`📊 Insertion de ${testVentes.length} ventes de test...`);

  try {
    const { data, error } = await supabase
      .from('ventes')
      .insert(testVentes);

    if (error) {
      console.error('❌ Erreur lors de l\'insertion:', error);
      return;
    }

    console.log('✅ Données de test créées avec succès !');
    console.log(`📈 ${testVentes.length} ventes insérées`);
    
    // Afficher un résumé par jour
    const ventesParJour = {};
    testVentes.forEach(vente => {
      const jour = vente.created_at.split('T')[0];
      if (!ventesParJour[jour]) {
        ventesParJour[jour] = { count: 0, payout: 0 };
      }
      ventesParJour[jour].count += 1;
      ventesParJour[jour].payout += vente.payout;
    });

    console.log('\n📅 Résumé par jour:');
    Object.entries(ventesParJour)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7)
      .forEach(([jour, data]) => {
        console.log(`  ${jour}: ${data.count} ventes - ${data.payout.toFixed(2)}$`);
      });

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Fonction pour nettoyer les données de test
async function cleanTestData() {
  console.log('🧹 Nettoyage des données de test...');
  
  try {
    const { error } = await supabase
      .from('ventes')
      .delete()
      .gte('id', 1); // Supprimer toutes les ventes

    if (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      return;
    }

    console.log('✅ Données de test supprimées !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter selon l'argument de ligne de commande
const action = process.argv[2];

if (action === 'clean') {
  cleanTestData();
} else {
  createTestData();
}
