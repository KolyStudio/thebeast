<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import { AlertTriangle } from 'lucide-svelte';

	let { agentToDelete, modelsStore, onAgentChange, onDelete } = $props<{
		agentToDelete: string;
		modelsStore: any;
		onAgentChange: (id: string) => void;
		onDelete: () => Promise<void>;
	}>();
</script>

<div class="space-y-6">
	<div class="bg-base-200 rounded-xl p-4">
		<div class="space-y-6">
			<div class="flex items-center space-x-2 text-error">
				<AlertTriangle class="w-5 h-5" />
				<h4 class="text-base font-medium">Supprimer un agent</h4>
			</div>
			<p class="text-sm text-muted-foreground mb-4">
				Attention : Cette action est irréversible. Toutes les données associées à cet agent seront
				définitivement supprimées.
			</p>

			<div class="grid grid-cols-2 gap-8 items-center">
				<div>
					<h4 class="text-base font-medium">Sélectionner un agent</h4>
					<p class="text-sm text-muted-foreground">Choisissez l'agent à supprimer.</p>
				</div>
				<Select.Root type="single" value={agentToDelete} onValueChange={onAgentChange}>
					<Select.Trigger
						class="w-full ring-0 focus:ring-0 focus:ring-transparent hover:bg-gray-100"
					>
						{#if agentToDelete && modelsStore.agents.find((a: any) => a.id === agentToDelete)}
							<div class="flex items-center gap-2">
								<AlertTriangle class="w-4 h-4 text-error" />
								{#if modelsStore.agents.find((a: any) => a.id === agentToDelete)?.application}
									<img
										src="/{modelsStore.agents.find((a: any) => a.id === agentToDelete)
											?.application}.png"
										alt=""
										class="w-4 h-4"
									/>
								{/if}
								{modelsStore.agents.find((a: any) => a.id === agentToDelete)?.name ||
									'Sélectionner un agent'}
							</div>
						{:else}
							Sélectionner un agent
						{/if}
					</Select.Trigger>
					<Select.Content>
						{#each modelsStore.agents as agent}
							<Select.Item value={agent.id} class="hover:bg-base-200 cursor-pointer">
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

			<div class="flex justify-end mt-6">
				<Button
					onclick={onDelete}
					class="bg-error/30 hover:bg-error/30 text-error/90"
					disabled={!agentToDelete}
				>
					<AlertTriangle class="w-4 h-4 mr-2" />
					Supprimer l'agent
				</Button>
			</div>
		</div>
	</div>
</div>
