<script lang="ts">
	import { cn } from '$lib/utils';
	import { PlayIcon, CirclePause } from 'lucide-svelte';
	import { modelsStore } from '$lib/api/models-helper.js';

	export let agent: any;
	export let selected = false;
	export let onClick: (id: string) => void;
	export let lastLogTime: string = '--:--';
</script>

<div
	role="button"
	tabindex="0"
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick(agent.id);
		}
	}}
	class={cn(
		'm-[2px] md:m-0 flex items-center justify-between bg-gray-50 rounded-3xl p-2 transition-colors duration-200 cursor-pointer hover:bg-gray-100',
		selected && 'ring-2 ring-gray-300'
	)}
	onclick={() => onClick(agent.id)}
>
	<div class="flex items-center gap-2 space-x-4">
		<!-- Bouton Play/Pause -->
		<button
			type="button"
			class={cn(
				'rounded-full p-2 w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer',
				agent.statut === 'started'
					? 'bg-red-200 text-red-700 hover:bg-red-300'
					: 'bg-green-200 text-green-700 hover:bg-green-300'
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

		<!-- Logo d'application et infos de l'agent -->
		<div class="flex items-center gap-2">
			{#if agent.application}
				<div class="flex items-center gap-1">
					<img src="/{agent.application}.png" alt={agent.application} class="w-6 h-6" />
					<img src="/flags/s/FR.svg" alt="Drapeau français" class="w-4 h-3 rounded-sm" />
				</div>
			{/if}

			<!-- Informations de l'agent -->
			<div class="flex flex-col items-start text-left">
				<span class="text-xs font-bold">
					#{agent.id}
					{agent.name}
				</span>
			</div>
		</div>
	</div>

	<!-- Indicateur d'heure -->
	<div class="space-x-2 items-center justify-center h-8 p-2 rounded-xl text-sm font-semibold flex">
		<span class="bg-[#3ebf80] h-2 w-2 rounded-full"></span>
		<span class="">{lastLogTime}</span>
	</div>
</div>
