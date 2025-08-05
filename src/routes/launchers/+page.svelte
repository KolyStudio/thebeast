<script lang="ts">
	import AppFilters from '$lib/components/launchers/AppFilters.svelte';
	import AgentsList from '$lib/components/launchers/AgentsList.svelte';
	import AgentActions from '$lib/components/launchers/AgentActions.svelte';
	import ConsoleLogs from '$lib/components/global/consoleLogs.svelte';
	import AccountsList from '$lib/components/launchers/AccountsList.svelte';
	import SettingsDialog from '$lib/components/launchers/settings/SettingsDialog.svelte';
	import { modelsStore } from '$lib/api/models-helper.js';

	// Types pour une meilleure sécurité de type
	interface AppFilters {
		fruitz: boolean;
		happn: boolean;
		[key: string]: boolean;
	}

	interface LogEntry {
		id: string;
		created: string;
		message: string;
		emoji?: string;
		model_id: string;
	}

	// État réactif
	let appFilters = $state<AppFilters>({ fruitz: true, happn: true });
	let selectedAgentForLogs = $state('');
	let agentLogs = $state<Record<string, LogEntry[]>>({});
	let accounts = $state<any[]>([]);
	let isLoading = $state(false);

	// Variables pour la gestion des intervalles
	let logsInterval: number | undefined;

	// Fonction pour basculer les filtres d'application
	function toggleApp(app: string, value: boolean): void {
		appFilters[app] = value;

		// Si les deux filtres sont désélectionnés, activer celui-ci
		if (!appFilters.fruitz && !appFilters.happn) {
			appFilters[app] = true;
		}
	}

	// Fonction pour obtenir l'heure du dernier log pour un agent
	function getLastLogTime(agentId: string): string {
		const logs = agentLogs[agentId];
		if (!logs || logs.length === 0) {
			return '--:--';
		}

		const lastLog = logs[0]; // Les logs sont déjà triés par ordre décroissant
		if (!lastLog.created) {
			return '--:--';
		}

		try {
			const date = new Date(lastLog.created);
			return date.toLocaleTimeString('fr-FR', {
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			console.error("Erreur lors du formatage de l'heure:", error);
			return 'Aucun log';
		}
	}

	// Fonction pour charger les logs d'un agent
	async function loadAgentLogs(agentId: string): Promise<void> {
		try {
			const logs = await modelsStore.fetchAgentLogs(agentId);
			agentLogs[agentId] = logs;
		} catch (error) {
			console.error(`Erreur lors du chargement des logs pour l'agent ${agentId}:`, error);
		}
	}

	// Fonction pour voir les logs d'un agent
	async function viewAgentLogs(agentId: string): Promise<void> {
		selectedAgentForLogs = agentId;
		await loadAgentLogs(agentId);
	}

	// Fonction pour gérer l'intervalle de mise à jour des logs
	function manageLogsInterval(): void {
		// Nettoyer l'intervalle existant
		if (logsInterval) {
			clearInterval(logsInterval);
			logsInterval = undefined;
		}

		// Créer un nouvel intervalle si un agent est sélectionné
		if (selectedAgentForLogs) {
			logsInterval = window.setInterval(async () => {
				await loadAgentLogs(selectedAgentForLogs);
			}, 10000);
		}
	}

	// Effet pour initialiser les données au montage
	$effect(() => {
		let mounted = true;

		async function initializeData(): Promise<void> {
			if (!mounted) return;

			isLoading = true;
			try {
				// Charger les agents
				await modelsStore.fetchAgents();

				if (!mounted) return;

				// Charger les logs pour tous les agents en parallèle
				const logPromises = modelsStore.agents.map(async (agent) => {
					if (mounted) {
						await loadAgentLogs(agent.id);
					}
				});

				await Promise.all(logPromises);

				// Sélectionner le premier agent si aucun n'est sélectionné
				if (mounted && !selectedAgentForLogs && modelsStore.agents.length > 0) {
					selectedAgentForLogs = modelsStore.agents[0].id;
				}
			} catch (error) {
				console.error('Erreur lors du chargement des données:', error);
			} finally {
				if (mounted) {
					isLoading = false;
				}
			}
		}

		initializeData();

		// Fonction de nettoyage
		return () => {
			mounted = false;
			if (logsInterval) {
				clearInterval(logsInterval);
				logsInterval = undefined;
			}
		};
	});

	// Effet pour gérer l'intervalle de mise à jour des logs
	$effect(() => {
		manageLogsInterval();

		// Nettoyage automatique lors du changement de selectedAgentForLogs
		return () => {
			if (logsInterval) {
				clearInterval(logsInterval);
				logsInterval = undefined;
			}
		};
	});
</script>

<div class="bg-base-100 rounded-xl pb-0.5 md:pb-none">
	<div class="flex w-full">
		<div class="flex flex-col gap-4 w-full"></div>
		<div class="flex flex-col gap-4 w-full">
			<div
				class="flex items-center justify-center px-4 gap-3 bg-muted rounded-b-2xl h-14 w-full mt-2 md:mt-0"
			>
				<div class="flex items-center gap-4">
					<AgentActions />
				</div>
			</div>
		</div>
		<div class="flex justify-end gap-2 items-center rounded-tr-3xl h-20 w-full">
			<SettingsDialog />
		</div>
	</div>

	<div class="m-4 grid grid-cols-12 md:gap-12 -mt-4 md:mt-4">
		<div class="md:col-span-6 col-span-12">
			<!-- Application Filter Bar -->
			<div
				class="mb-2 bg-card rounded-2xl py-0 flex items-center justify-between border border-border"
			>
				<AppFilters {appFilters} onToggleApp={toggleApp} />
			</div>
			<!-- Agent Grid -->
			<AgentsList
				{appFilters}
				selectedAgentId={selectedAgentForLogs}
				onAgentSelect={viewAgentLogs}
				{getLastLogTime}
			/>
		</div>
		<div class="md:col-span-6 col-span-12 mt-4 md:mt-0">
			<ConsoleLogs selectedAgentId={selectedAgentForLogs} />
		</div>
	</div>
</div>

<!-- <div class="my-4">
	<AccountsList {accounts} />
</div> -->

<style>
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
