<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Instagram, Loader2 } from '@lucide/svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { instagramAccountsStore, type InstagramAccount } from '$lib/api/instagramAccounts.svelte';

	interface Props {
		open: boolean;
		selectedAccount: InstagramAccount | null;
		onClose: () => void;
	}

	let { open = $bindable(), selectedAccount, onClose }: Props = $props();

	// Données du formulaire
	let formData = $state({
		username: '',
		password: '',
		statut: '',
		modele_name: '',
		challenge_mail: '',
		challenge_password: '',
		error_message: ''
	});

	// Réinitialiser le formulaire quand le compte sélectionné change
	$effect(() => {
		if (selectedAccount) {
			formData = {
				username: selectedAccount.username || '',
				password: selectedAccount.password || '',
				statut: selectedAccount.statut || '',
				modele_name: selectedAccount.modele_name || '',
				challenge_mail: selectedAccount.challenge_mail || '',
				challenge_password: selectedAccount.challenge_password || '',
				error_message: selectedAccount.error_message || ''
			};
		} else {
			formData = {
				username: '',
				password: '',
				statut: '',
				modele_name: '',
				challenge_mail: '',
				challenge_password: '',
				error_message: ''
			};
		}
	});

	async function handleSave() {
		if (!selectedAccount) return;

		if (!formData.username.trim()) {
			alert("Le nom d'utilisateur est requis.");
			return;
		}

		try {
			await instagramAccountsStore.updateAccount(selectedAccount.id, {
				username: formData.username,
				password: formData.password,
				statut: formData.statut,
				modele_name: formData.modele_name,
				challenge_mail: formData.challenge_mail,
				challenge_password: formData.challenge_password,
				error_message: formData.error_message
			});
			onClose();
		} catch (error) {
			console.error('Erreur lors de la sauvegarde:', error);
		}
	}

	function handleCancel() {
		onClose();
	}

	function capitalizeStatus(status: string) {
		if (!status) return 'Sélectionnez un statut';
		return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
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
					<h1 class="font-medium">Éditer le compte Instagram</h1>
					<h2 class="text-neutral-content text-sm">
						Modifiez les informations du compte {selectedAccount?.username || ''}.
					</h2>
				</div>
			</div>
		</Dialog.Header>

		<div class="space-y-4">
			<!-- Nom d'utilisateur -->
			<div class="flex w-full flex-col gap-1.5">
				<Label class="text-sm font-medium">
					Nom d'utilisateur <span class="text-red-500">*</span>
				</Label>
				<Input
					type="text"
					placeholder="@nom_utilisateur"
					bind:value={formData.username}
					class="w-full"
					disabled={instagramAccountsStore.isLoading.update}
				/>
			</div>

			<!-- Mot de passe -->
			<div class="flex w-full flex-col gap-1.5">
				<Label class="text-sm font-medium">Mot de passe</Label>
				<Input
					type="password"
					placeholder="Mot de passe"
					bind:value={formData.password}
					class="w-full"
					disabled={instagramAccountsStore.isLoading.update}
				/>
			</div>

			<!-- Statut -->
			<div class="flex w-full flex-col gap-1.5">
				<Label class="text-sm font-medium">Statut</Label>
				<Select.Root type="single">
					<Select.Trigger class="w-full" disabled={instagramAccountsStore.isLoading.update}>
						<span>{capitalizeStatus(formData.statut)}</span>
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="actif" onclick={() => (formData.statut = 'actif')}
							>Actif</Select.Item
						>
						<Select.Item value="en cours" onclick={() => (formData.statut = 'en cours')}
							>En cours</Select.Item
						>
						<Select.Item value="disponible" onclick={() => (formData.statut = 'disponible')}
							>Disponible</Select.Item
						>
						<Select.Item value="utilisé" onclick={() => (formData.statut = 'utilisé')}
							>Utilisé</Select.Item
						>
						<Select.Item value="nouveau" onclick={() => (formData.statut = 'nouveau')}
							>Nouveau</Select.Item
						>
						<Select.Item value="erreur" onclick={() => (formData.statut = 'erreur')}
							>Erreur</Select.Item
						>
						<Select.Item value="banni" onclick={() => (formData.statut = 'banni')}
							>Banni</Select.Item
						>
					</Select.Content>
				</Select.Root>
			</div>

			<!-- Nom du modèle -->
			<div class="flex w-full flex-col gap-1.5">
				<Label class="text-sm font-medium">Nom du modèle</Label>
				<Input
					type="text"
					placeholder="Nom du modèle"
					bind:value={formData.modele_name}
					class="w-full"
					disabled={instagramAccountsStore.isLoading.update}
				/>
			</div>

			<!-- Email de challenge -->
			<div class="flex w-full flex-col gap-1.5">
				<Label class="text-sm font-medium">Email de challenge</Label>
				<Input
					type="email"
					placeholder="email@example.com"
					bind:value={formData.challenge_mail}
					class="w-full"
					disabled={instagramAccountsStore.isLoading.update}
				/>
			</div>

			<!-- Mot de passe email -->
			<div class="flex w-full flex-col gap-1.5">
				<Label class="text-sm font-medium">Mot de passe email</Label>
				<Input
					type="password"
					placeholder="Mot de passe email"
					bind:value={formData.challenge_password}
					class="w-full"
					disabled={instagramAccountsStore.isLoading.update}
				/>
			</div>
		</div>

		{#if instagramAccountsStore.errors.update}
			<div class="text-red-500 text-sm p-2 bg-red-50 rounded">
				{instagramAccountsStore.errors.update}
			</div>
		{/if}

		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={handleCancel}
				disabled={instagramAccountsStore.isLoading.update}
			>
				Annuler
			</Button>
			<Button onclick={handleSave} disabled={instagramAccountsStore.isLoading.update}>
				{#if instagramAccountsStore.isLoading.update}
					<Loader2 class="w-4 h-4 animate-spin mr-2" />
				{/if}
				Sauvegarder les modifications
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
