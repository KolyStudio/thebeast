<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props {
		open: boolean;
		title?: string;
		description?: string;
		currentStatus?: string;
		availableStatuses?: { value: string; label: string; color: string; dotColor: string }[];
		confirmText?: string;
		cancelText?: string;
		onConfirm?: (selectedStatus: string) => void;
		onCancel?: () => void;
	}

	let {
		open = $bindable(),
		title = 'Changer le statut',
		description = 'Sélectionnez le nouveau statut pour cette application.',
		currentStatus = '',
		availableStatuses = [
			{
				value: 'actif',
				label: 'Actif',
				color: 'bg-success/20 text-success/90',
				dotColor: 'bg-success'
			},
			{
				value: 'shadowban',
				label: 'Shadowban',
				color: 'bg-warning/20 text-warning/90',
				dotColor: 'bg-warning'
			},
			{ value: 'banni', label: 'Banni', color: 'bg-error/20 text-error/90', dotColor: 'bg-error' },
			{
				value: 'verification',
				label: 'Vérification',
				color: 'bg-purple-500/20 text-purple-500',
				dotColor: 'bg-purple-500'
			},
			{ value: 'warming', label: 'warming', color: 'bg-info/20 text-info/90', dotColor: 'bg-info' }
		],
		confirmText = 'Confirmer',
		cancelText = 'Annuler',
		onConfirm,
		onCancel
	}: Props = $props();

	// État pour le statut sélectionné
	let selectedStatus = $state(currentStatus);

	/**
	 * Fonction pour gérer la confirmation
	 */
	function handleConfirm() {
		if (selectedStatus && onConfirm) {
			onConfirm(selectedStatus);
		}
		open = false;
	}

	/**
	 * Fonction pour gérer l'annulation
	 */
	function handleCancel() {
		if (onCancel) {
			onCancel();
		}
		open = false;
	}

	/**
	 * Fonction pour sélectionner un statut
	 */
	function selectStatus(status: string) {
		selectedStatus = status;
	}

	// Réinitialiser le statut sélectionné quand le dialog s'ouvre
	$effect(() => {
		if (open) {
			selectedStatus = currentStatus;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description class="text-neutral-content/70">
				{description}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-3 py-4">
			{#each availableStatuses as status}
				<button
					class="w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 {selectedStatus ===
					status.value
						? 'border-primary bg-primary/10'
						: 'border-base-300 hover:border-base-400 hover:bg-base-200'}"
					onclick={() => selectStatus(status.value)}
				>
					<div class="status-dot {status.dotColor}"></div>
					<div class="flex-1 text-left">
						<div class="font-medium text-neutral-content">{status.label}</div>
						{#if selectedStatus === status.value}
							<div class="text-sm text-primary">Sélectionné</div>
						{/if}
					</div>
					{#if selectedStatus === status.value}
						<div class="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
							<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
					{/if}
				</button>
			{/each}
		</div>

		<Dialog.Footer class="flex gap-2">
			<Button variant="outline" onclick={handleCancel} class="flex-1">
				{cancelText}
			</Button>
			<Button
				onclick={handleConfirm}
				class="flex-1"
				disabled={!selectedStatus || selectedStatus === currentStatus}
			>
				{confirmText}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	.status-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		display: inline-block;
		flex-shrink: 0;
	}
</style>
