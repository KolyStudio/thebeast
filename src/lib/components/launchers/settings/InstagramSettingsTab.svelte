<script lang="ts">
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Instagram, User } from 'lucide-svelte';

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
						class="w-full ring-0 focus:ring-0 focus:ring-transparent  hover:bg-base-200"
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
					<!-- Instagram Type -->
					<div class="space-y-2">
						<p class="text-sm text-muted-foreground">Type Instagram</p>
						<Select.Root
							type="single"
							value={formValues[agent.id].instagram_type || ''}
							onValueChange={(value) => (formValues[agent.id].instagram_type = value)}
						>
							<Select.Trigger class="w-full bg-white">
								{formValues[agent.id].instagram_type || 'Sélectionner un type'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="brune">brune</Select.Item>
								<Select.Item value="blonde">blonde</Select.Item>
								<Select.Item value="brunereel">brunereel</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Instagram URL -->
					<div class="space-y-2">
						<p class="text-sm text-muted-foreground">URL Instagram</p>
						<Input
							placeholder="https://www.instagram.com/username/"
							class="font-mono text-sm bg-white"
							bind:value={formValues[agent.id].instagram_url}
						/>
					</div>

					<!-- Main Account -->
					<div class="space-y-2">
						<p class="text-sm text-muted-foreground">Compte principal</p>
						<Input
							placeholder="@compte_principal"
							class="font-mono text-sm bg-white"
							bind:value={formValues[agent.id].instagram_main_account}
						/>
					</div>

					<!-- Prénoms -->
					<div class="space-y-2">
						<p class="text-sm text-muted-foreground">Entrez le prénom</p>
						<Input
							placeholder="Entrez le prénom de la personne à qui appartient le compte"
							class="font-mono text-sm bg-white"
							bind:value={formValues[agent.id].instagram_prenoms}
						/>
					</div>

					<!-- Pseudos -->
					<div class="space-y-2">
						<p class="text-sm text-muted-foreground">
							Entrez les préfixes de mots clés, un par ligne.
						</p>
						<Textarea
							placeholder="Entrez vos préfixes de mots clés ici, un par ligne"
							rows={4}
							class="font-mono text-sm resize-none bg-white max-h-24 overflow-y-auto"
							bind:value={formValues[agent.id].instagram_pseudos}
						/>
					</div>

					<!-- Pseudos Exemples -->
					<div class="space-y-2">
						<p class="text-sm text-muted-foreground">
							Entrez les exemples de pseudos, un par ligne.
						</p>
						<Textarea
							placeholder="Entrez vos exemples de pseudos ici, un par ligne"
							rows={4}
							class="font-mono text-sm resize-none bg-white max-h-24 overflow-y-auto"
							bind:value={formValues[agent.id].instagram_pexemples}
						/>
					</div>
				</div>
			</div>
		{/if}
	{/each}
</div>
