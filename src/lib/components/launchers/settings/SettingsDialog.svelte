<script lang="ts">
	import { Settings } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import GeneralSettingsTab from './GeneralSettingsTab.svelte';
	import KeywordsSettingsTab from './KeywordsSettingsTab.svelte';
	import FirstnamesSettingsTab from './FirstnamesSettingsTab.svelte';
	import InstagramSettingsTab from './InstagramSettingsTab.svelte';
	import CreateAgentTab from './CreateAgentTab.svelte';
	import DeleteAgentTab from './DeleteAgentTab.svelte';
	import { Save } from 'lucide-svelte';
	import { modelsStore } from '$lib/api/models-helper.js';
	import { toast } from 'svelte-sonner';

	// État local pour le dialogue
	let selectedTab = $state('general');
	let activeAgent = $state('');
	let isLoading = $state(false);
	let formValues = $state<Record<string, any>>({});
	let originalValues = $state<Record<string, any>>({});
	let agentToDelete = $state('');

	// Valeurs pour un nouvel agent
	let newAgent = $state({
		name: '',
		proxy_type: 'hdc2',
		proxy_port: '',
		proxy_username: '',
		proxy_password: '',
		proxy_renew_address: '',
		proxy_renew_port: '',
		api_sms_activate: '',
		application: 'fruitz',
		prenoms: '',
		instagram_url: '',
		instagram_main_account: '',
		instagram_prenoms: '',
		instagram_pseudos: '',
		instagram_pexemples: '',
		instagram_type: ''
	});

	// Cette fonction sera appelée lorsqu'on change d'agent
	function handleAgentChange(agentId: string) {
		activeAgent = agentId;
		// Ne pas réinitialiser les valeurs si elles existent déjà
		if (!formValues[agentId]) {
			updateFormValues(agentId);
		}
	}

	// Fonction pour mettre à jour les valeurs du formulaire
	function updateFormValues(agentId: string) {
		const agent = modelsStore.agents.find((a) => a.id === agentId);
		if (!agent) return;

		// Si les valeurs existent déjà, ne pas les écraser
		if (formValues[agentId]) return;

		// Garantir que prenoms sont des tableaux, même en cas de valeur nulle
		let prenoms: string[] = [];
		if (agent.prenoms !== undefined && agent.prenoms !== null) {
			prenoms = Array.isArray(agent.prenoms) ? agent.prenoms : [];
		}

		let instagram_prenoms: string[] = [];
		if (agent.instagram_prenoms !== undefined && agent.instagram_prenoms !== null) {
			instagram_prenoms = Array.isArray(agent.instagram_prenoms) ? agent.instagram_prenoms : [];
		}

		let instagram_pseudos_text = '';
		if (agent.instagram_pseudos !== undefined && agent.instagram_pseudos !== null) {
			instagram_pseudos_text = agent.instagram_pseudos.join('\n');
		}

		let instagram_pexemples_text = '';
		if (agent.instagram_pexemples !== undefined && agent.instagram_pexemples !== null) {
			instagram_pexemples_text = agent.instagram_pexemples.join('\n');
		}

		const values = {
			name: agent.name || '',
			proxy_type: agent.proxy_ip?.includes('lte') ? 'lte' : 'hdc2',
			proxy_port: agent.proxy_port || '',
			proxy_username: agent.proxy_username || '',
			proxy_password: agent.proxy_password || '',
			proxy_renew_address: agent.proxy_renew_address || '',
			proxy_renew_port: agent.proxy_renew_port || '',
			api_sms_activate: agent.api_sms_activate || '',
			prenoms: prenoms.join('\n'),
			application: agent.application || 'fruitz',
			instagram_url: agent.instagram_url || '',
			instagram_main_account: agent.instagram_main_account || '',
			instagram_prenoms: instagram_prenoms.join('\n'),
			instagram_pseudos: instagram_pseudos_text,
			instagram_pexemples: instagram_pexemples_text,
			instagram_type: agent.instagram_type || ''
		};

		formValues[agentId] = values;
		originalValues[agentId] = JSON.parse(JSON.stringify(values));

		console.log(`FormValues pour ${agent.name}:`, formValues[agentId]);
	}

	// Fonction pour vérifier si un agent a été modifié
	function hasAgentChanged(agentId: string): boolean {
		if (!formValues[agentId] || !originalValues[agentId]) return false;

		const current = formValues[agentId];
		const original = originalValues[agentId];

		return JSON.stringify(current) !== JSON.stringify(original);
	}

	// Fonction pour sauvegarder les modifications
	async function saveChanges() {
		isLoading = true;
		try {
			// Sauvegarder uniquement les agents modifiés
			for (const agentId in formValues) {
				if (!hasAgentChanged(agentId)) continue;

				const values = formValues[agentId];
				const updates: Record<string, any> = {};

				// Vérifier chaque champ individuellement
				if (values.name && values.name !== modelsStore.agents.find((a) => a.id === agentId)?.name) {
					updates.name = values.name;
				}

				if (values.proxy_type) {
					const newProxyIp =
						values.proxy_type === 'lte' ? 'lte.hypeproxy.host' : 'hdc2.hypeproxy.host';
					if (newProxyIp !== modelsStore.agents.find((a) => a.id === agentId)?.proxy_ip) {
						updates.proxy_ip = newProxyIp;
					}
				}

				if (
					values.proxy_port &&
					values.proxy_port !== modelsStore.agents.find((a) => a.id === agentId)?.proxy_port
				) {
					updates.proxy_port = values.proxy_port;
				}

				if (
					values.proxy_username &&
					values.proxy_username !== modelsStore.agents.find((a) => a.id === agentId)?.proxy_username
				) {
					updates.proxy_username = values.proxy_username;
				}

				if (
					values.proxy_password &&
					values.proxy_password !== modelsStore.agents.find((a) => a.id === agentId)?.proxy_password
				) {
					updates.proxy_password = values.proxy_password;
				}

				if (
					values.proxy_renew_address &&
					values.proxy_renew_address !==
						modelsStore.agents.find((a) => a.id === agentId)?.proxy_renew_address
				) {
					updates.proxy_renew_address = values.proxy_renew_address;
				}

				if (
					values.proxy_renew_port &&
					values.proxy_renew_port !==
						modelsStore.agents.find((a) => a.id === agentId)?.proxy_renew_port
				) {
					updates.proxy_renew_port = values.proxy_renew_port;
				}

				if (
					values.api_sms_activate &&
					values.api_sms_activate !==
						modelsStore.agents.find((a) => a.id === agentId)?.api_sms_activate
				) {
					updates.api_sms_activate = values.api_sms_activate;
				}

				if (
					values.application &&
					values.application !== modelsStore.agents.find((a) => a.id === agentId)?.application
				) {
					updates.application = values.application;
				}

				// Instagram fields
				if (
					values.instagram_url !== undefined &&
					values.instagram_url !== modelsStore.agents.find((a) => a.id === agentId)?.instagram_url
				) {
					updates.instagram_url = values.instagram_url;
				}

				if (
					values.instagram_main_account !== undefined &&
					values.instagram_main_account !==
						modelsStore.agents.find((a) => a.id === agentId)?.instagram_main_account
				) {
					updates.instagram_main_account = values.instagram_main_account;
				}

				if (
					values.instagram_type !== undefined &&
					values.instagram_type !== modelsStore.agents.find((a) => a.id === agentId)?.instagram_type
				) {
					updates.instagram_type = values.instagram_type;
				}

				// Handle instagram_pexemples
				if (values.instagram_pexemples !== undefined) {
					const currentPexemples =
						modelsStore.agents.find((a) => a.id === agentId)?.instagram_pexemples || [];
					const newPexemples = values.instagram_pexemples
						.split('\n')
						.map((p: string) => p.trim())
						.filter((p: string) => p !== '');

					const arraysAreDifferent =
						newPexemples.length !== currentPexemples.length ||
						newPexemples.some((val: string, idx: number) => val !== currentPexemples[idx]);

					if (arraysAreDifferent) {
						updates.instagram_pexemples = newPexemples;
					}
				}

				// Traiter les tableaux uniquement s'ils ont été modifiés
				if (values.prenoms !== undefined) {
					const currentPrenoms = modelsStore.agents.find((a) => a.id === agentId)?.prenoms || [];
					const newPrenoms = values.prenoms
						.split('\n')
						.map((p: string) => p.trim())
						.filter((p: string) => p !== '');

					if (JSON.stringify(currentPrenoms.sort()) !== JSON.stringify(newPrenoms.sort())) {
						updates.prenoms = newPrenoms;
					}
				}

				if (values.instagram_prenoms !== undefined) {
					const currentInstagramPrenoms =
						modelsStore.agents.find((a) => a.id === agentId)?.instagram_prenoms || [];
					const newInstagramPrenoms = values.instagram_prenoms
						.split('\n')
						.map((p: string) => p.trim())
						.filter((p: string) => p !== '');

					if (
						JSON.stringify(currentInstagramPrenoms.sort()) !==
						JSON.stringify(newInstagramPrenoms.sort())
					) {
						updates.instagram_prenoms = newInstagramPrenoms;
					}
				}

				if (values.instagram_pseudos !== undefined) {
					const newPseudos = values.instagram_pseudos
						.split('\n')
						.map((p: string) => p.trim())
						.filter((p: string) => p !== '');

					const currentAgent = modelsStore.agents.find((a) => a.id === agentId);
					const currentPseudos = currentAgent?.instagram_pseudos || [];

					if (JSON.stringify(currentPseudos) !== JSON.stringify(newPseudos)) {
						updates.instagram_pseudos = newPseudos;
					}
				}

				// Ne faire la mise à jour que si des champs ont été modifiés
				if (Object.keys(updates).length > 0) {
					console.log(`Mise à jour de l'agent ${agentId} avec:`, updates);
					await modelsStore.updateAgent(agentId, updates);
					// Mettre à jour les valeurs originales après la sauvegarde
					originalValues[agentId] = JSON.parse(JSON.stringify(formValues[agentId]));

					// Afficher un toast de succès
					const agentName = modelsStore.agents.find((a) => a.id === agentId)?.name || 'Agent';
					toast.success(`Les modifications pour ${agentName} ont été enregistrées.`);
				}
			}

			// Afficher un toast de succès global
			toast.success('Toutes les modifications ont été appliquées avec succès.');
		} catch (error) {
			console.error('Erreur lors de la sauvegarde:', error);
			// Afficher un toast d'erreur
			toast.error('Une erreur est survenue lors de la sauvegarde des modifications.');
		} finally {
			isLoading = false;
		}
	}

	// Fonction pour créer un nouvel agent
	async function createNewAgent() {
		isLoading = true;
		try {
			const agentData = {
				name: newAgent.name,
				statut: 'stopped',
				current: 0,
				objective: 0,
				proxy_ip: newAgent.proxy_type === 'lte' ? 'lte.hypeproxy.host' : 'hdc2.hypeproxy.host',
				proxy_port: newAgent.proxy_port,
				proxy_username: newAgent.proxy_username,
				proxy_password: newAgent.proxy_password,
				proxy_renew_address: newAgent.proxy_renew_address,
				proxy_renew_port: newAgent.proxy_renew_port,
				api_smsactivate: newAgent.api_sms_activate,
				api_sms_activate: newAgent.api_sms_activate,
				application: newAgent.application,
				prenoms: [],
				pseudos: [],
				instagram_url: '',
				instagram_main_account: '',
				instagram_prenoms: [],
				instagram_pseudos: [],
				instagram_type: newAgent.instagram_type || ''
			};

			await modelsStore.addAgent(agentData);
			toast.success('Agent créé avec succès');

			// Réinitialiser le formulaire
			newAgent = {
				name: '',
				proxy_type: 'hdc2',
				proxy_port: '',
				proxy_username: '',
				proxy_password: '',
				proxy_renew_address: '',
				proxy_renew_port: '',
				api_sms_activate: '',
				application: 'fruitz',
				prenoms: '',
				instagram_url: '',
				instagram_main_account: '',
				instagram_prenoms: '',
				instagram_pseudos: '',
				instagram_pexemples: '',
				instagram_type: ''
			};

			// Recharger les agents
			await modelsStore.fetchAgents();
		} catch (error) {
			console.error("Erreur lors de la création de l'agent:", error);
			toast.error("Erreur lors de la création de l'agent");
		} finally {
			isLoading = false;
		}
	}

	// Fonction pour supprimer un agent
	async function deleteAgent() {
		if (!agentToDelete) {
			toast.error('Veuillez sélectionner un agent à supprimer');
			return;
		}

		isLoading = true;
		try {
			await modelsStore.deleteAgent(agentToDelete);
			toast.success('Agent supprimé avec succès');

			// Réinitialiser la sélection
			agentToDelete = '';

			// Recharger les agents
			await modelsStore.fetchAgents();

			// Si l'agent supprimé était l'agent actif, sélectionner le premier agent disponible
			if (activeAgent === agentToDelete && modelsStore.agents.length > 0) {
				activeAgent = modelsStore.agents[0].id;
				updateFormValues(activeAgent);
			}
		} catch (error) {
			console.error("Erreur lors de la suppression de l'agent:", error);
			toast.error("Erreur lors de la suppression de l'agent");
		} finally {
			isLoading = false;
		}
	}

	// Initialisation des valeurs au montage du composant
	function initializeValues() {
		if (modelsStore.agents.length > 0 && !activeAgent) {
			activeAgent = modelsStore.agents[0].id;
			// Initialiser les valeurs du formulaire pour chaque agent
			modelsStore.agents.forEach((agent) => {
				updateFormValues(agent.id);
			});
		}
	}

	$effect(() => {
		if (modelsStore.agents.length > 0) {
			initializeValues();
		}
	});
</script>

<Dialog>
	<DialogTrigger>
		<div
			class=" cursor-pointer hidden md:flex bg-base-200 mr-6 hover:bg-accent text-muted-foreground hover:text-accent-foreground font-medium text-sm rounded-xl space-x-2 items-center justify-center w-10 h-10 transition-colors"
		>
			<Settings class="w-4 h-4" />
		</div>
	</DialogTrigger>
	<DialogContent class="sm:max-w-[900px] p-0 gap-0">
		<div class="flex h-[650px]">
			<!-- Sidebar -->
			<div class="w-64 bg-base-100 p-4 rounded-l-lg">
				<h2 class="text-xl font-semibold px-2 mb-4">Paramètres</h2>
				<nav class="space-y-1">
					<Button
						variant={selectedTab === 'general' ? 'menu' : 'ghost'}
						class="w-full justify-start"
						onclick={() => (selectedTab = 'general')}
					>
						<span class="w-4 h-4 mr-2">👤</span>
						Général
					</Button>
					<Button
						variant={selectedTab === 'keywords' ? 'menu' : 'ghost'}
						class="w-full justify-start"
						onclick={() => (selectedTab = 'keywords')}
					>
						<span class="w-4 h-4 mr-2">📚</span>
						Mots clés
					</Button>
					<Button
						variant={selectedTab === 'firstnames' ? 'menu' : 'ghost'}
						class="w-full justify-start"
						onclick={() => (selectedTab = 'firstnames')}
					>
						<span class="w-4 h-4 mr-2">👤</span>
						Prénoms
					</Button>
					<Button
						variant={selectedTab === 'instagram' ? 'menu' : 'ghost'}
						class="w-full justify-start"
						onclick={() => (selectedTab = 'instagram')}
					>
						<span class="w-4 h-4 mr-2">📸</span>
						Instagram
					</Button>
				</nav>

				<div class="mt-4 pt-4 border-t border-border">
					<Button
						variant={selectedTab === 'create' ? 'menu' : 'ghost'}
						class="w-full justify-start"
						onclick={() => (selectedTab = 'create')}
					>
						<span class="w-4 h-4 mr-2">➕</span>
						Ajouter un agent
					</Button>
					<Button
						variant={selectedTab === 'delete' ? 'menu' : 'ghost'}
						class="w-full justify-start text-destructive hover:text-destructive/90"
						onclick={() => (selectedTab = 'delete')}
					>
						<span class="w-4 h-4 mr-2">⚠️</span>
						Supprimer un agent
					</Button>
				</div>
			</div>

			<!-- Content -->
			<div class="flex-1 p-6 relative overflow-hidden bg-base-100">
				{#if isLoading}
					<div class="absolute inset-0 flex items-center justify-center bg-red-400/80 z-10">
						<div class="h-8 w-8 animate-spin text-muted-foreground">⏳</div>
					</div>
				{/if}

				<div class="h-full overflow-y-auto pr-2">
					{#if selectedTab === 'general'}
						<GeneralSettingsTab
							{activeAgent}
							{formValues}
							{modelsStore}
							onAgentChange={handleAgentChange}
						/>
					{:else if selectedTab === 'keywords'}
						<KeywordsSettingsTab
							{activeAgent}
							{formValues}
							{modelsStore}
							onAgentChange={handleAgentChange}
						/>
					{:else if selectedTab === 'firstnames'}
						<FirstnamesSettingsTab
							{activeAgent}
							{formValues}
							{modelsStore}
							onAgentChange={handleAgentChange}
						/>
					{:else if selectedTab === 'instagram'}
						<InstagramSettingsTab
							{activeAgent}
							{formValues}
							{modelsStore}
							onAgentChange={handleAgentChange}
						/>
					{:else if selectedTab === 'create'}
						<CreateAgentTab {newAgent} onCreate={createNewAgent} />
					{:else if selectedTab === 'delete'}
						<DeleteAgentTab
							{agentToDelete}
							{modelsStore}
							onAgentChange={(id) => (agentToDelete = id)}
							onDelete={deleteAgent}
						/>
					{/if}

					<!-- Single save button at bottom right -->
					{#if selectedTab !== 'create' && selectedTab !== 'delete'}
						<div class="flex justify-end mt-6">
							<Button
								onclick={saveChanges}
								class="bg-white hover:bg-white/90 text-primary-foreground"
							>
								<Save class="w-4 h-4 mr-2" />
								Enregistrer
							</Button>
						</div>
					{/if}
				</div>
			</div>
		</div></DialogContent
	>
</Dialog>
