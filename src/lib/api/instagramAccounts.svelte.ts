/**
 * Instagram Accounts API service using Svelte 5 runes and Supabase
 */

import { supabase } from '$lib/supabaseClient';

// Types pour les comptes Instagram basés sur la table instagram_accounts
export interface InstagramAccount {
  id: number;
  username: string | null;
  password: string | null;
  statut: string | null;
  modele_id: string | null;
  modele_name: string | null;
  application: string | null;
  proxy_ip: string | null;
  proxy_port: string | null;
  proxy_username: string | null;
  proxy_password: string | null;
  proxy_renew_url: string | null;
  proxy_renew_port: string | null;
  user_id: string | null;
  session: any | null;
  changed_username: boolean | null;
  changed_bio: boolean | null;
  changed_photo: boolean | null;
  changed_firstname: boolean | null;
  changed_url: boolean | null;
  changed_statut: boolean | null;
  changed_type: boolean | null;
  challenge_mail: string | null;
  email_password: string | null;
  challenge_password: string | null;
  relogins: string | null;
  last_username_changed: string | null;
  error_message: string | null;
  warmup_phase: number | null;
}

// Interface pour créer/modifier un compte (sans id)
export interface InstagramAccountInput {
  username?: string | null;
  password?: string | null;
  statut?: string | null;
  modele_id?: string | null;
  modele_name?: string | null;
  application?: string | null;
  proxy_ip?: string | null;
  proxy_port?: string | null;
  proxy_username?: string | null;
  proxy_password?: string | null;
  proxy_renew_url?: string | null;
  proxy_renew_port?: string | null;
  user_id?: string | null;
  session?: any | null;
  changed_username?: boolean | null;
  changed_bio?: boolean | null;
  changed_photo?: boolean | null;
  changed_firstname?: boolean | null;
  changed_url?: boolean | null;
  changed_statut?: boolean | null;
  changed_type?: boolean | null;
  challenge_mail?: string | null;
  email_password?: string | null;
  challenge_password?: string | null;
  relogins?: string | null;
  last_username_changed?: string | null;
  error_message?: string | null;
  warmup_phase?: number | null;
}

// Types pour les réponses et les erreurs
type ApiError = Error | { message: string };

// Create state objects that can be updated
class InstagramAccountsStore {
  accounts = $state<InstagramAccount[]>([]);

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
   * Méthode utilitaire pour exécuter des opérations avec gestion d'erreur et de chargement
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
      this.errors[operationType] = errorMessage;
      console.error(`Erreur lors de l'opération ${operationType}:`, error);
      return null;
    } finally {
      this.isLoading[operationType] = false;
    }
  }

  /**
   * Récupérer tous les comptes Instagram
   */
  async fetchAccounts(userId?: string) {
    return this.executeOperation(async () => {
      let query = supabase
        .from('instagram_accounts')
        .select('*')
        .order('id', { ascending: false });

      // Filtrer par user_id si fourni
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erreur lors de la récupération des comptes: ${error.message}`);
      }

      this.accounts = data || [];
      return data;
    }, 'fetch');
  }

  /**
   * Créer un nouveau compte Instagram
   */
  async createAccount(accountData: InstagramAccountInput) {
    return this.executeOperation(async () => {
      const { data, error } = await supabase
        .from('instagram_accounts')
        .insert([accountData])
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la création du compte: ${error.message}`);
      }

      // Ajouter le nouveau compte à la liste locale
      if (data) {
        this.accounts = [data, ...this.accounts];
      }

      return data;
    }, 'create');
  }

  /**
   * Créer plusieurs comptes Instagram en lot
   */
  async createMultipleAccounts(accountsData: InstagramAccountInput[]) {
    return this.executeOperation(async () => {
      const { data, error } = await supabase
        .from('instagram_accounts')
        .insert(accountsData)
        .select();

      if (error) {
        throw new Error(`Erreur lors de la création des comptes: ${error.message}`);
      }

      // Ajouter les nouveaux comptes à la liste locale
      if (data) {
        this.accounts = [...data, ...this.accounts];
      }

      return data;
    }, 'create');
  }

  /**
   * Mettre à jour un compte Instagram existant
   */
  async updateAccount(id: number, accountData: Partial<InstagramAccountInput>) {
    return this.executeOperation(async () => {
      const { data, error } = await supabase
        .from('instagram_accounts')
        .update(accountData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la mise à jour du compte: ${error.message}`);
      }

      // Mettre à jour le compte dans la liste locale
      if (data) {
        const index = this.accounts.findIndex(a => a.id === id);
        if (index !== -1) {
          this.accounts[index] = data;
        }
      }

      return data;
    }, 'update');
  }

  /**
   * Supprimer un compte Instagram
   */
  async deleteAccount(id: number) {
    return this.executeOperation(async () => {
      const { error } = await supabase
        .from('instagram_accounts')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erreur lors de la suppression du compte: ${error.message}`);
      }

      // Supprimer le compte de la liste locale
      this.accounts = this.accounts.filter(a => a.id !== id);

      return true;
    }, 'delete');
  }

  /**
   * Récupérer un compte par son ID
   */
  async getAccountById(id: number) {
    return this.executeOperation(async () => {
      const { data, error } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Erreur lors de la récupération du compte: ${error.message}`);
      }

      return data;
    }, 'fetch');
  }

  /**
   * Filtrer les comptes par statut
   */
  getAccountsByStatus(status: string) {
    return this.accounts.filter(account => account.statut === status);
  }

  /**
   * Obtenir les statistiques des comptes
   */
  getAccountsStats() {
    const total = this.accounts.length;
    const actifs = this.getAccountsByStatus('actif').length;
    const utilises = this.getAccountsByStatus('utilisé').length;
    const nouveaux = this.getAccountsByStatus('nouveau').length;
    const erreurs = this.getAccountsByStatus('erreur').length;
    const bannis = this.getAccountsByStatus('banni').length;

    return {
      total,
      actifs,
      utilises,
      nouveaux,
      erreurs,
      bannis
    };
  }

  /**
   * Nettoyer toutes les erreurs
   */
  clearAllErrors() {
    this.errors.fetch = null;
    this.errors.create = null;
    this.errors.update = null;
    this.errors.delete = null;
  }

  /**
   * Nettoyer une erreur spécifique
   */
  clearError(operationType: 'fetch' | 'create' | 'update' | 'delete') {
    this.errors[operationType] = null;
  }
}

// Export de l'instance du store
export const instagramAccountsStore = new InstagramAccountsStore();
