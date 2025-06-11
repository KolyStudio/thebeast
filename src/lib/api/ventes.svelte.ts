/**
 * Ventes API service using Svelte 5 runes and Supabase
 * Remplace l'ancien système Prelinker par les données de la table "ventes"
 */

import { supabase } from '$lib/supabaseClient';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('fr');

// Types pour les réponses et les erreurs
type ApiResponse = Record<string, any>;
type ApiError = Error | { message: string };

// Interface pour les données de ventes
export interface VenteData {
  id: number;
  created_at: string;
  payout: number | string; // Peut être string ou number selon la DB
  source?: string; // Source de la vente
  // Autres champs selon la structure de la table
}

// Fonction utilitaire pour convertir payout en nombre
export function parsePayoutToNumber(payout: any): number {
  if (typeof payout === 'number') return isNaN(payout) ? 0 : payout;
  if (typeof payout === 'string') {
    const parsed = parseFloat(payout);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Interface pour les statistiques de période
export interface PeriodStats {
  count: number;
  totalPayout: number;
  results: VenteData[];
}

// Create state objects that can be updated
class VentesStore {
  // États réactifs pour chaque période
  today = $state<PeriodStats | null>(null);
  yesterday = $state<PeriodStats | null>(null);
  month = $state<PeriodStats | null>(null);
  detailed = $state<PeriodStats | null>(null);
  graph = $state<PeriodStats | null>(null);

  // États de chargement
  isLoading = $state({
    today: false,
    yesterday: false,
    month: false,
    detailed: false,
    graph: false
  });

  // États d'erreur
  errors = $state({
    today: null as ApiError | null,
    yesterday: null as ApiError | null,
    month: null as ApiError | null,
    detailed: null as ApiError | null,
    graph: null as ApiError | null
  });

  /**
   * Méthode générique pour exécuter une opération avec gestion d'erreur
   */
  private async executeOperation<T>(
    operation: () => Promise<T>,
    key: keyof typeof this.isLoading
  ): Promise<T | null> {
    this.isLoading[key] = true;
    this.errors[key] = null;

    try {
      const result = await operation();
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      this.errors[key] = new Error(errorMessage);
      console.error(`Erreur lors de l'opération ${key}:`, errorMessage);
      return null;
    } finally {
      this.isLoading[key] = false;
    }
  }

  /**
   * Récupérer les ventes pour une période donnée
   */
  private async fetchVentesForPeriod(startDate: string, endDate: string): Promise<PeriodStats> {
    // Déterminer si les dates sont déjà au format ISO ou au format YYYY-MM-DD
    let startISO: string;
    let endISO: string;
    
    if (startDate.includes('T')) {
      // Les dates sont déjà au format ISO (viennent des méthodes fetchToday, etc.)
      startISO = startDate;
      endISO = endDate;
    } else {
      // Les dates sont au format YYYY-MM-DD (viennent de fetchDetailed)
      // Convertir en UTC car la DB stocke les timestamps en UTC (+00)
      // Prendre le début et la fin de journée en heure locale puis convertir en UTC
      const startLocal = dayjs.tz(startDate + ' 00:00:00', 'Europe/Paris');
      const endLocal = dayjs.tz(endDate + ' 23:59:59', 'Europe/Paris');
      
      startISO = startLocal.utc().toISOString();
      endISO = endLocal.utc().toISOString();
    }

    console.log(`🔍 Requête Supabase: ${startISO} à ${endISO}`);
    console.log(`📅 Dates locales: ${startDate} à ${endDate}`);

    const { data, error } = await supabase
      .from('ventes')
      .select('id, created_at, payout, source')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      throw new Error(`Erreur lors de la récupération des ventes: ${error.message}`);
    }

    console.log(`✅ Données récupérées: ${data?.length || 0} ventes`);
    if (data && data.length > 0) {
      console.log('📅 Première vente:', data[0]);
    }

    // Calculer la somme des payouts (convertir en nombre si c'est une string)
    const totalPayout = data?.reduce((sum, vente) => {
      return sum + parsePayoutToNumber(vente.payout);
    }, 0) || 0;

    return {
      count: data?.length || 0,
      totalPayout,
      results: data || []
    };
  }

  /**
   * Récupérer les ventes d'aujourd'hui
   */
  async fetchToday() {
    return this.executeOperation(async () => {
      const today = dayjs().tz('Europe/Paris').format('YYYY-MM-DD');
      
      const result = await this.fetchVentesForPeriod(today, today);
      this.today = result;
      return result;
    }, 'today');
  }

  /**
   * Récupérer les ventes d'hier
   */
  async fetchYesterday() {
    return this.executeOperation(async () => {
      const yesterday = dayjs().tz('Europe/Paris').subtract(1, 'day').format('YYYY-MM-DD');
      
      const result = await this.fetchVentesForPeriod(yesterday, yesterday);
      this.yesterday = result;
      return result;
    }, 'yesterday');
  }

  /**
   * Récupérer les ventes du mois
   */
  async fetchMonth() {
    return this.executeOperation(async () => {
      const now = dayjs().tz('Europe/Paris');
      const startOfMonth = now.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = now.endOf('month').format('YYYY-MM-DD');

      const result = await this.fetchVentesForPeriod(startOfMonth, endOfMonth);
      this.month = result;
      return result;
    }, 'month');
  }

  /**
   * Récupérer les ventes pour une plage de dates détaillée
   */
  async fetchDetailed(startDate: string, endDate: string) {
    return this.executeOperation(async () => {
      // Passer directement les dates au format YYYY-MM-DD
      // La conversion ISO sera gérée dans fetchVentesForPeriod
      const result = await this.fetchVentesForPeriod(startDate, endDate);
      this.detailed = result;
      return result;
    }, 'detailed');
  }

  /**
   * Récupérer les données pour le graphique
   */
  async fetchGraph(startDate?: string, endDate?: string) {
    return this.executeOperation(async () => {
      let start: string, end: string;

      if (startDate && endDate) {
        // Utiliser directement les dates au format YYYY-MM-DD
        start = startDate;
        end = endDate;
      } else {
        // Par défaut, prendre le mois courant
        const now = dayjs().tz('Europe/Paris');
        start = now.startOf('month').format('YYYY-MM-DD');
        end = now.endOf('month').format('YYYY-MM-DD');
      }

      const result = await this.fetchVentesForPeriod(start, end);
      this.graph = result;
      return result;
    }, 'graph');
  }

  /**
   * Charger toutes les données en une fois
   */
  async fetchAllStats() {
    const keys = ['today', 'yesterday', 'month', 'detailed', 'graph'] as const;
    
    keys.forEach(key => {
      this.isLoading[key] = true;
      this.errors[key] = null;
    });
    
    try {
      await Promise.all([
        this.fetchToday(),
        this.fetchYesterday(),
        this.fetchMonth(),
        this.fetchDetailed(dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')),
        this.fetchGraph()
      ]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      console.error('Erreur lors du chargement de toutes les statistiques:', errorMessage);
    } finally {
      keys.forEach(key => {
        this.isLoading[key] = false;
      });
    }
  }

  /**
   * Réinitialiser toutes les données
   */
  clearData() {
    this.today = null;
    this.yesterday = null;
    this.month = null;
    this.detailed = null;
    this.graph = null;

    // Réinitialiser les erreurs
    Object.keys(this.errors).forEach(key => {
      this.errors[key as keyof typeof this.errors] = null;
    });
  }
}

// Créer et exporter une instance singleton
export const ventesStore = new VentesStore();
