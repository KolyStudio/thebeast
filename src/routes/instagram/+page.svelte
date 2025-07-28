<script lang="ts">
	import { CirclePlus, RefreshCw, Loader2, Edit, Terminal } from 'lucide-svelte';
	import AddAccount from '$lib/components/instagram/addAccount.svelte';
	import EditAccount from '$lib/components/instagram/editAccount.svelte';
	import EditProxies from '$lib/components/instagram/listProxies.svelte';
	import BulkEditAccounts from '$lib/components/instagram/bulkEditAccounts.svelte';
	import TableAccounts from '$lib/components/instagram/tableAccounts.svelte';

	import DeleteConfirmationDialog from '$lib/components/ui/delete-confirmation-dialog.svelte';
	import BulkStatusChangeDialog from '$lib/components/ui/bulk-status-change-dialog.svelte';
	import BulkOrderDialog from '$lib/components/ui/bulk-order-dialog.svelte';
	import { Shield, ShoppingCart } from '@lucide/svelte';
	import { instagramAccountsStore, type InstagramAccount } from '$lib/api/instagramAccounts.svelte';

	import { onMount } from 'svelte';

	let editDialogOpen = $state(false);
	let selectedAccount = $state<InstagramAccount | null>(null);
	let editProxiesOpen = $state(false);
	let addAccountOpen = $state(false);

	// État pour le dialog de confirmation de suppression
	let deleteDialogOpen = $state(false);
	let accountToDelete = $state<number | null>(null);

	// État pour la modification en masse
	let bulkEditDialogOpen = $state(false);
	let selectedAccountIds = $state<Set<number>>(new Set());

	// État pour le changement de statut en masse
	let bulkStatusChangeOpen = $state(false);

	// État pour les commandes en masse
	let bulkOrderOpen = $state(false);

	// État pour le terminal et les opérations
	let bulkEditComponent: BulkEditAccounts;

	// Comptes sélectionnés pour la modification en masse
	let selectedAccountsForBulkEdit = $derived(() => {
		return instagramAccountsStore.accounts.filter((account) => selectedAccountIds.has(account.id));
	});

	// Filtre de statut actuel - mise à jour avec les nouveaux filtres
	let currentFilter = $state('Actifs');

	// Chargement initial des comptes
	onMount(async () => {
		await instagramAccountsStore.fetchAccounts();
	});

	// Comptes filtrés selon le statut sélectionné
	let filteredAccounts = $derived(() => {
		const statusMap: Record<string, string[]> = {
			Actifs: ['actif'],
			'En cours': ['en cours'],
			Disponibles: ['disponible'],
			Utilisés: ['utilisé'],
			Nouveaux: ['nouveau'],
			Erreurs: ['erreur'],
			Bannis: ['banni', 'shadowban', 'verification', 'warming']
		};

		const targetStatuses = statusMap[currentFilter];
		if (!targetStatuses) return instagramAccountsStore.accounts;

		return instagramAccountsStore.accounts.filter((account) =>
			targetStatuses.includes(account.statut?.toLowerCase() || '')
		);
	});

	// Compteurs dynamiques pour chaque statut
	let statusCounts = $derived(() => {
		const counts = {
			actif: 0,
			disponible: 0,
			'en cours': 0,
			utilisé: 0,
			nouveau: 0,
			erreur: 0,
			banni: 0,
			shadowban: 0,
			verification: 0,
			warming: 0
		};

		instagramAccountsStore.accounts.forEach((account) => {
			const status = account.statut?.toLowerCase();
			if (status && status in counts) {
				counts[status as keyof typeof counts]++;
			}
		});

		// Calcul des compteurs pour les filtres
		const groupedCounts = {
			Actifs: counts.actif,
			'En cours': counts['en cours'],
			Disponibles: counts.disponible,
			Utilisés: counts.utilisé,
			Nouveaux: counts.nouveau,
			Erreurs: counts.erreur,
			Bannis: counts.banni + counts.shadowban + counts.verification + counts.warming
		};

		return groupedCounts;
	});

	function openEditDialog(account: InstagramAccount) {
		selectedAccount = account;
		editDialogOpen = true;
	}

	function closeEditDialog() {
		editDialogOpen = false;
		selectedAccount = null;
	}

	function openProxiesDialog() {
		editProxiesOpen = true;
	}

	function closeProxiesDialog() {
		editProxiesOpen = false;
	}

	function openAddAccountDialog() {
		addAccountOpen = true;
	}

	function closeAddAccountDialog() {
		addAccountOpen = false;
	}

	function openBulkEditDialog() {
		if (selectedAccountIds.size === 0) {
			alert('Veuillez sélectionner au moins un compte pour la modification en masse.');
			return;
		}
		bulkEditDialogOpen = true;
	}

	function closeBulkEditDialog() {
		bulkEditDialogOpen = false;
	}

	// Fonctions du terminal
	function openTerminal() {
		if (bulkEditComponent) {
			bulkEditComponent.openTerminal();
		}
	}

	// Fonction pour démarrer une opération
	function startOperation() {
		// Opération démarrée
	}

	function toggleAccountSelection(accountId: number) {
		if (selectedAccountIds.has(accountId)) {
			selectedAccountIds.delete(accountId);
		} else {
			selectedAccountIds.add(accountId);
		}
		// Forcer la réactivité
		selectedAccountIds = new Set(selectedAccountIds);
	}

	function toggleSelectAll() {
		const currentFilteredAccounts = filteredAccounts();
		const allSelected = currentFilteredAccounts.every((account) =>
			selectedAccountIds.has(account.id)
		);

		if (allSelected) {
			// Désélectionner tous les comptes filtrés
			currentFilteredAccounts.forEach((account) => {
				selectedAccountIds.delete(account.id);
			});
		} else {
			// Sélectionner tous les comptes filtrés
			currentFilteredAccounts.forEach((account) => {
				selectedAccountIds.add(account.id);
			});
		}
		selectedAccountIds = new Set(selectedAccountIds);
	}

	function openDeleteDialog(id: number) {
		accountToDelete = id;
		deleteDialogOpen = true;
	}

	async function confirmDelete() {
		if (accountToDelete !== null) {
			await instagramAccountsStore.deleteAccount(accountToDelete);
			closeDeleteDialog();
		}
	}

	function closeDeleteDialog() {
		deleteDialogOpen = false;
		accountToDelete = null;
	}

	/**
	 * Fonction pour actualiser la liste des comptes
	 */
	async function refreshAccounts() {
		await instagramAccountsStore.fetchAccounts();
	}

	/**
	 * Fonction pour changer le statut d'un compte
	 */
	async function changeAccountStatus(accountId: number, newStatus: string) {
		await instagramAccountsStore.updateAccount(accountId, { statut: newStatus });
	}

	/**
	 * Fonction pour ouvrir le dialog de changement de statut en masse
	 */
	function openBulkStatusChange() {
		if (selectedAccountIds.size === 0) {
			alert('Veuillez sélectionner au moins un compte pour changer le statut.');
			return;
		}
		bulkStatusChangeOpen = true;
	}

	/**
	 * Fonction pour fermer le dialog de changement de statut en masse
	 */
	function closeBulkStatusChange() {
		bulkStatusChangeOpen = false;
	}

	/**
	 * Fonction pour confirmer le changement de statut en masse
	 */
	async function confirmBulkStatusChange(newStatus: string) {
		try {
			// Changer le statut de tous les comptes sélectionnés
			const promises = Array.from(selectedAccountIds).map((accountId) =>
				instagramAccountsStore.updateAccount(accountId, { statut: newStatus })
			);

			await Promise.all(promises);

			// Réinitialiser la sélection et fermer le dialog
			selectedAccountIds = new Set();
			closeBulkStatusChange();
		} catch (error) {
			console.error('Erreur lors du changement de statut en masse:', error);
			// TODO: Afficher l'erreur dans le dialog plutôt qu'avec alert
		}
	}

	/**
	 * Fonction pour ouvrir le dialog de commande en masse
	 */
	function openBulkOrder() {
		if (selectedAccountIds.size === 0) {
			alert('Veuillez sélectionner au moins un compte pour acheter des followers.');
			return;
		}
		bulkOrderOpen = true;
	}

	/**
	 * Fonction pour fermer le dialog de commande en masse
	 */
	function closeBulkOrder() {
		bulkOrderOpen = false;
	}

	/**
	 * Fonction pour confirmer les commandes en masse
	 */
	async function confirmBulkOrder(quantityMode: 'random' | 'fixed', fixedQuantity?: number) {
		try {
			// Préparer les données des comptes sélectionnés
			const accountsData = selectedAccountsForBulkEdit().map((account) => ({
				id: account.id,
				username: account.username || ''
			}));

			// Appeler l'API pour créer les commandes
			const response = await fetch('/api/orders', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					accounts: accountsData,
					quantityMode,
					fixedQuantity
				})
			});

			const result = await response.json();

			// Le résultat sera affiché dans le dialog
			// Réinitialiser la sélection si succès
			if (result.success) {
				selectedAccountIds = new Set();
			}

			// Retourner le résultat pour que le dialog puisse l'afficher
			return result;
		} catch (error) {
			console.error('Erreur lors de la création des commandes:', error);
			throw error;
		}
	}
</script>

<div class="bg-base-100 border border-base-200 rounded-2xl overflow-visible">
	<div class="flex justify-between items-center">
		<div class="h-10 tabs tabs-box m-2 w-fit">
			<!-- Tabs dans l'ordre demandé : Actifs - En Cours - Disponibles - Utilisés - Nouveaux - Erreurs - Bannis -->
			<input
				type="radio"
				name="my_tabs_1"
				class="h-8 tab"
				aria-label="Actifs - {statusCounts().Actifs}"
				checked={currentFilter === 'Actifs'}
				onchange={() => (currentFilter = 'Actifs')}
			/>
			<input
				type="radio"
				name="my_tabs_1"
				class="h-8 tab"
				aria-label="En cours - {statusCounts()['En cours']}"
				checked={currentFilter === 'En cours'}
				onchange={() => (currentFilter = 'En cours')}
			/>
			<input
				type="radio"
				name="my_tabs_1"
				class="h-8 tab"
				aria-label="Disponibles - {statusCounts().Disponibles}"
				checked={currentFilter === 'Disponibles'}
				onchange={() => (currentFilter = 'Disponibles')}
			/>
			<input
				type="radio"
				name="my_tabs_1"
				class="h-8 tab"
				aria-label="Utilisés - {statusCounts().Utilisés}"
				checked={currentFilter === 'Utilisés'}
				onchange={() => (currentFilter = 'Utilisés')}
			/>
			<input
				type="radio"
				name="my_tabs_1"
				class="h-8 tab [--tab-border-color:hsl(270_80%_50%)]"
				aria-label="Nouveaux - {statusCounts().Nouveaux}"
				checked={currentFilter === 'Nouveaux'}
				onchange={() => (currentFilter = 'Nouveaux')}
			/>
			<input
				type="radio"
				name="my_tabs_1"
				class="h-8 tab"
				aria-label="Erreurs - {statusCounts().Erreurs}"
				checked={currentFilter === 'Erreurs'}
				onchange={() => (currentFilter = 'Erreurs')}
			/>
			<input
				type="radio"
				name="my_tabs_1"
				class="h-8 tab"
				aria-label="Bannis - {statusCounts().Bannis}"
				checked={currentFilter === 'Bannis'}
				onchange={() => (currentFilter = 'Bannis')}
			/>
		</div>
		<div class="gap-2 flex items-center">
			<button
				onclick={refreshAccounts}
				class="bg-base-200 hover:bg-base-300 cursor-pointer rounded-lg"
				disabled={instagramAccountsStore.isLoading.fetch}
			>
				{#if instagramAccountsStore.isLoading.fetch}
					<Loader2 class="w-5 h-5 m-2 animate-spin" />
				{:else}
					<RefreshCw class="w-5 h-5 m-2" />
				{/if}
			</button>

			<button
				onclick={openBulkEditDialog}
				class="rounded-lg transition-colors {selectedAccountIds.size === 0
					? 'bg-base-300 cursor-not-allowed opacity-50'
					: 'bg-base-200 hover:bg-base-300 cursor-pointer'}"
				disabled={selectedAccountIds.size === 0}
				title="Modification en masse ({selectedAccountIds.size} sélectionné(s))"
			>
				<Edit class="w-5 h-5 m-2 {selectedAccountIds.size === 0 ? 'text-gray-500' : ''}" />
			</button>

			<!-- Bouton Changement de statut en masse -->
			<button
				onclick={openBulkStatusChange}
				class="rounded-lg {selectedAccountIds.size === 0
					? 'bg-base-200 cursor-not-allowed opacity-50'
					: 'bg-base-200  cursor-pointer'}"
				disabled={selectedAccountIds.size === 0}
				title="Changer le statut en masse ({selectedAccountIds.size} sélectionné(s))"
				aria-label="Changer le statut en masse"
			>
				<svg
					class="w-5 h-5 m-2 {selectedAccountIds.size === 0 ? 'text-gray-500' : 'text-white'}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
			</button>

			<!-- Bouton Acheter des followers en masse -->
			<button
				onclick={openBulkOrder}
				class="rounded-lg transition-colors {selectedAccountIds.size === 0
					? 'bg-base-300 cursor-not-allowed opacity-50'
					: 'bg-base-200  cursor-pointer'}"
				disabled={selectedAccountIds.size === 0}
				title="Acheter des followers en masse ({selectedAccountIds.size} sélectionné(s))"
				aria-label="Acheter des followers en masse"
			>
				<ShoppingCart
					class="w-5 h-5 m-2 {selectedAccountIds.size === 0 ? 'text-gray-500' : 'text-white'}"
				/>
			</button>

			<!-- Bouton Terminal -->
			<button
				onclick={openTerminal}
				class="bg-base-200 hover:bg-base-300 cursor-pointer rounded-lg transition-colors"
				title="Ouvrir le terminal"
			>
				<Terminal class="w-5 h-5 m-2" />
			</button>

			<button
				onclick={openAddAccountDialog}
				class="bg-base-200 hover:bg-base-300 cursor-pointer rounded-lg transition-colors"
			>
				<CirclePlus class="w-5 h-5 m-2" />
			</button>

			<button
				onclick={openProxiesDialog}
				class="bg-base-200 mr-2 hover:bg-base-300 cursor-pointer rounded-lg transition-colors"
			>
				<Shield class="w-5 h-5 m-2" />
			</button>
		</div>
	</div>
	<TableAccounts
		accounts={filteredAccounts()}
		isLoading={instagramAccountsStore.isLoading.fetch}
		{selectedAccountIds}
		onEdit={openEditDialog}
		onDelete={openDeleteDialog}
		onToggleSelect={toggleAccountSelection}
		onToggleSelectAll={toggleSelectAll}
		onStatusChange={changeAccountStatus}
	/>
</div>

<!-- Modal d'édition -->
<EditAccount bind:open={editDialogOpen} {selectedAccount} onClose={closeEditDialog} />

<!-- Modal de gestion des proxies -->
<EditProxies bind:open={editProxiesOpen} onClose={closeProxiesDialog} />

<!-- Modal d'ajout de compte -->
<AddAccount bind:open={addAccountOpen} onClose={closeAddAccountDialog} />

<!-- Modal de modification en masse -->
<BulkEditAccounts
	bind:this={bulkEditComponent}
	bind:open={bulkEditDialogOpen}
	selectedAccounts={selectedAccountsForBulkEdit()}
	onClose={closeBulkEditDialog}
	onOperationStart={startOperation}
	onOperationEnd={() => {}}
/>

<!-- Dialog de confirmation de suppression -->
<DeleteConfirmationDialog
	bind:open={deleteDialogOpen}
	title="Supprimer le compte"
	description="Êtes-vous sûr de vouloir supprimer ce compte Instagram ? Cette action est irréversible."
	confirmText="Supprimer"
	cancelText="Annuler"
	onConfirm={confirmDelete}
	onCancel={closeDeleteDialog}
	isLoading={instagramAccountsStore.isLoading.delete}
/>

<!-- Dialog de changement de statut en masse -->
<BulkStatusChangeDialog
	bind:open={bulkStatusChangeOpen}
	selectedCount={selectedAccountIds.size}
	onConfirm={confirmBulkStatusChange}
	onCancel={closeBulkStatusChange}
	isLoading={instagramAccountsStore.isLoading.update}
/>

<!-- Dialog de commande de followers en masse -->
<BulkOrderDialog
	bind:open={bulkOrderOpen}
	selectedAccounts={selectedAccountsForBulkEdit()}
	onConfirm={confirmBulkOrder}
	onCancel={closeBulkOrder}
	isLoading={instagramAccountsStore.isLoading.update}
/>
