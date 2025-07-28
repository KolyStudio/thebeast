/**
 * Stats API service using Svelte 5 runes
 */

// Define API endpoints
const API_BASE = 'https://datingapitest.fly.dev';
const ENDPOINTS = {
  today: `${API_BASE}/today`,
  yesterday: `${API_BASE}/yesterday`,
  month: `${API_BASE}/month`,
  detailed: (date1: string, date2: string) => 
    `${API_BASE}/detailed?date1=${date1}&date2=${date2}`,
  graph: (date1?: string, date2?: string) => {
    // Add date params if provided, otherwise use default endpoint
    if (date1 && date2) {
      return `${API_BASE}/graph?date1=${date1}&date2=${date2}`;
    }
    return `${API_BASE}/graph`;
  }
};

// Types pour les réponses et les erreurs
type ApiResponse = Record<string, any>;
type ApiError = Error | { message: string };

// Create state objects that can be updated
class StatsStore {
  today = $state<ApiResponse | null>(null);
  yesterday = $state<ApiResponse | null>(null);
  month = $state<ApiResponse | null>(null);
  detailed = $state<ApiResponse | null>(null);
  graph = $state<ApiResponse | null>(null);

  isLoading = $state({
    today: false,
    yesterday: false,
    month: false,
    detailed: false,
    graph: false
  });

  errors = $state<Record<string, string | null>>({
    today: null,
    yesterday: null,
    month: null,
    detailed: null,
    graph: null
  });

  /**
   * Fetch data from an API endpoint
   */
  async fetchData(url: string): Promise<ApiResponse> {
    try {
      const response = await fetch(url, { 
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache' // Éviter la mise en cache pour les données en temps réel
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Méthode générique pour gérer les requêtes API
   */
  private async fetchResource<T>(
    endpoint: string, 
    stateKey: 'today' | 'yesterday' | 'month' | 'detailed' | 'graph'
  ): Promise<T | null> {
    this.isLoading[stateKey] = true;
    this.errors[stateKey] = null;
    
    try {
      const data = await this.fetchData(endpoint);
      this[stateKey] = data;
      return data as T;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      this.errors[stateKey] = errorMessage;
      return null;
    } finally {
      this.isLoading[stateKey] = false;
    }
  }

  /**
   * Fetch today's stats
   */
  async fetchToday() {
    return this.fetchResource(ENDPOINTS.today, 'today');
  }

  /**
   * Fetch yesterday's stats
   */
  async fetchYesterday() {
    return this.fetchResource(ENDPOINTS.yesterday, 'yesterday');
  }

  /**
   * Fetch monthly stats
   */
  async fetchMonth() {
    return this.fetchResource(ENDPOINTS.month, 'month');
  }

  /**
   * Fetch detailed stats for a date range
   */
  async fetchDetailed(date1: string = new Date().toISOString(), date2: string = new Date().toISOString()) {
    return this.fetchResource(ENDPOINTS.detailed(date1, date2), 'detailed');
  }

  /**
   * Fetch graph data for visualizations
   */
  async fetchGraph(date1?: string, date2?: string) {
    return this.fetchResource(ENDPOINTS.graph(date1, date2), 'graph');
  }

  /**
   * Fetch all stats at once
   */
  async fetchAllStats() {
    // Réinitialiser les états
    const keys: Array<'today' | 'yesterday' | 'month' | 'detailed' | 'graph'> = 
      ['today', 'yesterday', 'month', 'detailed', 'graph'];
    
    keys.forEach(key => {
      this.isLoading[key] = true;
      this.errors[key] = null;
    });
    
    try {
      const [todayData, yesterdayData, monthData, detailedData, graphData] = await Promise.all([
        this.fetchData(ENDPOINTS.today),
        this.fetchData(ENDPOINTS.yesterday),
        this.fetchData(ENDPOINTS.month),
        this.fetchData(ENDPOINTS.detailed(new Date().toISOString(), new Date().toISOString())),
        this.fetchData(ENDPOINTS.graph())
      ]);
      
      this.today = todayData;
      this.yesterday = yesterdayData;
      this.month = monthData;
      this.detailed = detailedData;
      this.graph = graphData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      console.error('Error fetching all stats:', errorMessage);
    } finally {
      keys.forEach(key => {
        this.isLoading[key] = false;
      });
    }
    
    return { 
      today: this.today, 
      yesterday: this.yesterday, 
      month: this.month, 
      detailed: this.detailed,
      graph: this.graph
    };
  }
}

// Create and export a singleton instance
export const statsStore = new StatsStore();
