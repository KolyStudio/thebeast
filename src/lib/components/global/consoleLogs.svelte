<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { modelsStore } from '$lib/api/models-helper.js';

	// Selected agent ID using props rune
	const { selectedAgentId = '' } = $props();

	// Agent logs from Supabase
	let logs = $state([]);
	let isLoading = $state(false);
	let errorCount = $state(0);
	let warningCount = $state(0);
	let agentName = $state('');
	let agentApplication = $state('');

	// Filtres pour les logs
	let showAll = $state(true);
	let showError = $state(false);
	let showWarning = $state(false);

	// Function to load logs for the selected agent
	async function loadAgentLogs() {
		if (!selectedAgentId) return;

		isLoading = true;
		logs = [];

		try {
			const agent = modelsStore.agents.find((a) => a.id === selectedAgentId);
			agentName = agent?.name || '';
			agentApplication = agent?.application || '';
			console.log('Agent sélectionné:', {
				id: agent?.id,
				name: agent?.name,
				application: agent?.application,
				status: agent?.status,
				proxy_type: agent?.proxy_ip?.includes('lte') ? 'lte' : 'hdc2'
			});

			console.log("Chargement des logs pour l'agent ID:", selectedAgentId);
			const agentLogs = await modelsStore.fetchAgentLogs(selectedAgentId);
			console.log('Logs récupérés:', agentLogs);

			if (!agentLogs || agentLogs.length === 0) {
				console.log('Aucun log trouvé pour cet agent');
				return;
			}

			// Check the structure of the first log to debug
			if (agentLogs.length > 0) {
				console.log("Structure d'un log:", Object.keys(agentLogs[0]));
				console.log('Exemple de timestamp:', agentLogs[0].created);
			}

			logs = agentLogs.map((log) => ({
				id: log.id,
				timestamp: formatTimestamp(log.created || new Date().toISOString()),
				message: log.message || 'No message',
				emoji: log.emoji || '',
				model_id: log.model_id
			}));

			// Count errors and warnings
			errorCount = logs.filter((log) => log.emoji && log.emoji.includes('❌')).length;
			warningCount = logs.filter((log) => log.emoji && log.emoji.includes('⚠️')).length;
		} catch (error) {
			console.error('Error loading agent logs:', error);
		} finally {
			isLoading = false;
		}
	}

	// Format timestamp for display
	function formatTimestamp(timestamp) {
		try {
			// Handle Postgres timestamp format: "2025-04-08 13:17:55.319614+00"
			const date = new Date(timestamp);

			if (isNaN(date.getTime())) {
				console.warn('Invalid date detected:', timestamp);
				return timestamp;
			}

			return date.toLocaleTimeString('en-US', {
				hour12: false,
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
		} catch (e) {
			console.error('Error formatting timestamp:', e);
			return timestamp;
		}
	}

	function toggleFilter(filter: string) {
		if (filter === 'all') {
			showAll = true;
			showError = false;
			showWarning = false;
		} else if (filter === 'error') {
			showAll = false;
			showError = true;
			showWarning = false;
		} else if (filter === 'warning') {
			showAll = false;
			showError = false;
			showWarning = true;
		}
	}

	// Watch for changes to selectedAgentId
	$effect(() => {
		console.log('Selected agent ID changed:', selectedAgentId);
		if (selectedAgentId) {
			loadAgentLogs();
		} else {
			// Clear logs if no agent is selected
			logs = [];
			agentName = '';
			agentApplication = '';
		}
	});

	onMount(() => {
		// Initial load if an agent is already selected
		if (selectedAgentId) {
			loadAgentLogs();
		}
	});

	// Function to get filtered logs
	function getFilteredLogs() {
		if (showAll) return logs;
		if (showError) return logs.filter((log) => log.emoji && log.emoji.includes('❌'));
		if (showWarning) return logs.filter((log) => log.emoji && log.emoji.includes('⚠️'));
		return logs;
	}
</script>

<div
	class="bg-base-200 text-foreground w-full h-full max-h-[310px] font-mono text-sm rounded-lg overflow-hidden border border-border"
>
	<div class="flex items-center px-4 py-2 border-b border-border bg-base-200">
		{#if agentName}
			<div class="flex items-center mr-4 text-xs font-bold">
				{#if agentApplication}
					<img src="/{agentApplication}.png" alt="" class="w-4 h-4 mr-2" />
				{/if}
				<span class="">{agentName}</span>
			</div>
		{/if}

		<Button
			variant="ghost"
			class={`text-xs px-3 py-1 h-auto rounded-md mr-2 ${showAll ? 'bg-base-200 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
			onclick={() => toggleFilter('all')}
		>
			Tous les logs <span class="ml-1 opacity-75">{logs.length}</span>
		</Button>

		<Button
			variant="ghost"
			class={`text-xs px-3 py-1 h-auto rounded-md mr-2 ${showError ? 'bg-base-200 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
			onclick={() => toggleFilter('error')}
		>
			Erreurs <span class="ml-1 opacity-75">{errorCount}</span>
		</Button>

		<Button
			variant="ghost"
			class={`text-xs px-3 py-1 h-auto rounded-md ${showWarning ? 'bg-base-200 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
			onclick={() => toggleFilter('warning')}
		>
			Warnings <span class="ml-1 opacity-75">{warningCount}</span>
		</Button>

		<div class="ml-auto">
			<Button
				variant="ghost"
				class="text-white hover:text-white p-1 h-auto"
				onclick={loadAgentLogs}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path
						d="M21 12a9 9 0 0 1-9 9c-4.97 0-9-4.03-9-9s4.03-9 9-9c2.39 0 4.68.94 6.4 2.6l-2.9 2.9h8.5v-8.5l-2.9 2.9C18.94 4.02 15.71 3 12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9"
					></path>
				</svg>
			</Button>
		</div>
	</div>

	<div class="p-2 overflow-auto h-[calc(100%-40px)] custom-scrollbar">
		{#if isLoading}
			<div class="flex justify-center items-center h-full">
				<div class="text-muted-foreground">Chargement des logs...</div>
			</div>
		{:else if logs.length === 0}
			<div class="flex justify-center items-center h-full">
				<div class="text-muted-foreground">
					{selectedAgentId
						? 'Aucun log trouvé pour cet agent'
						: 'Sélectionnez un agent pour voir les logs'}
				</div>
			</div>
		{:else}
			{#each getFilteredLogs() as log}
				<div class="py-0.5 flex items-start">
					<span class="text-muted-foreground w-16 flex-shrink-0">{log.timestamp}</span>
					<span class="text-border flex-shrink-0">|</span>
					{#if log.emoji}
						<span class="mx-1">{log.emoji}</span>
					{/if}
					<span
						class={`flex-1 ${
							log.emoji && log.emoji.includes('❌')
								? 'text-destructive'
								: log.emoji && log.emoji.includes('⚠️')
									? 'text-yellow-500'
									: 'text-foreground'
						}`}
					>
						{log.message}
					</span>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.custom-scrollbar {
		scrollbar-width: thin;
		scrollbar-color: #e5e7eb transparent;
	}

	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: #e5e7eb;
		border-radius: 3px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background-color: #d1d5db;
	}
</style>
