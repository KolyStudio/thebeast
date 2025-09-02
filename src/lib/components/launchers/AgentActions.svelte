<script lang="ts">
	import { PlayIcon, StopCircle } from 'lucide-svelte';
	import { modelsStore } from '$lib/api/models-helper.js';
	import { toast } from 'svelte-sonner';

	// Fonction pour arrêter tous les agents en cours d'exécution
	async function stopAllRunningAgents() {
		try {
			const runningAgents = modelsStore.agents.filter((agent) => agent.statut === 'started');

			if (runningAgents.length === 0) {
				toast.info("Aucun agent en cours d'exécution à arrêter");
				return;
			}

			// Afficher le toast avant de commencer pour feedback immédiat
			toast.info(`Arrêt de ${runningAgents.length} agent${runningAgents.length > 1 ? 's' : ''}...`);

			// Créer un tableau de promesses pour arrêter tous les agents en parallèle
			const stopPromises = runningAgents.map(async (agent) => {
				try {
					await modelsStore.toggleAgentStatus(agent.id);
					// Mise à jour locale sans rechargement complet
					const index = modelsStore.agents.findIndex((a) => a.id === agent.id);
					if (index !== -1) {
						modelsStore.agents[index].statut = 'stopped';
					}
				} catch (error) {
					console.error(`Erreur lors de l'arrêt de l'agent ${agent.id}:`, error);
					throw error;
				}
			});

			await Promise.all(stopPromises);

			toast.success(
				`${runningAgents.length} agent${runningAgents.length > 1 ? 's' : ''} arrêté${runningAgents.length > 1 ? 's' : ''} avec succès`
			);
		} catch (error) {
			console.error("Erreur lors de l'arrêt des agents:", error);
			toast.error("Une erreur est survenue lors de l'arrêt des agents");
		}
	}

	// Fonction pour démarrer tous les agents arrêtés
	async function startAllStoppedAgents() {
		try {
			const stoppedAgents = modelsStore.agents.filter((agent) => agent.statut === 'stopped');

			if (stoppedAgents.length === 0) {
				toast.info('Aucun agent arrêté à démarrer');
				return;
			}

			// Afficher le toast avant de commencer pour feedback immédiat
			toast.info(
				`Démarrage de ${stoppedAgents.length} agent${stoppedAgents.length > 1 ? 's' : ''}...`
			);

			// Créer un tableau de promesses pour démarrer tous les agents en parallèle
			const startPromises = stoppedAgents.map(async (agent) => {
				try {
					await modelsStore.toggleAgentStatus(agent.id);
					// Mise à jour locale sans rechargement complet
					const index = modelsStore.agents.findIndex((a) => a.id === agent.id);
					if (index !== -1) {
						modelsStore.agents[index].statut = 'started';
					}
				} catch (error) {
					console.error(`Erreur lors du démarrage de l'agent ${agent.id}:`, error);
					throw error;
				}
			});

			await Promise.all(startPromises);

			toast.success(
				`${stoppedAgents.length} agent${stoppedAgents.length > 1 ? 's' : ''} démarré${stoppedAgents.length > 1 ? 's' : ''} avec succès`
			);
		} catch (error) {
			console.error('Erreur lors du démarrage des agents:', error);
			toast.error('Une erreur est survenue lors du démarrage des agents');
		}
	}
</script>

<div class="flex items-center gap-4">
	<!-- Island ultra-moderne avec fond transparent -->
	<div
		class="hidden md:flex items-center gap-6 backdrop-blur-sm justify-center rounded-2xl px-5 py-2.5"
	>
		<!-- Agents en marche -->
		<div class="flex items-center gap-2.5">
			<div class="bg-success p-1 rounded-full shadow-sm"></div>
			<div class="text-sm font-medium">
				{modelsStore.agents.filter((a) => a.statut === 'started').length} agents en service
			</div>
		</div>
	</div>

	<!-- Bouton d'arrêt général -->
	<button
		class="backdrop-blur-sm bg-error/30 hover:bg-error/40 text-error/90 rounded-xl px-3.5 h-[38px] flex items-center justify-center transition-all duration-200 cursor-pointer"
		onclick={stopAllRunningAgents}
	>
		<StopCircle class="w-4 h-4" />
	</button>

	<!-- Bouton de démarrage général -->
	<button
		class="backdrop-blur-sm bg-success/30 hover:bg-success/40 text-success/90 rounded-xl px-3.5 h-[38px] flex items-center justify-center transition-all duration-200 cursor-pointer"
		onclick={startAllStoppedAgents}
	>
		<PlayIcon class="w-4 h-4" />
	</button>

	<div
		class="hidden md:flex items-center gap-6 backdrop-blur-sm justify-center rounded-2xl px-5 py-2.5"
	>
		<!-- Agents en marche -->
		<div class="flex items-center gap-2.5">
			<div class="bg-warning p-1 rounded-full shadow-sm"></div>
			<div class="text-sm font-medium">
				{modelsStore.agents.filter((a) => a.status === 'running').length} warnings
			</div>
		</div>
	</div>
</div>
