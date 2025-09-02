<script lang="ts">
	import { CirclePlus, RefreshCw, Loader2, Edit, Terminal, Zap } from 'lucide-svelte';
	import AddAccount from '$lib/components/instagram/addAccount.svelte';
	import EditAccount from '$lib/components/instagram/editAccount.svelte';
	import EditProxies from '$lib/components/instagram/listProxies.svelte';
	import BulkEditAccounts from '$lib/components/instagram/bulkEditAccounts.svelte';
	import TableAccounts from '$lib/components/instagram/tableAccounts.svelte';

	import DeleteConfirmationDialog from '$lib/components/ui/delete-confirmation-dialog.svelte';
	import BulkStatusChangeDialog from '$lib/components/ui/bulk-status-change-dialog.svelte';
	import BulkOrderDialog from '$lib/components/ui/bulk-order-dialog.svelte';
	import WarmupResultDialog from '$lib/components/ui/warmup-result-dialog.svelte';
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

	// État pour le warmup en masse
	let bulkWarmupLoading = $state(false);
	let warmupResultDialogOpen = $state(false);
	let warmupResult = $state<{
		success: boolean;
		job_id?: string;
		total_accounts?: number;
		estimated_duration_minutes?: number;
		message?: string;
	} | null>(null);

	// État pour le terminal et les opérations
	let bulkEditComponent: BulkEditAccounts;

	// Comptes sélectionnés pour la modification en masse
	let selectedAccountsForBulkEdit = $derived(() => {
		return instagramAccountsStore.accounts.filter((account) => selectedAccountIds.has(account.id));
	});

	// Filtre de statut actuel - mise à jour avec les nouveaux filtres
	let currentFilter = $state('Actifs');

	// Filtre de phase de warmup - utilise 'all' pour toutes les phases, 'none' pour aucune phase, sinon le numéro de phase
	let currentWarmupPhase = $state<number | 'all' | 'none'>('all');

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
			Bannis: ['banni', 'shadowban', 'verification', 'warming'],
			Warmup: ['warmup']
		};

		const targetStatuses = statusMap[currentFilter];
		if (!targetStatuses) return instagramAccountsStore.accounts;

		let accounts;

		// Logique spéciale pour le filtre Warmup
		if (currentFilter === 'Warmup') {
			// Pour Warmup, on filtre seulement par statut 'warmup'
			accounts = instagramAccountsStore.accounts.filter((account) => {
				// Inclure seulement les comptes avec statut 'warmup'
				const hasWarmupStatus = account.statut?.toLowerCase() === 'warmup';

				if (currentWarmupPhase === 'all') {
					// "Toutes les phases" : tous les comptes avec statut warmup
					return hasWarmupStatus;
				} else if (currentWarmupPhase === 'none') {
					// "Aucune" : comptes avec statut warmup mais sans phase définie (null)
					return hasWarmupStatus && account.warmup_phase === null;
				} else {
					// Phase spécifique : seulement les comptes avec cette phase exacte
					// Vérifier d'abord que warmup_phase n'est pas null avant la conversion
					if (account.warmup_phase === null) {
						return false; // Les comptes sans phase ne correspondent à aucune phase numérique
					}
					const accountPhase = Number(account.warmup_phase);
					return hasWarmupStatus && accountPhase === currentWarmupPhase;
				}
			});
		} else {
			// Logique normale pour les autres filtres
			accounts = instagramAccountsStore.accounts.filter((account) =>
				targetStatuses.includes(account.statut?.toLowerCase() || '')
			);
		}

		return accounts;
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
			Bannis: counts.banni + counts.shadowban + counts.verification + counts.warming,
			Warmup: instagramAccountsStore.accounts.filter(
				(account) => account.statut?.toLowerCase() === 'warmup'
			).length
		};

		return groupedCounts;
	});

	// Compteurs dynamiques pour chaque phase de warmup
	let warmupPhaseCounts = $derived(() => {
		const warmupAccounts = instagramAccountsStore.accounts.filter(
			(account) => account.statut?.toLowerCase() === 'warmup'
		);

		const phaseCounts = {
			'Toutes les phases': warmupAccounts.length,
			Aucune: warmupAccounts.filter((account) => account.warmup_phase === null).length,
			'Phase 0': warmupAccounts.filter(
				(account) => account.warmup_phase !== null && Number(account.warmup_phase) === 0
			).length,
			'Phase 1': warmupAccounts.filter(
				(account) => account.warmup_phase !== null && Number(account.warmup_phase) === 1
			).length,
			'Phase 2': warmupAccounts.filter(
				(account) => account.warmup_phase !== null && Number(account.warmup_phase) === 2
			).length,
			'Phase 3': warmupAccounts.filter(
				(account) => account.warmup_phase !== null && Number(account.warmup_phase) === 3
			).length,
			'Phase 4': warmupAccounts.filter(
				(account) => account.warmup_phase !== null && Number(account.warmup_phase) === 4
			).length,
			Terminé: warmupAccounts.filter(
				(account) => account.warmup_phase !== null && Number(account.warmup_phase) === 5
			).length
		};

		return phaseCounts;
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
	 * Fonction pour basculer l'état d'un changement
	 */
	async function toggleAccountChange(accountId: number, changeType: string, newValue: boolean) {
		const updateData: Record<string, boolean> = {};
		updateData[changeType] = newValue;
		await instagramAccountsStore.updateAccount(accountId, updateData);
	}

	/**
	 * Fonction pour changer la phase de warmup d'un compte
	 */
	async function changeWarmupPhase(accountId: number, warmupPhase: number | null) {
		await instagramAccountsStore.updateAccount(accountId, { warmup_phase: warmupPhase });
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

	/**
	 * Fonction pour démarrer le warmup en masse
	 */
	async function startBulkWarmup() {
		if (selectedAccountIds.size === 0) {
			warmupResult = {
				success: false,
				message: 'Veuillez sélectionner au moins un compte pour le warmup.'
			};
			warmupResultDialogOpen = true;
			return;
		}

		bulkWarmupLoading = true;

		try {
			// Préparer les données des comptes sélectionnés
			const accountsData = selectedAccountsForBulkEdit().map((account) => ({
				id: account.id,
				username: account.username || ''
			}));

			// Appeler l'API de warmup
			const response = await fetch('/api/accounts/warmup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					accounts: accountsData,
					batch_size: 10
				})
			});

			const result = await response.json();

			if (response.ok) {
				warmupResult = {
					success: true,
					job_id: result.job_id,
					total_accounts: result.total_accounts,
					estimated_duration_minutes: result.estimated_duration_minutes
				};

				// Réinitialiser la sélection
				selectedAccountIds = new Set();

				// Actualiser la liste des comptes pour voir les mises à jour
				await refreshAccounts();
			} else {
				warmupResult = {
					success: false,
					message: result.message || 'Erreur lors du démarrage du warmup'
				};
			}

			warmupResultDialogOpen = true;
		} catch (error) {
			console.error('Erreur lors du warmup en masse:', error);
			warmupResult = {
				success: false,
				message: `Erreur lors du warmup: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
			};
			warmupResultDialogOpen = true;
		} finally {
			bulkWarmupLoading = false;
		}
	}

	/**
	 * Fonction pour fermer le dialog de résultat de warmup
	 */
	function closeWarmupResultDialog() {
		warmupResultDialogOpen = false;
		warmupResult = null;
	}
</script>

<div class="bg-base-100 rounded-2xl overflow-visible">
	<!-- Barre de filtres principale -->
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
			<input
				type="radio"
				name="my_tabs_1"
				class="h-8 tab [--tab-border-color:hsl(45_100%_50%)]"
				aria-label="Warmup - {statusCounts().Warmup}"
				checked={currentFilter === 'Warmup'}
				onchange={() => {
					currentFilter = 'Warmup';
					currentWarmupPhase = 'all';
				}}
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

			<!-- Bouton Warmup en masse -->
			<button
				onclick={startBulkWarmup}
				class="rounded-lg transition-colors {selectedAccountIds.size === 0 || bulkWarmupLoading
					? 'bg-base-300 cursor-not-allowed opacity-50'
					: 'bg-base-200 hover:bg-base-300 cursor-pointer'}"
				disabled={selectedAccountIds.size === 0 || bulkWarmupLoading}
				title="Démarrer le warmup en masse ({selectedAccountIds.size} sélectionné(s))"
				aria-label="Démarrer le warmup en masse"
			>
				{#if bulkWarmupLoading}
					<Loader2 class="w-5 h-5 m-2 animate-spin text-gray-500" />
				{:else}
					<Zap
						class="w-5 h-5 m-2 {selectedAccountIds.size === 0
							? 'text-gray-500'
							: 'text-yellow-500'}"
					/>
				{/if}
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

	<!-- Seconde barre de filtres pour les phases de warmup -->
	{#if currentFilter === 'Warmup'}
		<div class="px-2 pb-2">
			<div class="h-10 tabs tabs-box w-fit">
				<input
					type="radio"
					name="warmup_phases"
					class="h-8 tab text-sm"
					aria-label="Toutes les phases - {warmupPhaseCounts()['Toutes les phases']}"
					checked={currentWarmupPhase === 'all'}
					onchange={() => (currentWarmupPhase = 'all')}
				/>
				<input
					type="radio"
					name="warmup_phases"
					class="h-8 tab text-sm"
					aria-label="Aucune - {warmupPhaseCounts()['Aucune']}"
					checked={currentWarmupPhase === 'none'}
					onchange={() => (currentWarmupPhase = 'none')}
				/>
				<input
					type="radio"
					name="warmup_phases"
					class="h-8 tab text-sm"
					aria-label="Phase 0 - {warmupPhaseCounts()['Phase 0']}"
					checked={currentWarmupPhase === 0}
					onchange={() => (currentWarmupPhase = 0)}
				/>
				<input
					type="radio"
					name="warmup_phases"
					class="h-8 tab text-sm"
					aria-label="Phase 1 - {warmupPhaseCounts()['Phase 1']}"
					checked={currentWarmupPhase === 1}
					onchange={() => (currentWarmupPhase = 1)}
				/>
				<input
					type="radio"
					name="warmup_phases"
					class="h-8 tab text-sm"
					aria-label="Phase 2 - {warmupPhaseCounts()['Phase 2']}"
					checked={currentWarmupPhase === 2}
					onchange={() => (currentWarmupPhase = 2)}
				/>
				<input
					type="radio"
					name="warmup_phases"
					class="h-8 tab text-sm"
					aria-label="Phase 3 - {warmupPhaseCounts()['Phase 3']}"
					checked={currentWarmupPhase === 3}
					onchange={() => (currentWarmupPhase = 3)}
				/>
				<input
					type="radio"
					name="warmup_phases"
					class="h-8 tab text-sm"
					aria-label="Phase 4 - {warmupPhaseCounts()['Phase 4']}"
					checked={currentWarmupPhase === 4}
					onchange={() => (currentWarmupPhase = 4)}
				/>
				<input
					type="radio"
					name="warmup_phases"
					class="h-8 tab text-sm"
					aria-label="Terminé - {warmupPhaseCounts()['Terminé']}"
					checked={currentWarmupPhase === 5}
					onchange={() => (currentWarmupPhase = 5)}
				/>
			</div>
		</div>
	{/if}

	<TableAccounts
		accounts={filteredAccounts()}
		isLoading={instagramAccountsStore.isLoading.fetch}
		{selectedAccountIds}
		onEdit={openEditDialog}
		onDelete={openDeleteDialog}
		onToggleSelect={toggleAccountSelection}
		onToggleSelectAll={toggleSelectAll}
		onStatusChange={changeAccountStatus}
		onChangeToggle={toggleAccountChange}
		onWarmupPhaseChange={changeWarmupPhase}
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

<!-- Dialog de résultat de warmup -->
<WarmupResultDialog
	bind:open={warmupResultDialogOpen}
	result={warmupResult}
	onClose={closeWarmupResultDialog}
/>
