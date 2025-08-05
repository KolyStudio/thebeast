<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { Key, Users, CirclePlus } from 'lucide-svelte';

	let { newAgent, onCreate } = $props<{
		newAgent: {
			name: string;
			proxy_type: string;
			proxy_port: string;
			proxy_username: string;
			proxy_password: string;
			proxy_renew_address: string;
			proxy_renew_port: string;
			api_sms_activate: string;
			application: string;
			keywords: string;
			prenoms: string;
			instagram_url: string;
			instagram_main_account: string;
			instagram_prenoms: string;
			instagram_pseudos: string;
			instagram_type: string;
		};
		onCreate: () => Promise<void>;
	}>();
</script>

<div class="space-y-6">
	<div class="bg-base-200 rounded-xl p-4">
		<div class="space-y-6">
			<div class="grid grid-cols-2 gap-8 items-center">
				<div>
					<h4 class="text-base font-medium">Nom de l'agent</h4>
					<p class="text-sm text-muted-foreground">Le nom identifiant l'agent.</p>
				</div>
				<div class="relative">
					<div class="absolute left-3 top-2.5 text-gray-400">
						<Users class="h-5 w-5" />
					</div>
					<Input
						class="pl-10 h-10 rounded-xl bg-white"
						placeholder="Entrez le nom de l'agent"
						bind:value={newAgent.name}
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
					value={newAgent.proxy_type}
					onValueChange={(value) => {
						newAgent.proxy_type = value;
					}}
				>
					<ToggleGroup.Item
						value="hdc2"
						class="px-4 h-9 rounded-xl w-16 data-[state=on]:bg-white data-[state=on]:text-black text-white"
					>
						hdc2
					</ToggleGroup.Item>
					<ToggleGroup.Item
						value="lte"
						class="px-4 rounded-xl h-9 w-16 data-[state=on]:bg-white data-[state=on]:text-black text-white"
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
					value={newAgent.application}
					onValueChange={(value) => {
						newAgent.application = value;
					}}
				>
					<ToggleGroup.Item
						value="fruitz"
						class="px-4 h-9 rounded-xl w-20 data-[state=on]:bg-white data-[state=on]:text-white flex items-center justify-center"
					>
						<img src="/fruitz.png" alt="Fruitz" class="h-6" />
					</ToggleGroup.Item>
					<ToggleGroup.Item
						value="happn"
						class="px-4 rounded-xl h-9 w-20 data-[state=on]:bg-white data-[state=on]:text-white flex items-center justify-center"
					>
						<img src="/happn.png" alt="Happn" class="h-5" />
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
					bind:value={newAgent.proxy_port}
				/>
			</div>

			<div class="grid grid-cols-2 gap-8 items-center">
				<div>
					<h4 class="text-base font-medium">ID pour le renouvellement d'IP</h4>
					<p class="text-sm text-muted-foreground">L'identifiant pour le renouvellement d'ip.</p>
				</div>
				<Input
					class="h-10 rounded-xl bg-white"
					placeholder="Entrez l'id de renouvellement"
					bind:value={newAgent.proxy_renew_port}
				/>
			</div>

			<div class="grid grid-cols-2 gap-8 items-center">
				<div>
					<h4 class="text-base font-medium">Clé API SMS Activate</h4>
					<p class="text-sm text-muted-foreground">La clé API pour activer les fonctionnalités.</p>
				</div>
				<div class="relative">
					<div class="absolute left-3 top-2.5 text-gray-400">
						<Key class="h-5 w-5" />
					</div>
					<Input
						type="text"
						class="pl-10 h-10 rounded-xl bg-white"
						placeholder="Entrez votre clé API"
						bind:value={newAgent.api_sms_activate}
					/>
				</div>
			</div>

			<div class="flex justify-end mt-6">
				<Button onclick={onCreate} class="bg-[#080808] hover:bg-[#080808]/90 text-white">
					<CirclePlus class="w-4 h-4 mr-2" />
					Ajouter un agent
				</Button>
			</div>
		</div>
	</div>
</div>
