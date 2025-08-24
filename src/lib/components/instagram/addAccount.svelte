<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Instagram, Loader2 } from '@lucide/svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import {
		instagramAccountsStore,
		type InstagramAccountInput
	} from '$lib/api/instagramAccounts.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open = $bindable(), onClose }: Props = $props();

	let accountsText = $state('');

	/**
	 * Parser le texte des comptes au format pseudo:pass:email:email_pass:challenge_pass
	 */
	function parseAccounts(text: string): InstagramAccountInput[] {
		const lines = text
			.trim()
			.split('\n')
			.filter((line) => line.trim());
		const accounts: InstagramAccountInput[] = [];

		for (const line of lines) {
			const parts = line.trim().split(':');
			if (parts.length >= 5) {
				accounts.push({
					username: parts[0],
					password: parts[1],
					challenge_mail: parts[2],
					email_password: parts[3],
					challenge_password: parts[4],
					statut: 'nouveau'
				});
			}
		}

		return accounts;
	}

	async function handleSubmit() {
		if (!accountsText.trim()) {
			alert('Veuillez saisir au moins un compte.');
			return;
		}

		const accounts = parseAccounts(accountsText);
		if (accounts.length === 0) {
			alert('Format invalide. Utilisez le format: pseudo:pass:email:email_pass:challenge_pass');
			return;
		}

		try {
			await instagramAccountsStore.createMultipleAccounts(accounts);
			accountsText = '';
			onClose();
		} catch (error) {
			console.error("Erreur lors de l'ajout des comptes:", error);
		}
	}

	function handleCancel() {
		accountsText = '';
		onClose();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<div class="flex space-x-3">
				<div
					class="h-10 w-10 bg-base-300 rounded-xl border-base-100 border-dashed border flex items-center justify-center flex-shrink-0"
				>
					<Instagram class="h-5 w-5" />
				</div>
				<div>
					<h1 class="font-medium">Ajouter des comptes instagram</h1>
					<h2 class="text-neutral-content text-sm">
						Ajoutez de nouveaux comptes Instagram pour leur gestion.
					</h2>
				</div>
			</div>
		</Dialog.Header>

		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Label for="accounts">Comptes</Label>
			<Textarea
				id="accounts"
				bind:value={accountsText}
				placeholder="pseudo:pass:email:email_pass:challenge_pass
pseudo:pass:email:email_pass:challenge_pass
pseudo:pass:email:email_pass:challenge_pass"
				class="min-h-[200px]"
				disabled={instagramAccountsStore.isLoading.create}
			/>
			<p class="text-xs text-gray-500 mt-1">
				Format: pseudo:motdepasse:email:motdepasseemail:motdepassechallenge (un par ligne)
			</p>
		</div>

		{#if instagramAccountsStore.errors.create}
			<div class="text-red-500 text-sm p-2 bg-red-50 rounded">
				{instagramAccountsStore.errors.create}
			</div>
		{/if}

		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={handleCancel}
				disabled={instagramAccountsStore.isLoading.create}
			>
				Annuler
			</Button>
			<Button
				onclick={handleSubmit}
				class="bg-white hover:bg-white"
				disabled={instagramAccountsStore.isLoading.create}
			>
				{#if instagramAccountsStore.isLoading.create}
					<Loader2 class="w-4 h-4 animate-spin mr-2" />
				{/if}
				Ajouter les comptes
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
