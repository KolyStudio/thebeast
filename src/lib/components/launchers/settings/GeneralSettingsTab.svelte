<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { Key } from 'lucide-svelte';

	let { activeAgent, formValues, modelsStore, onAgentChange } = $props<{
		activeAgent: string;
		formValues: Record<string, any>;
		modelsStore: any;
		onAgentChange: (id: string) => void;
	}>();

	// Gestionnaire pour le changement de type de proxy
	function handleProxyTypeChange(agentId: string, value: string) {
		if (!formValues[agentId]) return;
		formValues[agentId].proxy_type = value;
	}
</script>

<div class="space-y-6">
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<div class="w-48">
				<Select.Root type="single" value={activeAgent} onValueChange={onAgentChange}>
					<Select.Trigger
						class="w-full ring-0 focus:ring-0 focus:ring-transparent hover:bg-base-200"
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
				<div class="space-y-6">
					<div class="grid grid-cols-2 gap-8 items-center">
						<div>
							<h4 class="text-base font-medium">Nom de l'agent</h4>
							<p class="text-sm text-muted-foreground">Le nom identifiant l'agent.</p>
						</div>
						<div class="relative">
							<div class="absolute left-3 top-2.5 text-gray-400">
								{#if formValues[agent.id].application}
									<img src="/{formValues[agent.id].application}.png" alt="" class="w-5 h-5" />
								{/if}
							</div>
							<Input
								id="name-{agent.id}"
								class="pl-10 h-10 rounded-xl bg-white"
								placeholder="Entrez le nom de l'agent"
								bind:value={formValues[agent.id].name}
							/>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-8 items-center">
						<div>
							<h4 class="text-base font-medium">Type d'ip du proxy</h4>
							<p class="text-sm text-muted-foreground">Le type d'ip à utiliser.</p>
						</div>
						<ToggleGroup.Root
							type="single"
							class="flex items-center gap-2 justify-start"
							value={formValues[agent.id].proxy_type}
							onValueChange={(value) => handleProxyTypeChange(agent.id, value)}
						>
							<ToggleGroup.Item
								value="hdc2"
								class="px-4 h-9 rounded-xl w-16 data-[state=on]:bg-gray-200 data-[state=on]:text-black"
							>
								hdc2
							</ToggleGroup.Item>
							<ToggleGroup.Item
								value="lte"
								class="px-4 rounded-xl h-9 w-16 data-[state=on]:bg-gray-200 data-[state=on]:text-black"
							>
								lte
							</ToggleGroup.Item>
						</ToggleGroup.Root>
					</div>

					<div class="grid grid-cols-2 gap-8 items-center">
						<div>
							<h4 class="text-base font-medium">Application</h4>
							<p class="text-sm text-muted-foreground">L'application à utiliser.</p>
						</div>
						<ToggleGroup.Root
							type="single"
							class="flex items-center gap-2 justify-start"
							value={formValues[agent.id].application}
							onValueChange={(value) => {
								formValues[agent.id].application = value;
							}}
						>
							<ToggleGroup.Item
								value="fruitz"
								class="px-4 h-9 rounded-xl w-20 data-[state=on]:bg-gray-200 data-[state=on]:text-white flex items-center justify-center"
							>
								<img src="/fruitz.png" alt="Fruitz" class="h-6" />
							</ToggleGroup.Item>
							<ToggleGroup.Item
								value="happn"
								class="px-4 rounded-xl h-9 w-20 data-[state=on]:bg-gray-200 data-[state=on]:text-white flex items-center justify-center"
							>
								<img src="/happn.png" alt="Happn" class="h-5" />
							</ToggleGroup.Item>
							<ToggleGroup.Item
								value="feels"
								class="px-4 rounded-xl h-9 w-20 data-[state=on]:bg-gray-200 data-[state=on]:text-white flex items-center justify-center"
							>
								<img src="/feels.png" alt="Feels" class="h-5" />
							</ToggleGroup.Item>
						</ToggleGroup.Root>
					</div>

					<div class="grid grid-cols-2 gap-8 items-center">
						<div>
							<h4 class="text-base font-medium">Port du proxy</h4>
							<p class="text-sm text-muted-foreground">Le port du proxy à utiliser.</p>
						</div>
						<Input
							type="number"
							class="h-10 rounded-xl bg-white"
							placeholder="Entrez le port du proxy"
							bind:value={formValues[agent.id].proxy_port}
						/>
					</div>

					<div class="grid grid-cols-2 gap-8 items-center">
						<div>
							<h4 class="text-base font-medium">ID pour le renouvellement d'IP</h4>
							<p class="text-sm text-muted-foreground">
								L'identifiant pour le renouvellement d'ip.
							</p>
						</div>
						<Input
							class="h-10 rounded-xl bg-white"
							placeholder="Entrez l'id de renouvellement"
							bind:value={formValues[agent.id].proxy_renew_port}
						/>
					</div>

					<div class="grid grid-cols-2 gap-8 items-center">
						<div>
							<h4 class="text-base font-medium">Clé API SMS Activate</h4>
							<p class="text-sm text-muted-foreground">
								La clé API pour activer les fonctionnalités.
							</p>
						</div>
						<div class="relative">
							<div class="absolute left-3 top-2.5 text-gray-400">
								<Key class="h-5 w-5" />
							</div>
							<Input
								type="text"
								class="pl-10 h-10 rounded-xl bg-white"
								placeholder="Entrez votre clé API"
								bind:value={formValues[agent.id].api_sms_activate}
							/>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/each}
</div>
