<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Shield, Pencil, Trash, Plus, Loader2 } from '@lucide/svelte';
	import EditProxy from './editProxy.svelte';
	import DeleteConfirmationDialog from '$lib/components/ui/delete-confirmation-dialog.svelte';
	import { proxiesStore, type Proxy } from '$lib/api/proxies.svelte';
	import { onMount } from 'svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open = $bindable(), onClose }: Props = $props();

	// État pour le dialog d'édition
	let editDialogOpen = $state(false);
	let selectedProxy = $state<Proxy | null>(null);

	// État pour le dialog de confirmation de suppression
	let deleteDialogOpen = $state(false);
	let proxyToDelete = $state<number | null>(null);

	// Chargement initial des proxies
	onMount(async () => {
		await proxiesStore.fetchProxies();
	});

	// Réactiver le chargement quand le dialog s'ouvre
	$effect(() => {
		if (open && proxiesStore.proxies.length === 0) {
			proxiesStore.fetchProxies();
		}
	});

	const headers = ['Type', 'IP', 'Port', 'Actions'];

	function openDeleteDialog(id: number) {
		proxyToDelete = id;
		deleteDialogOpen = true;
	}

	async function confirmDelete() {
		if (proxyToDelete !== null) {
			await proxiesStore.deleteProxy(proxyToDelete);
			closeDeleteDialog();
		}
	}

	function closeDeleteDialog() {
		deleteDialogOpen = false;
		proxyToDelete = null;
	}

	function editProxy(id: number) {
		const proxy = proxiesStore.proxies.find((p) => p.id === id);
		if (proxy) {
			selectedProxy = proxy;
			editDialogOpen = true;
		}
	}

	function closeEditDialog() {
		editDialogOpen = false;
		selectedProxy = null;
	}

	function addNewProxy() {
		selectedProxy = null;
		editDialogOpen = true;
	}

	function getTypeColor(type: string) {
		switch (type.toLowerCase()) {
			case 'http':
			case 'https':
				return 'bg-blue-100 text-blue-800';
			case 'socks4':
				return 'bg-green-100 text-green-800';
			case 'socks5':
				return 'bg-purple-100 text-purple-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-0">
		<Dialog.Header class="p-6 pb-0">
			<div class="flex justify-between items-center">
				<div class="flex space-x-3">
					<div
						class="h-10 w-10 bg-base-300 rounded-xl border-base-100 border-dashed border flex items-center justify-center flex-shrink-0"
					>
						<Shield class="h-5 w-5" />
					</div>
					<div>
						<h1 class="font-medium">Gestion des Proxies</h1>
						<h2 class="text-neutral-content text-sm">
							Configurez vos proxies pour les comptes Instagram.
						</h2>
					</div>
				</div>
				<Button onclick={addNewProxy} size="sm" class="gap-2 bg-white hover:bg-white">
					<Plus class="h-4 w-4" />
					Ajouter
				</Button>
			</div>
		</Dialog.Header>

		<div class="mt-4">
			{#if proxiesStore.isLoading.fetch}
				<div class="flex items-center justify-center p-8">
					<Loader2 class="h-6 w-6 animate-spin mr-2" />
					<span>Chargement des proxies...</span>
				</div>
			{:else if proxiesStore.errors.fetch}
				<div class="flex items-center justify-center p-8 text-red-500">
					<span>Erreur: {proxiesStore.errors.fetch}</span>
				</div>
			{:else}
				<table class="w-full border-collapse overflow-hidden font-medium text-center text-sm">
					<thead>
						<tr
							class="bg-base-200 h-12 rounded-t-lg text-neutral-content/80 font-medium text-center"
						>
							{#each headers as header}
								<th class="p-2 first:text-left font-semibold text-center last:text-right"
									>{header}</th
								>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#if proxiesStore.proxies.length === 0}
							<tr>
								<td colspan="4" class="p-8 text-center text-neutral-content/60">
									Aucun proxy configuré. Cliquez sur "Ajouter" pour en créer un.
								</td>
							</tr>
						{:else}
							{#each proxiesStore.proxies as proxy}
								<tr class="bg-base-100 text-neutral-content/80">
									<td class="p-2 h-12 text-left">
										<span class="px-2 py-1 rounded text-xs font-medium {getTypeColor(proxy.type)}">
											{proxy.type.toUpperCase()}
										</span>
									</td>
									<td class="p-2 h-12 first:rounded-bl-lg last:rounded-br-lg first:text-left">
										<div class="font-mono text-sm">
											{proxy.host}
										</div>
									</td>
									<td class="p-2 h-12 text-xs text-gray-500">
										{proxy.port}
									</td>
									<td class="p-2 h-12">
										<div class="flex space-x-2 items-center justify-end">
											<button
												onclick={() => editProxy(proxy.id)}
												class="hover:bg-base-200 p-1 rounded transition-colors cursor-pointer"
												disabled={proxiesStore.isLoading.delete}
											>
												<Pencil class="w-4 h-4" color="#f39b59" />
											</button>
											<button
												onclick={() => openDeleteDialog(proxy.id)}
												class="hover:bg-base-200 p-1 rounded transition-colors cursor-pointer"
												disabled={proxiesStore.isLoading.delete}
											>
												{#if proxiesStore.isLoading.delete}
													<Loader2 class="w-4 h-4 animate-spin" />
												{:else}
													<Trash class="w-4 h-4" color="#e1504f" />
												{/if}
											</button>
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Dialog d'édition de proxy -->
<EditProxy bind:open={editDialogOpen} {selectedProxy} onClose={closeEditDialog} />

<!-- Dialog de confirmation de suppression -->
<DeleteConfirmationDialog
	bind:open={deleteDialogOpen}
	title="Supprimer le proxy"
	description="Êtes-vous sûr de vouloir supprimer ce proxy ? Cette action est irréversible."
	confirmText="Supprimer"
	cancelText="Annuler"
	onConfirm={confirmDelete}
	onCancel={closeDeleteDialog}
	isLoading={proxiesStore.isLoading.delete}
/>
