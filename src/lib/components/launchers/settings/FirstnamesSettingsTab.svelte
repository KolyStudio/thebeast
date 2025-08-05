<script lang="ts">
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { User } from 'lucide-svelte';

	let { activeAgent, formValues, modelsStore, onAgentChange } = $props<{
		activeAgent: string;
		formValues: Record<string, any>;
		modelsStore: any;
		onAgentChange: (id: string) => void;
	}>();
</script>

<div class="space-y-6">
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<div class="w-48">
				<Select.Root type="single" value={activeAgent} onValueChange={onAgentChange}>
					<Select.Trigger
						class="w-full ring-0 focus:ring-0 focus:ring-transparent hover:bg-gray-100"
					>
						{#if modelsStore.agents.find((a: any) => a.id === activeAgent)}
							<div class="flex items-center gap-2">
								{#if modelsStore.agents.find((a: any) => a.id === activeAgent)?.application}
									<img
										src="/{modelsStore.agents.find((a: any) => a.id === activeAgent)
											?.application}.png"
										alt=""
										class="w-4 h-4"
									/>
								{/if}
								{modelsStore.agents.find((a: any) => a.id === activeAgent)?.name ||
									'Sélectionner un agent'}
							</div>
						{:else}
							Sélectionner un agent
						{/if}
					</Select.Trigger>
					<Select.Content>
						{#each modelsStore.agents as agent}
							<Select.Item value={agent.id} class=" hover:bg-base-200 cursor-pointer">
								<div class="flex items-center gap-2">
									{#if agent.application}
										<img src="/{agent.application}.png" alt="" class="w-4 h-4" />
									{/if}
									{agent.name}
								</div>
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	</div>

	{#each modelsStore.agents as agent}
		{#if formValues[agent.id] && agent.id === activeAgent}
			<div class="bg-base-200 rounded-xl p-4 relative">
				<div
					class="text-sm font-bold absolute -top-6 p-2 px-4 right-0 bg-base-200 rounded-t-xl flex space-x-2"
				>
					{#if formValues[agent.id].application}
						<img src="/{formValues[agent.id].application}.png" alt="" class="w-5 h-5" />
					{/if}
					<div>{agent.name}</div>
				</div>
				<div class="space-y-4">
					<div class="flex items-center space-x-2">
						<User class="w-5 h-5" />
						<h4 class="text-base font-medium">Prénoms</h4>
					</div>
					<p class="text-sm text-muted-foreground mb-2">Entrez vos prénoms, un par ligne.</p>
					<Textarea
						placeholder="Entrez vos prénoms ici, un par ligne"
						rows={10}
						class="font-mono text-sm resize-none bg-white"
						bind:value={formValues[agent.id].prenoms}
					/>
				</div>
			</div>
		{/if}
	{/each}
</div>
