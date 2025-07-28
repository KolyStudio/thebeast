<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Shield } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	let dialogOpen = false;
</script>

<Dialog.Root bind:open={dialogOpen}>
	<DropdownMenu.Item
		onSelect={(e) => {
			e.preventDefault();
			dialogOpen = true;
		}}
	>
		<Shield class="mr-2 h-4 w-4" />
		<span>Ajouter un proxy</span>
	</DropdownMenu.Item>

	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<div class="flex space-x-3">
				<div
					class="h-10 w-10 bg-base-300 rounded-xl border-base-100 border-dashed border flex items-center justify-center flex-shrink-0"
				>
					<Shield class="h-5 w-5" />
				</div>
				<div>
					<h1 class="font-medium">Ajouter un proxy</h1>
					<h2 class="text-neutral-content text-sm">
						Ajoutez un proxy disponible pour les comptes.
					</h2>
				</div>
			</div>
		</Dialog.Header>

		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Label for="email-2">Sélection d'un proxy</Label>
			<Select.Root type="single">
				<Select.Trigger class="w-full"></Select.Trigger>
				<Select.Content>
					<Select.Item value="light">Light</Select.Item>
					<Select.Item value="dark">Dark</Select.Item>
					<Select.Item value="system">System</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>

		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Label for="email-2">Comptes</Label>
			<Textarea
				placeholder="pseudo:pass:email:pass
pseudo:pass:email:pass
pseudo:pass:email:pass"
				class="min-h-[200px]"
			/>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (dialogOpen = false)}>Annuler</Button>
			<Button type="submit">Ajouter le compte</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
