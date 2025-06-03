<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { CheckCircle } from '@lucide/svelte';

	interface Props {
		open: boolean;
		selectedCount: number;
		onConfirm: (status: string) => void;
		onCancel: () => void;
		isLoading?: boolean;
	}

	let {
		open = $bindable(),
		selectedCount,
		onConfirm,
		onCancel,
		isLoading = false
	}: Props = $props();

	// État pour le statut sélectionné
	let selectedStatus = $state('');

	// Options de statut disponibles
	const statusOptions = [
		{ value: 'actif', label: 'Actif' },
		{ value: 'en cours', label: 'En cours' },
		{ value: 'disponible', label: 'Disponible' },
		{ value: 'utilisé', label: 'Utilisé' },
		{ value: 'nouveau', label: 'Nouveau' },
		{ value: 'erreur', label: 'Erreur' },
		{ value: 'banni', label: 'Banni' }
	];

	/**
	 * Fonction pour gérer la confirmation
	 */
	function handleConfirm() {
		if (selectedStatus && onConfirm) {
			onConfirm(selectedStatus);
		}
	}

	/**
	 * Fonction pour gérer l'annulation
	 */
	function handleCancel() {
		if (onCancel) {
			onCancel();
		}
	}

	// Réinitialiser le statut sélectionné quand le dialog s'ouvre
	$effect(() => {
		if (open) {
			selectedStatus = '';
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header class="gap-3">
			<div class="flex items-center gap-3">
				<div
					class="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"
				>
					<CheckCircle class="h-5 w-5 text-blue-600 flex-shrink-0" />
				</div>
				<div class="flex-1">
					<Dialog.Title class="text-lg font-semibold">Changer le statut en masse</Dialog.Title>
					<Dialog.Description class="text-sm text-neutral-content mt-1">
						{selectedCount} compte(s) sélectionné(s)
					</Dialog.Description>
				</div>
			</div>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<label for="status-select" class="text-sm font-medium">Nouveau statut :</label>
				<Select.Root type="single">
					<Select.Trigger class="w-full">
						<span
							>{statusOptions.find((s) => s.value === selectedStatus)?.label ||
								'Sélectionnez un statut'}</span
						>
					</Select.Trigger>
					<Select.Content>
						{#each statusOptions as option}
							<Select.Item value={option.value} onclick={() => (selectedStatus = option.value)}>
								{option.label}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<Dialog.Footer class="gap-3">
			<Button variant="outline" onclick={handleCancel} disabled={isLoading} class="flex-1">
				Annuler
			</Button>
			<Button onclick={handleConfirm} disabled={!selectedStatus || isLoading} class="flex-1">
				{#if isLoading}
					<div
						class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
					></div>
				{/if}
				Confirmer
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
