/**
 * Script de test pour vérifier la migration Plausible.io
 *
 * Utilisez ce script pour tester rapidement si l'API Plausible fonctionne
 * avant de déployer en production.
 */

import {
  fetchTrendData,
  fetchKPIData,
  fetchTopPages,
  fetchTopLocations,
  fetchAllAnalyticsData
} from '$lib/api/analytics';

/**
 * Test toutes les fonctions de l'API Plausible v2
 */
export async function testPlausibleAPI() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateFrom = yesterday.toISOString().split('T')[0];
  const dateTo = today.toISOString().split('T')[0];

  console.log('🧪 Test de l\'API Plausible v2...');
  console.log(`📅 Période de test: ${dateFrom} à ${dateTo}`);

  try {
    // Test 1: Données de tendance
    console.log('\n1️⃣ Test fetchTrendData...');
    const trendData = await fetchTrendData(dateFrom, dateTo);
    console.log('✅ Trend data:', trendData?.data?.length || 0, 'points de données');
    if (trendData?.data?.length > 0) {
      console.log('   📊 Premier point:', trendData.data[0]);
    }

    // Test 2: Données KPI
    console.log('\n2️⃣ Test fetchKPIData...');
    const kpiData = await fetchKPIData(dateFrom, dateTo);
    console.log('✅ KPI data:', kpiData?.data?.length || 0, 'points de données');
    if (kpiData?.data?.length > 0) {
      console.log('   📈 Premier KPI:', kpiData.data[0]);
    }

    // Test 3: Pages populaires
    console.log('\n3️⃣ Test fetchTopPages...');
    const topPages = await fetchTopPages(dateFrom, dateTo, 5);
    console.log('✅ Top pages:', topPages?.data?.length || 0, 'pages');
    if (topPages?.data?.length > 0) {
      console.log('   📄 Première page:', topPages.data[0]);
    }

    // Test 4: Pays et villes populaires
    console.log('\n4️⃣ Test fetchTopLocations...');
    const topLocations = await fetchTopLocations(dateFrom, dateTo, 5);
    console.log('✅ Top locations:', topLocations?.data?.length || 0, 'locations');
    if (topLocations?.data?.length > 0) {
      console.log('   🌍 Première location:', topLocations.data[0]);
    }

    // Test 5: Toutes les données
    console.log('\n5️⃣ Test fetchAllAnalyticsData...');
    const allData = await fetchAllAnalyticsData({
      start: {
        year: yesterday.getFullYear(),
        month: yesterday.getMonth() + 1,
        day: yesterday.getDate()
      },
      end: {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
      }
    });
    console.log('✅ All data récupérées avec succès');
    console.log('   📊 Trend data:', allData?.trendData?.data?.length || 0);
    console.log('   📈 KPI data:', allData?.kpiData?.data?.length || 0);
    console.log('   📄 Top pages:', allData?.topPages?.length || 0);
    console.log('   🌍 Top locations:', allData?.topLocations?.length || 0);

    console.log('\n🎉 Tous les tests sont passés ! L\'API Plausible fonctionne correctement.');
    return true;

  } catch (error) {
    console.error('\n❌ Erreur lors du test de l\'API Plausible:', error);

    if (error instanceof Error) {
      if (error.message.includes('401')) {
        console.error('🔑 Erreur d\'authentification - Vérifiez votre clé API');
      } else if (error.message.includes('400')) {
        console.error('⚙️ Erreur de configuration - Vérifiez le SITE_ID dans plausible.ts');
      } else if (error.message.includes('404')) {
        console.error('🔍 Site non trouvé - Vérifiez que le site existe dans Plausible');
      }
    }

    console.error('\n📖 Consultez PLAUSIBLE_MIGRATION.md pour plus d\'aide');
    return false;
  }
}

/**
 * Test rapide pour vérifier la configuration
 */
export async function quickTest() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await fetchKPIData(today, today);
    console.log('✅ Configuration Plausible OK');
    return true;
  } catch (error) {
    console.error('❌ Problème de configuration Plausible:', error);
    return false;
  }
}

// Pour utiliser dans la console du navigateur :
// import { testPlausibleAPI } from '$lib/utils/test-plausible';
// testPlausibleAPI();
