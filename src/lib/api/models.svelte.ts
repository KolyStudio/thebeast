import { supabase } from '$lib/supabaseClient';
import { toast } from "svelte-sonner";

export interface Agent {
  id: string;
  name: string;
  status: string;
  statut: string;
  current: number;
  objective: number;
  proxy_ip: string;
  proxy_port: string;
  proxy_username: string;
  proxy_password: string;
  proxy_renew_address: string;
  proxy_renew_port: string;
  api_sms_activate: string;
  application: string;
  prenoms: string[];
  pseudos: string[];
  keywords: string[];
  created: string;
  updated_at: string;
  user_id?: string;
  instagram_url?: string;
  instagram_main_account?: string;
  instagram_prenoms?: string[];
  instagram_pseudos?: string[];
  instagram_pexemples?: string[];
  instagram_type?: string;
}

// Variable pour stocker l'ID de l'agent sélectionné pour les logs
let selectedAgentId = "";

class ModelsStore {
  agents = $state<Agent[]>([]);
  isLoading = $state(false);
  error = $state<string | null>(null);

  // Fonction utilitaire pour parser des chaînes en tableaux
  private parseStringArray(str: any): string[] {
    console.log("parseStringArray - entrée:", str, "type:", typeof str);
    
    // Si c'est null, undefined ou vide
    if (str === null || str === undefined || str === '') {
      console.log("parseStringArray - valeur vide, retour tableau vide");
      return [];
    }
    
    // Si c'est déjà un tableau, retourner directement
    if (Array.isArray(str)) {
      console.log("parseStringArray - déjà un tableau:", str);
      return str;
    }
    
    try {
      // Pour les chaînes de caractères
      if (typeof str === 'string') {
        // Essayer de parser comme JSON si c'est au format JSON
        if ((str.startsWith('[') && str.endsWith(']')) || (str.startsWith('{') && str.endsWith('}'))) {
          try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) {
              console.log("parseStringArray - parsé avec succès comme tableau JSON:", parsed);
              return parsed;
            } else if (parsed && typeof parsed === 'object') {
              // Si c'est un objet mais pas un tableau, extraire les valeurs
              console.log("parseStringArray - parsé comme objet, extraction des valeurs");
              return Object.values(parsed).map(val => String(val));
            }
          } catch (jsonError) {
            console.warn("Erreur de parsing JSON:", jsonError, "pour la chaîne:", str);
          }
        }
        
        // Si ce n'est pas du JSON valide, traiter comme une liste séparée par des virgules
        const result = str.split(',').map(s => s.trim()).filter(s => s !== '');
        console.log("parseStringArray - traité comme liste séparée par virgules:", result);
        return result;
      }
      
      // Pour les autres types, convertir en chaîne
      console.warn("Type inattendu pour parseStringArray:", typeof str);
      const strValue = String(str);
      const result = strValue.split(',').map(s => s.trim()).filter(s => s !== '');
      console.log("parseStringArray - converti en chaîne puis splitté:", result);
      return result;
    } catch (e) {
      console.error("Erreur dans parseStringArray:", e, "pour la valeur:", str);
      return [];
    }
  }

  async fetchAgents() {
    this.isLoading = true;
    this.error = null;

    try {
      const { data, error } = await supabase
        .from('models')
        .select('*');

      if (error) throw error;

      console.log('Données brutes de Supabase:', data);
      
      // Log fields specifically for debugging
      if (data && data.length > 0) {
        console.log('Premier agent - keywords:', data[0].keywords, 'Type:', typeof data[0].keywords);
        console.log('Premier agent - modele_prenoms:', data[0].modele_prenoms, 'Type:', typeof data[0].modele_prenoms);
      }

      // Transformer les données pour les adapter au modèle Agent
      this.agents = data.map((item: any) => {
        // Traitement spécifique pour les keywords
        let itemKeywords = item.modele_pseudos;
        console.log('Keywords bruts de la base de données:', itemKeywords, 'type:', typeof itemKeywords);
        
        // Si keywords est null ou undefined, utiliser un tableau vide
        const keywords = this.parseStringArray(itemKeywords);
        console.log('Keywords après parsing:', keywords);
        
        // Log pour les prénoms aussi
        let itemPrenoms = item.modele_prenoms;
        console.log('Prénoms bruts de la base de données:', itemPrenoms, 'type:', typeof itemPrenoms);
        
        return {
          id: item.id,
          name: item.name,
          status: item.status,
          statut: item.statut,
          current: item.current,
          objective: item.objectif,
          prenoms: this.parseStringArray(itemPrenoms),
          pseudos: this.parseStringArray(item.modele_pseudos),
          keywords: keywords,
          proxy_ip: item.proxy_ip,
          proxy_port: item.proxy_port,
          proxy_username: item.proxy_username,
          proxy_password: item.proxy_password,
          proxy_renew_address: item.proxy_renew_address,
          proxy_renew_port: item.proxy_renew_port,
          api_sms_activate: item.api_smsactivate,
          application: item.application,
          created: item.created,
          updated_at: item.updated_at,
          instagram_url: item.instagram_url || "",
          instagram_main_account: item.instagram_main_account || "",
          instagram_prenoms: this.parseStringArray(item.instagram_prenoms),
          instagram_pseudos: this.parseStringArray(item.instagram_pseudos),
          instagram_pexemples: this.parseStringArray(item.instagram_pexemples),
          instagram_type: item.instagram_type || ""
        };
      });
      
      console.log('Agents chargés:', this.agents);
      // Log du premier agent pour vérifier
      if (this.agents.length > 0) {
        console.log('Premier agent après transformation - keywords:', this.agents[0].keywords);
        console.log('Premier agent après transformation - prenoms:', this.agents[0].prenoms);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Erreur lors de la récupération des agents';
      console.error('Erreur lors de la récupération des agents:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>) {
    this.isLoading = true;
    this.error = null;

    try {
      console.log('Mise à jour de l\'agent avec les données:', updates);
      
      // Récupérer l'agent actuel pour comparer les valeurs
      let currentAgent = this.agents.find(a => a.id === id);
      
      // Si l'agent n'est pas dans le store local, essayer de le récupérer de la base de données
      if (!currentAgent) {
        const { data, error } = await supabase
          .from('models')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        if (!data) throw new Error('Agent non trouvé dans la base de données');
        
        // Convertir les données de la base en format Agent
        currentAgent = {
          id: data.id,
          name: data.name,
          status: data.status,
          statut: data.statut,
          current: data.current,
          objective: data.objectif,
          prenoms: this.parseStringArray(data.modele_prenoms),
          pseudos: this.parseStringArray(data.modele_pseudos),
          keywords: this.parseStringArray(data.keywords),
          proxy_ip: data.proxy_ip,
          proxy_port: data.proxy_port,
          proxy_username: data.proxy_username,
          proxy_password: data.proxy_password,
          proxy_renew_address: data.proxy_renew_address,
          proxy_renew_port: data.proxy_renew_port,
          api_sms_activate: data.api_smsactivate,
          application: data.application,
          created: data.created,
          updated_at: data.updated_at,
          instagram_url: data.instagram_url || "",
          instagram_main_account: data.instagram_main_account || "",
          instagram_prenoms: this.parseStringArray(data.instagram_prenoms),
          instagram_pseudos: this.parseStringArray(data.instagram_pseudos),
          instagram_pexemples: this.parseStringArray(data.instagram_pexemples),
          instagram_type: data.instagram_type || ""
        };
      }

      // Préparer les données pour Supabase
      const supabaseData: Record<string, any> = {};
      
      // Comparer et ajouter uniquement les champs modifiés
      if (updates.name !== undefined && updates.name !== currentAgent.name) {
        supabaseData.name = updates.name;
      }
      
      if (updates.status !== undefined && updates.status !== currentAgent.status) {
        supabaseData.status = updates.status;
      }
      
      if (updates.statut !== undefined && updates.statut !== currentAgent.statut) {
        supabaseData.statut = updates.statut;
      }
      
      if (updates.current !== undefined && updates.current !== currentAgent.current) {
        supabaseData.current = updates.current;
      }
      
      if (updates.objective !== undefined && updates.objective !== currentAgent.objective) {
        supabaseData.objectif = updates.objective;
      }
      
      if (updates.proxy_ip !== undefined && updates.proxy_ip !== currentAgent.proxy_ip) {
        supabaseData.proxy_ip = updates.proxy_ip;
      }
      
      if (updates.proxy_port !== undefined && updates.proxy_port !== currentAgent.proxy_port) {
        supabaseData.proxy_port = updates.proxy_port;
      }
      
      if (updates.proxy_username !== undefined && updates.proxy_username !== currentAgent.proxy_username) {
        supabaseData.proxy_username = updates.proxy_username;
      }
      
      if (updates.proxy_password !== undefined && updates.proxy_password !== currentAgent.proxy_password) {
        supabaseData.proxy_password = updates.proxy_password;
      }
      
      if (updates.proxy_renew_address !== undefined && updates.proxy_renew_address !== currentAgent.proxy_renew_address) {
        supabaseData.proxy_renew_address = updates.proxy_renew_address;
      }
      
      if (updates.proxy_renew_port !== undefined && updates.proxy_renew_port !== currentAgent.proxy_renew_port) {
        supabaseData.proxy_renew_port = updates.proxy_renew_port;
      }
      
      if (updates.api_sms_activate !== undefined && updates.api_sms_activate !== currentAgent.api_sms_activate) {
        supabaseData.api_smsactivate = updates.api_sms_activate;
      }
      
      if (updates.application !== undefined && updates.application !== currentAgent.application) {
        supabaseData.application = updates.application;
      }
      
      // Comparer les tableaux
      if (updates.prenoms !== undefined) {
        const currentPrenoms = currentAgent.prenoms || [];
        const newPrenoms = Array.isArray(updates.prenoms) ? updates.prenoms : this.parseStringArray(updates.prenoms);
        
        if (JSON.stringify(currentPrenoms.sort()) !== JSON.stringify(newPrenoms.sort())) {
          supabaseData.modele_prenoms = `{${newPrenoms.join(',')}}`;
        }
      }
      
      if (updates.pseudos !== undefined) {
        const currentPseudos = currentAgent.pseudos || [];
        const newPseudos = Array.isArray(updates.pseudos) ? updates.pseudos : this.parseStringArray(updates.pseudos);
        
        if (JSON.stringify(currentPseudos.sort()) !== JSON.stringify(newPseudos.sort())) {
          supabaseData.modele_pseudos = `{${newPseudos.join(',')}}`;
        }
      }
      
      if (updates.keywords !== undefined) {
        const currentKeywords = currentAgent.keywords || [];
        const newKeywords = Array.isArray(updates.keywords) ? updates.keywords : this.parseStringArray(updates.keywords);
        
        if (JSON.stringify(currentKeywords.sort()) !== JSON.stringify(newKeywords.sort())) {
          supabaseData.modele_pseudos = `{${newKeywords.join(',')}}`;
        }
      }

      // Instagram fields
      if (updates.instagram_url !== undefined) {
        supabaseData.instagram_url = updates.instagram_url;
      }

      if (updates.instagram_main_account !== undefined) {
        supabaseData.instagram_main_account = updates.instagram_main_account;
      }

      if (updates.instagram_prenoms !== undefined) {
        const currentInstagramPrenoms = currentAgent.instagram_prenoms || [];
        const newInstagramPrenoms = Array.isArray(updates.instagram_prenoms) 
          ? updates.instagram_prenoms 
          : this.parseStringArray(updates.instagram_prenoms);
        
        if (JSON.stringify(currentInstagramPrenoms.sort()) !== JSON.stringify(newInstagramPrenoms.sort())) {
          supabaseData.instagram_prenoms = `{${newInstagramPrenoms.join(',')}}`;
        }
      }
      
      if (updates.instagram_pseudos !== undefined) {
        const currentInstagramPseudos = currentAgent.instagram_pseudos || [];
        const newInstagramPseudos = Array.isArray(updates.instagram_pseudos) 
          ? updates.instagram_pseudos 
          : this.parseStringArray(updates.instagram_pseudos);
        
        if (JSON.stringify(currentInstagramPseudos.sort()) !== JSON.stringify(newInstagramPseudos.sort())) {
          supabaseData.instagram_pseudos = `{${newInstagramPseudos.join(',')}}`;
        }
      }

      if (updates.instagram_type !== undefined && updates.instagram_type !== currentAgent.instagram_type) {
        supabaseData.instagram_type = updates.instagram_type;
      }

      // Update instagram_pexemples if it has changed
      if (updates.instagram_pexemples !== undefined) {
        // Convert to array format for PostgreSQL
        const newInstagramPexemples = Array.isArray(updates.instagram_pexemples) 
          ? updates.instagram_pexemples 
          : updates.instagram_pexemples.split('\n').map(s => s.trim()).filter(s => s);
          
        // Check if the arrays are different
        const currentPexemples = currentAgent.instagram_pexemples || [];
        const arraysAreDifferent = 
          newInstagramPexemples.length !== currentPexemples.length || 
          newInstagramPexemples.some((val, idx) => val !== currentPexemples[idx]);
          
        if (arraysAreDifferent) {
          // Store as PostgreSQL array
          supabaseData.instagram_pexemples = `{${newInstagramPexemples.join(',')}}`;
        }
      }

      // Si aucun champ n'a été modifié, ne pas faire de mise à jour
      if (Object.keys(supabaseData).length === 0) {
        console.log('Aucune modification détectée');
        return { success: true };
      }

      console.log('Données modifiées envoyées à Supabase:', supabaseData);

      const { error } = await supabase
        .from('models')
        .update(supabaseData)
        .eq('id', id);

      if (error) throw error;

      // Mettre à jour le store local
      await this.fetchAgents();
      
      return { success: true };
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'agent';
      console.error('Erreur lors de la mise à jour de l\'agent:', err);
      throw err;
    } finally {
      this.isLoading = false;
    }
  }

  async addAgent(agent: Omit<Agent, 'id' | 'created' | 'updated_at'>) {
    this.isLoading = true;
    this.error = null;

    try {
      const supabaseData = {
        name: agent.name,
        status: agent.status || 'stopped',
        statut: agent.statut || 'stopped',
        current: agent.current || 0,
        objectif: agent.objective || 0,
        proxy_ip: agent.proxy_ip || '',
        proxy_port: agent.proxy_port || '',
        proxy_username: agent.proxy_username || '',
        proxy_password: agent.proxy_password || '',
        proxy_renew_address: agent.proxy_renew_address || '',
        proxy_renew_port: agent.proxy_renew_port || '',
        api_smsactivate: agent.api_sms_activate || '',
        application: agent.application || 'fruitz',
        modele_prenoms: Array.isArray(agent.prenoms) ? agent.prenoms : [],
        modele_pseudos: Array.isArray(agent.pseudos) ? agent.pseudos : [],
        keywords: Array.isArray(agent.keywords) ? agent.keywords : [],
        instagram_url: agent.instagram_url || '',
        instagram_main_account: agent.instagram_main_account || '',
        instagram_prenoms: Array.isArray(agent.instagram_prenoms) ? agent.instagram_prenoms : [],
        instagram_pseudos: Array.isArray(agent.instagram_pseudos) ? agent.instagram_pseudos : [],
        instagram_pexemples: Array.isArray(agent.instagram_pexemples) ? agent.instagram_pexemples : [],
        instagram_type: agent.instagram_type || '',
      };

      const { data, error } = await supabase
        .from('models')
        .insert(supabaseData)
        .select();

      if (error) throw error;

      // Mettre à jour le store local
      await this.fetchAgents();
      
      return { success: true, data: data[0] };
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de l\'agent';
      console.error('Erreur lors de l\'ajout de l\'agent:', err);
      throw err;
    } finally {
      this.isLoading = false;
    }
  }

  // Méthode pour obtenir un agent par son ID
  async getAgentById(id: string): Promise<Agent> {
    // Vérifier d'abord dans le cache local
    const cachedAgent = this.agents.find(agent => agent.id === id);
    if (cachedAgent) return cachedAgent;

    // Si l'agent n'est pas dans le cache, faire une requête à Supabase
    this.isLoading = true;
    this.error = null;

    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Agent non trouvé');

      const agent: Agent = {
        id: data.id,
        name: data.name,
        status: data.status,
        statut: data.statut,
        current: data.current,
        objective: data.objectif,
        prenoms: this.parseStringArray(data.modele_prenoms),
        pseudos: this.parseStringArray(data.modele_pseudos),
        keywords: this.parseStringArray(data.keywords),
        proxy_ip: data.proxy_ip,
        proxy_port: data.proxy_port,
        proxy_username: data.proxy_username,
        proxy_password: data.proxy_password,
        proxy_renew_address: data.proxy_renew_address,
        proxy_renew_port: data.proxy_renew_port,
        api_sms_activate: data.api_smsactivate,
        application: data.application,
        created: data.created,
        updated_at: data.updated_at,
        instagram_url: data.instagram_url || "",
        instagram_main_account: data.instagram_main_account || "",
        instagram_prenoms: this.parseStringArray(data.instagram_prenoms),
        instagram_pseudos: this.parseStringArray(data.instagram_pseudos),
        instagram_pexemples: this.parseStringArray(data.instagram_pexemples),
        instagram_type: data.instagram_type || ""
      };

      return agent;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Erreur lors de la récupération de l\'agent';
      console.error('Erreur lors de la récupération de l\'agent:', err);
      throw err;
    } finally {
      this.isLoading = false;
    }
  }

  async deleteAgent(id: string): Promise<{ success: boolean }> {
    this.isLoading = true;
    this.error = null;

    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Mettre à jour le store local
      this.agents = this.agents.filter(agent => agent.id !== id);
      
      return { success: true };
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'agent';
      console.error('Erreur lors de la suppression de l\'agent:', err);
      throw err;
    } finally {
      this.isLoading = false;
    }
  }

  // Function to fetch logs for a specific agent
  async fetchAgentLogs(modelId: string) {
    try {
      const { data, error } = await supabase
        .from('logs_models')
        .select('id, message, emoji, created, model_id')
        .eq('model_id', modelId)
        .order('id', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching logs for agent:', error);
      return [];
    }
  }

  /**
   * Change le statut d'un agent (démarrage/arrêt), gère les logs et communique avec le serveur
   * @param agentId - L'identifiant de l'agent à modifier
   * @returns Une promesse qui se résout lorsque l'opération est terminée
   */
  async toggleAgentStatus(agentId: string) {
    // Trouver l'agent dans la liste
    const agent = this.agents.find((a) => a.id === agentId);
    if (!agent) {
      console.error(`Agent avec ID ${agentId} non trouvé`);
      return { success: false, error: 'Agent non trouvé' };
    }

    // Déterminer le nouveau statut (inverse du statut actuel)
    const newStatus = agent.statut === 'started' ? 'stopped' : 'started';
    const previousStatus = agent.statut;
    
    try {
      // 1. Mettre à jour le statut de manière optimiste
      const agentIndex = this.agents.findIndex((a) => a.id === agentId);
      if (agentIndex !== -1) {
        this.agents[agentIndex].statut = newStatus;
      }
      
      // Informer l'utilisateur que l'action est en cours
      const actionText = newStatus === 'started' ? 'Démarrage' : 'Arrêt';
      toast.info(`${actionText} de l'agent ${agent.name} en cours...`);
      
      if (newStatus === 'started') {
        // 2. Si on démarre l'agent, supprimer d'abord les logs existants
        try {
          const { data: logsToDelete, error } = await supabase
            .from('logs_models')
            .select('id')
            .eq('model_id', agentId);
            
          if (error) throw error;
          
          if (logsToDelete && logsToDelete.length > 0) {
            await supabase
              .from('logs_models')
              .delete()
              .in('id', logsToDelete.map(log => log.id));
              
            console.log(`${logsToDelete.length} logs supprimés pour l'agent ${agentId}`);
          }
        } catch (error) {
          console.error('Erreur lors de la suppression des logs:', error);
          // On continue malgré cette erreur
        }
        
        // 3. Mise à jour du statut dans la base de données
        await supabase
          .from('models')
          .update({ 
            statut: 'started', 
          })
          .eq('id', agentId);
        
        // 4. Lancer le serveur pour cet agent
        try {
          // Déterminer le bon port en fonction de l'application
          const serverPort = agent.application === 'happn' ? '3002' : '3001';
          const serverUrl = `http://localhost:${serverPort}`;
          const endpoint = agent.application === 'happn' ? 'createHappn' : 'createFruitz';
          
          console.log(`Démarrage de l'agent ${agent.name} (${agent.application}) sur le port ${serverPort}`);
          
          const response = await fetch(`${serverUrl}/${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sentModelId: agentId,
              sentUserId: 'default'
            })
          });
          
          if (!response.ok) {
            throw new Error(`Le serveur a répondu avec le statut: ${response.status}`);
          }
          
          console.log(`Agent ${agent.name} démarré avec succès`);
          toast.success(`Agent ${agent.name} démarré avec succès`);
          
          // Recharger les logs pour mettre à jour l'interface
          if (agentId === selectedAgentId) {
            await this.fetchAgentLogs(agentId);
          }
          
          return { success: true };
        } catch (error) {
          console.error('Erreur lors du démarrage du serveur:', error);
          
          // Ajouter un log d'erreur
          await this.addModelLog(
            'La connexion au serveur a échoué', 
            '❌', 
            agentId,
            agent.application || 'fruitz'
          );
          
          // Remettre le statut à stopped en cas d'échec
          await supabase
            .from('models')
            .update({ statut: 'stopped' })
            .eq('id', agentId);
            
          // Mettre à jour l'état local
          if (agentIndex !== -1) {
            this.agents[agentIndex].statut = 'stopped';
          }
          
          toast.error(`Erreur lors du démarrage de l'agent ${agent.name}`);
          return { success: false, error: error.message };
        }
      } else {
        // Si on arrête l'agent
        try {
          // 1. Appeler l'endpoint pour arrêter le processus côté serveur
          // Déterminer le bon port en fonction de l'application
          const serverPort = agent.application === 'happn' ? '3002' : '3001';
          const serverUrl = `http://localhost:${serverPort}`;
          
          console.log(`Arrêt de l'agent ${agent.name} (${agent.application}) sur le port ${serverPort}`);
          
          const response = await fetch(`${serverUrl}/stop`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              stopModelId: agentId,
              stopUserId: 'default'
            })
          });
          
          if (!response.ok) {
            throw new Error(`Le serveur a répondu avec le statut: ${response.status}`);
          }
          
          // 2. Mettre à jour le statut dans la base de données
          await supabase
            .from('models')
            .update({ 
              statut: 'stopped',
            })
            .eq('id', agentId);
            
          console.log(`Agent ${agent.name} arrêté avec succès`);
          toast.success(`Agent ${agent.name} arrêté avec succès`);
          
          // Recharger les logs pour mettre à jour l'interface
          if (agentId === selectedAgentId) {
            await this.fetchAgentLogs(agentId);
          }
          
          return { success: true };
        } catch (error) {
          console.error(`Erreur lors de l'arrêt de l'agent:`, error);
          
          // Ajouter un log d'erreur
          await this.addModelLog(
            'La connexion au serveur a échoué', 
            '❌', 
            agentId,
            agent.application || 'fruitz'
          );
          
          // Forcer le statut à stopped dans la base de données malgré l'erreur
          // car on préfère être dans un état cohérent
          await supabase
            .from('models')
            .update({ statut: 'stopped' })
            .eq('id', agentId);
            
          toast.error(`Erreur lors de l'arrêt de l'agent ${agent.name}`);
          return { success: false, error: error.message };
        }
      }
    } catch (error) {
      console.error('Erreur générale:', error);
      
      // Restaurer l'état précédent en cas d'erreur
      const agentIndex = this.agents.findIndex((a) => a.id === agentId);
      if (agentIndex !== -1) {
        this.agents[agentIndex].statut = previousStatus;
      }
      
      toast.error(`Une erreur est survenue lors du traitement de l'agent ${agent.name}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ajoute un log pour un agent
   */
  async addModelLog(message: string, emoji: string, modelId: string, application: string) {
    try {
      const { data, error } = await supabase.from('logs_models').insert({
        message,
        emoji,
        model_id: modelId,
        application
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du log:', error);
      return null;
    }
  }
}

// Créer et exporter une instance singleton
export const modelsStore = new ModelsStore(); 
