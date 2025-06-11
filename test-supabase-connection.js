/**
 * Script de test pour vérifier la connexion Supabase et les données de ventes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ncdhbospnqaadrtmzvcs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZGhib3NwbnFhYWRydG16dmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc2ODI3OTUsImV4cCI6MjA0MzI1ODc5NX0.HmyLRoz39tCaqF4ORwnE2PhI1Dw3GcO8-vB3bWzcxT0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Test de connexion Supabase...');
  
  try {
    // Test 1: Récupérer toutes les ventes
    console.log('\n📊 Test 1: Récupération de toutes les ventes');
    const { data: allVentes, error: allError } = await supabase
      .from('ventes')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Erreur lors de la récupération de toutes les ventes:', allError);
      return;
    }

    console.log(`✅ ${allVentes?.length || 0} ventes trouvées`);
    if (allVentes && allVentes.length > 0) {
      console.log('📅 Première vente:', allVentes[0]);
      console.log('📅 Dernière vente:', allVentes[allVentes.length - 1]);
    }

    // Test 2: Récupérer les ventes d'aujourd'hui
    console.log('\n📊 Test 2: Récupération des ventes d\'aujourd\'hui');
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    
    console.log(`🕐 Période: ${startOfDay} à ${endOfDay}`);

    const { data: todayVentes, error: todayError } = await supabase
      .from('ventes')
      .select('*')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: false });

    if (todayError) {
      console.error('❌ Erreur lors de la récupération des ventes d\'aujourd\'hui:', todayError);
      return;
    }

    console.log(`✅ ${todayVentes?.length || 0} ventes trouvées pour aujourd'hui`);

    // Test 3: Récupérer les ventes des 7 derniers jours
    console.log('\n📊 Test 3: Récupération des ventes des 7 derniers jours');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();
    
    console.log(`🕐 Période: ${sevenDaysAgoISO} à ${new Date().toISOString()}`);

    const { data: weekVentes, error: weekError } = await supabase
      .from('ventes')
      .select('*')
      .gte('created_at', sevenDaysAgoISO)
      .order('created_at', { ascending: false });

    if (weekError) {
      console.error('❌ Erreur lors de la récupération des ventes de la semaine:', weekError);
      return;
    }

    console.log(`✅ ${weekVentes?.length || 0} ventes trouvées pour les 7 derniers jours`);

    // Test 4: Grouper par source
    if (weekVentes && weekVentes.length > 0) {
      console.log('\n📊 Test 4: Groupement par source');
      const groupedBySource = new Map();
      
      weekVentes.forEach((vente) => {
        const source = vente.source?.trim() || 'Inconnu';
        const current = groupedBySource.get(source) || { count: 0, payout: 0 };
        const payoutValue = typeof vente.payout === 'number' ? vente.payout : parseFloat(vente.payout) || 0;
        
        groupedBySource.set(source, {
          count: current.count + 1,
          payout: current.payout + payoutValue
        });
      });

      console.log('📈 Ventes par source:');
      Array.from(groupedBySource.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([source, data]) => {
          console.log(`  ${source}: ${data.count} ventes - ${data.payout.toFixed(2)}€`);
        });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testConnection();
