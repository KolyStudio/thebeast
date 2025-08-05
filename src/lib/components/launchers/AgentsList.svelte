<script lang="ts">
	import { cn } from '$lib/utils';
	import { PlayIcon, CirclePause } from 'lucide-svelte';
	import { modelsStore } from '$lib/api/models-helper.js';

	// Define the props
	let { appFilters, selectedAgentId, onAgentSelect, getLastLogTime } = $props<{
		appFilters: { fruitz: boolean; happn: boolean };
		selectedAgentId: string;
		onAgentSelect: (agentId: string) => Promise<void>;
		getLastLogTime: (agentId: string) => string;
	}>();

	let isMobile = $state(false);
	let showAllAgents = $state(false);

	// Function to detect if display is mobile on load
	$effect(() => {
		// This runs on mount and on window resize
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
		};

		checkMobile();

		const resizeListener = () => checkMobile();
		window.addEventListener('resize', resizeListener);

		return () => {
			window.removeEventListener('resize', resizeListener);
		};
	});

	// Function to filter agents by application
	function filterAgents(agents) {
		// Show only agents with selected applications
		return agents.filter((agent) => appFilters[agent.application || 'fruitz']);
	}

	// Function to sort agents by application name alphabetically
	function sortAgentsByApplication(agents) {
		return [...agents].sort((a, b) => {
			const appA = (a.application || 'fruitz').toLowerCase();
			const appB = (b.application || 'fruitz').toLowerCase();

			if (appA === appB) {
				// If applications are the same, sort by agent name as secondary criteria
				return (a.name || '').localeCompare(b.name || '');
			}

			return appA.localeCompare(appB);
		});
	}

	// Function to get filtered and sorted agents
	function getFilteredSortedAgents() {
		const filtered = filterAgents(modelsStore.agents);
		return sortAgentsByApplication(filtered);
	}

	// Function to toggle individual application filter
	export function toggleApp(app: string, value: boolean) {
		// Update the selected filter
		appFilters[app] = value;

		// If both filters are deselected, enable the current one
		if (!appFilters.fruitz && !appFilters.happn) {
			appFilters[app] = true;
		}
	}
</script>

<div class="flex flex-col md:block">
	<div class="flex justify-between items-center mb-2 md:hidden">
		<h3 class="font-medium text-sm">
			Agents ({getFilteredSortedAgents().length})
		</h3>
		{#if getFilteredSortedAgents().length > 3}
			<button
				class="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded-md"
				onclick={() => (showAllAgents = !showAllAgents)}
			>
				{showAllAgents ? 'Réduire' : 'Voir tous'}
			</button>
		{/if}
	</div>

	<div
		class={cn(
			'grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2 md:max-h-none overflow-y-auto md:overflow-visible pb-2 md:pb-0',
			showAllAgents ? 'max-h-[600px]' : 'max-h-[320px]'
		)}
	>
		{#each getFilteredSortedAgents() as agent, index}
			{#if showAllAgents || index < 3 || !isMobile}
				<div
					role="button"
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							onAgentSelect(agent.id);
						}
					}}
					class={cn(
						'm-[2px] md:m-0 flex items-center justify-between bg-card rounded-3xl p-2 transition-colors duration-200 cursor-pointer hover:bg-muted border border-border',
						selectedAgentId === agent.id && 'ring-2 ring-white'
					)}
					onclick={() => onAgentSelect(agent.id)}
				>
					<div class="flex items-center gap-2 space-x-4">
						<!-- Play/Pause button -->
						<button
							type="button"
							class={cn(
								'rounded-full p-2 w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer',
								agent.statut === 'started'
									? 'bg-red-400 text-red-900 hover:bg-red-300'
									: 'bg-green-400 text-green-900 hover:bg-green-300'
							)}
							onclick={(e) => {
								e.stopPropagation();
								modelsStore.toggleAgentStatus(agent.id);
							}}
						>
							{#if agent.statut === 'started'}
								<CirclePause class="w-5 h-5" />
							{:else}
								<PlayIcon class="w-5 h-5" />
							{/if}
						</button>

						<!-- Application logo and agent info -->
						<div class="flex items-center gap-2">
							{#if agent.application}
								<div class="flex items-center gap-1">
									<img src="/{agent.application}.png" alt={agent.application} class="w-6 h-6" />
									<img src="/flags/s/FR.svg" alt="Drapeau français" class="w-4 h-3 rounded-sm" />
								</div>
							{/if}

							<!-- Agent information -->
							<div class="flex flex-col items-start text-left">
								<span class="text-xs font-bold">
									#{agent.id}
									{agent.name}
								</span>
							</div>
						</div>
					</div>

					<!-- Time indicator -->
					<div
						class="space-x-2 items-center justify-center h-8 p-2 rounded-xl text-sm font-semibold flex"
					>
						<span class="bg-[#3ebf80] h-2 w-2 rounded-full"></span>
						<span class="">{getLastLogTime(agent.id)}</span>
					</div>
				</div>
			{/if}
		{/each}
	</div>

	{#if !showAllAgents && getFilteredSortedAgents().length > 3 && isMobile}
		<div class="flex justify-center mt-2">
			<button
				class="text-xs text-muted-foreground font-medium px-4 py-2 bg-muted rounded-full flex items-center gap-1 hover:bg-accent hover:text-accent-foreground transition-colors"
				onclick={() => (showAllAgents = true)}
			>
				<span>Voir {getFilteredSortedAgents().length - 3} autres agents</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
				>
			</button>
		</div>
	{/if}
</div>
