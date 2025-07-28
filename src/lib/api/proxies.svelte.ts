/**
 * Proxies API service using Svelte 5 runes and Supabase
 */

import { supabase } from '$lib/supabaseClient';

// Types pour les proxies basés sur la table instagram_proxy
export interface Proxy {
  id: number;
  created_at: string;
  host: string;
  port: string;
  username: string;
  password: string;
  type: 'http' | 'https' | 'socks4' | 'socks5';
  user_id: string | null;
  proxy_renew_url: string;
  proxy_renew_port: string;
}

// Interface pour créer/modifier un proxy (sans id et created_at)
export interface ProxyInput {
  host: string;
  port: string;
  username?: string;
  password?: string;
  type: 'http' | 'https' | 'socks4' | 'socks5';
  user_id?: string | null;
  proxy_renew_url?: string;
  proxy_renew_port?: string;
}

// Types pour les réponses et les erreurs
type ApiError = Error | { message: string };

// Create state objects that can be updated
class ProxiesStore {
  proxies = $state<Proxy[]>([]);
  
  isLoading = $state({
    fetch: false,
    create: false,
    update: false,
    delete: false
  });

  errors = $state<Record<string, string | null>>({
    fetch: null,
    create: null,
    update: null,
    delete: null
  });

  /**
   * Méthode générique pour gérer les requêtes API
   */
  private async executeOperation<T>(
    operation: () => Promise<T>,
    operationType: 'fetch' | 'create' | 'update' | 'delete'
  ): Promise<T | null> {
    this.isLoading[operationType] = true;
    this.errors[operationType] = null;
    
    try {
      const result = await operation();
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      this.errors[operationType] = errorMessage;
      console.error(`Error in ${operationType} operation:`, errorMessage);
      return null;
    } finally {
      this.isLoading[operationType] = false;
    }
  }

  /**
   * Récupérer tous les proxies
   */
  async fetchProxies(userId?: string) {
    return this.executeOperation(async () => {
      let query = supabase
        .from('instagram_proxy')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrer par user_id si fourni
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erreur lors de la récupération des proxies: ${error.message}`);
      }

      this.proxies = data || [];
      return data;
    }, 'fetch');
  }

  /**
   * Créer un nouveau proxy
   */
  async createProxy(proxyData: ProxyInput) {
    return this.executeOperation(async () => {
      const { data, error } = await supabase
        .from('instagram_proxy')
        .insert([proxyData])
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la création du proxy: ${error.message}`);
      }

      // Ajouter le nouveau proxy à la liste locale
      if (data) {
        this.proxies = [data, ...this.proxies];
      }

      return data;
    }, 'create');
  }

  /**
   * Mettre à jour un proxy existant
   */
  async updateProxy(id: number, proxyData: Partial<ProxyInput>) {
    return this.executeOperation(async () => {
      const { data, error } = await supabase
        .from('instagram_proxy')
        .update(proxyData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la mise à jour du proxy: ${error.message}`);
      }

      // Mettre à jour le proxy dans la liste locale
      if (data) {
        const index = this.proxies.findIndex(p => p.id === id);
        if (index !== -1) {
          this.proxies[index] = data;
        }
      }

      return data;
    }, 'update');
  }

  /**
   * Supprimer un proxy
   */
  async deleteProxy(id: number) {
    return this.executeOperation(async () => {
      const { error } = await supabase
        .from('instagram_proxy')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erreur lors de la suppression du proxy: ${error.message}`);
      }

      // Supprimer le proxy de la liste locale
      this.proxies = this.proxies.filter(p => p.id !== id);

      return true;
    }, 'delete');
  }

  /**
   * Récupérer un proxy par son ID
   */
  async getProxyById(id: number) {
    return this.executeOperation(async () => {
      const { data, error } = await supabase
        .from('instagram_proxy')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Erreur lors de la récupération du proxy: ${error.message}`);
      }

      return data;
    }, 'fetch');
  }

  /**
   * Tester la connectivité d'un proxy (fonction utilitaire)
   */
  async testProxy(proxy: Proxy) {
    // Cette fonction pourrait être implémentée pour tester la connectivité du proxy
    // Pour l'instant, on simule un test
    return this.executeOperation(async () => {
      // Simulation d'un test de proxy
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Retourner un statut simulé
      return {
        success: Math.random() > 0.3, // 70% de chance de succès
        responseTime: Math.floor(Math.random() * 1000) + 100,
        timestamp: new Date().toISOString()
      };
    }, 'fetch');
  }

  /**
   * Nettoyer les erreurs
   */
  clearErrors() {
    this.errors = {
      fetch: null,
      create: null,
      update: null,
      delete: null
    };
  }

  /**
   * Nettoyer une erreur spécifique
   */
  clearError(operationType: 'fetch' | 'create' | 'update' | 'delete') {
    this.errors[operationType] = null;
  }
}

// Export de l'instance du store
export const proxiesStore = new ProxiesStore();
