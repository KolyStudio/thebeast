<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { AlertTriangle } from '@lucide/svelte';

	interface Props {
		open: boolean;
		title?: string;
		description?: string;
		confirmText?: string;
		cancelText?: string;
		onConfirm: () => void;
		onCancel: () => void;
		isLoading?: boolean;
	}

	let {
		open = $bindable(),
		title = 'Confirmer la suppression',
		description = 'Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?',
		confirmText = 'Supprimer',
		cancelText = 'Annuler',
		onConfirm,
		onCancel,
		isLoading = false
	}: Props = $props();

	function handleConfirm() {
		onConfirm();
	}

	function handleCancel() {
		onCancel();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header class="gap-3">
			<div class="flex items-center gap-3">
				<div
					class="h-10 w-10 bg-error/20 text-error/90 rounded-full flex items-center justify-center flex-shrink-0"
				>
					<AlertTriangle class="h-5 w-5  flex-shrink-0" />
				</div>
				<div class="flex-1">
					<Dialog.Title class="text-lg font-semibold">{title}</Dialog.Title>
					<Dialog.Description class="text-sm text-neutral-content mt-1">
						{description}
					</Dialog.Description>
				</div>
			</div>
		</Dialog.Header>

		<Dialog.Footer class="gap-3 mt-6">
			<Button variant="outline" onclick={handleCancel} disabled={isLoading} class="flex-1">
				{cancelText}
			</Button>
			<Button
				variant="destructive"
				onclick={handleConfirm}
				disabled={isLoading}
				class="flex-1 bg-error"
			>
				{#if isLoading}
					<div
						class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
					></div>
				{/if}
				{confirmText}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
