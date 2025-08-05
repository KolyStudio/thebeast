<script lang="ts">
	import { Loader2 } from 'lucide-svelte';
	import CityAccountsTable from './CityAccountsTable.svelte';
	import AccountFilters from './AccountFilters.svelte';
	import AccountsPagination from './AccountsPagination.svelte';
	import { supabase } from '$lib/supabaseClient';
	import { toast } from 'svelte-sonner';

	let { accounts = [] } = $props();
	let selectedAccountApp = $state('all');
	let currentPage = $state(1);
	let pageSize = $state(20);
	let searchQuery = $state('');
	let appFilters = $state({ fruitz: true, happn: true });
	let isLoading = $state(false);

	// Charger automatiquement les comptes au montage du composant
	$effect(() => {
		fetchAccounts();
	});

	// Fonction pour formatter la date en DD/MM
	function formatDate(date: Date) {
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		return `${day}/${month}`;
	}

	// Function to filter accounts by application and search query
	function getFilteredAccounts() {
		// Si la recherche concerne une ville, on l'applique en priorité
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();

			return accounts.filter((account) => {
				// Vérifier d'abord si l'application est dans les filtres actifs
				const appMatches =
					selectedAccountApp === 'all'
						? appFilters[account.application || 'fruitz']
						: account.application === selectedAccountApp;

				// Ensuite vérifier si la ville correspond à la recherche
				const cityMatches = account.ville && account.ville.toLowerCase().includes(query);

				// On retourne les comptes qui correspondent à l'app sélectionnée ET à la recherche de ville
				return appMatches && cityMatches;
			});
		}

		// Si pas de recherche, on filtre juste par application
		return accounts.filter((account) => {
			return selectedAccountApp === 'all'
				? appFilters[account.application || 'fruitz']
				: account.application === selectedAccountApp;
		});
	}

	// Function to group accounts by city and sort by application and date
	function groupAccountsByCity() {
		// Récupérer tous les comptes filtrés
		const filteredAccounts = getFilteredAccounts();

		// Regrouper par ville d'abord
		const groupedAccounts: Record<string, any[]> = {};

		// Group accounts by city
		filteredAccounts.forEach((account) => {
			const city = account.ville || 'Ville inconnue';
			if (!groupedAccounts[city]) {
				groupedAccounts[city] = [];
			}
			groupedAccounts[city].push(account);
		});

		// Convertir en tableau de {city, accounts} et trier les comptes par application puis par date
		const groupedByCity = Object.entries(groupedAccounts)
			.map(([city, accounts]) => {
				// Trier les comptes par application puis par date (plus récent en premier)
				const sortedAccounts = [...accounts].sort((a, b) => {
					// D'abord trier par application (fruitz puis happn)
					if ((a.application || 'fruitz') !== (b.application || 'fruitz')) {
						return (a.application || 'fruitz') === 'fruitz' ? -1 : 1;
					}

					// Ensuite trier par date (plus récent en premier)
					const dateA = a.created ? new Date(a.created).getTime() : 0;
					const dateB = b.created ? new Date(b.created).getTime() : 0;
					return dateB - dateA;
				});

				return {
					city,
					accounts: sortedAccounts,
					// Compter le nombre de comptes par application dans cette ville
					fruitzCount: accounts.filter((a) => a.application === 'fruitz').length,
					happnCount: accounts.filter((a) => a.application === 'happn').length
				};
			})
			.sort((a, b) => a.city.localeCompare(b.city));

		// Paginer les groupes de villes plutôt que les comptes individuels
		const startIndex = (currentPage - 1) * pageSize;
		return groupedByCity.slice(startIndex, startIndex + pageSize);
	}

	// Function to get total pages based on number of cities after grouping
	function getTotalPages() {
		// Récupérer tous les comptes filtrés
		const filteredAccounts = getFilteredAccounts();

		// Regrouper par ville pour compter le nombre unique de villes
		const uniqueCities = new Set();

		filteredAccounts.forEach((account) => {
			const city = account.ville || 'Ville inconnue';
			uniqueCities.add(city);
		});

		// Calculer le nombre de pages basé sur le nombre de villes uniques
		return Math.ceil(uniqueCities.size / pageSize);
	}

	// Function to change page
	function changePage(page: number) {
		const totalPages = getTotalPages();
		if (page < 1) {
			currentPage = 1;
		} else if (page > totalPages) {
			currentPage = totalPages || 1;
		} else {
			currentPage = page;
		}
	}

	// Function for formatted page display
	function getPageDisplay() {
		const filteredAccounts = getFilteredAccounts();
		const totalAccounts = filteredAccounts.length;
		const startItem = totalAccounts === 0 ? 0 : (currentPage - 1) * pageSize + 1;
		const endItem = Math.min(currentPage * pageSize, totalAccounts);

		return `${startItem}-${endItem} sur ${totalAccounts}`;
	}

	// Function to change page size
	function changePageSize(newSize: number) {
		pageSize = newSize;
		currentPage = 1; // Reset to first page when changing page size
	}

	// Fonction pour supprimer un compte
	async function deleteAccount(accountId: string) {
		if (!accountId) return;

		try {
			isLoading = true;

			// Supprimer le compte dans Supabase
			const { error } = await supabase.from('accounts').delete().eq('id', accountId);

			if (error) {
				throw error;
			}

			// Mise à jour de la liste des comptes en mémoire
			accounts = accounts.filter((account) => account.id !== accountId);

			// Afficher un toast de confirmation
			toast.success('Compte supprimé avec succès');
		} catch (error) {
			console.error('Erreur lors de la suppression du compte:', error);
			toast.error('Erreur lors de la suppression du compte');
		} finally {
			isLoading = false;
		}
	}

	// Function to fetch accounts from Supabase
	async function fetchAccounts() {
		isLoading = true;
		try {
			// Récupérer les comptes depuis Supabase
			const { data, error } = await supabase
				.from('accounts')
				.select('*')
				.order('created', { ascending: false });

			if (error) {
				throw error;
			}

			console.log('Données des comptes:', data);

			// Assigner les données à notre état local
			accounts = data.map((account) => ({
				...account,
				// Convertir la date string en objet Date si nécessaire
				created: account.created ? new Date(account.created) : new Date(),
				// Gérer le cas où likes n'est pas défini
				likes: account.likes
					? typeof account.likes === 'string'
						? parseInt(account.likes)
						: account.likes
					: 0,
				// S'assurer que l'application est définie
				application: account.application || 'fruitz'
			}));

			console.log(`${accounts.length} comptes chargés`);
		} catch (error) {
			console.error('Erreur lors du chargement des comptes:', error);
			toast.error('Erreur lors du chargement des comptes');
		} finally {
			isLoading = false;
		}
	}

	// Reset page when changing app
	function handleSelectedAppChange(app) {
		selectedAccountApp = app;
		currentPage = 1;
		searchQuery = ''; // Réinitialiser la recherche en changeant d'application
	}

	// Handle search query change
	function handleSearchChange(query) {
		searchQuery = query;
		currentPage = 1;
	}
</script>

<div class="bg-card shadow-lg shadow-black/10 w-full rounded-3xl pb-5 border border-border">
	<div class="flex justify-center md:justify-between items-center p-4">
		<div class="hidden md:flex items-center gap-2">
			<h2 class="text-xl font-semibold text-foreground">Liste des comptes</h2>
			<button
				class="p-1.5 bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground rounded-full transition-colors"
				onclick={fetchAccounts}
				aria-label="Rafraîchir les comptes"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="animate-spin-hover"
				>
					<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
					<path d="M21 3v5h-5"></path>
				</svg>
			</button>
		</div>
		<AccountFilters
			selectedApp={selectedAccountApp}
			{searchQuery}
			onChangeApp={handleSelectedAppChange}
			onChangeSearch={handleSearchChange}
		/>
	</div>

	<!-- Ajout d'un bouton de rafraîchissement sur mobile -->
	<div class="mb-3 px-4 md:hidden">
		<button
			class="flex items-center justify-center w-full py-2 bg-muted hover:bg-accent rounded-xl text-sm gap-2 text-muted-foreground hover:text-accent-foreground transition-colors"
			onclick={fetchAccounts}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
				<path d="M21 3v5h-5"></path>
			</svg>
			Rafraîchir la liste des comptes
		</button>
	</div>

	<div class="bg-card rounded-lg mx-4 mb-4 border border-border">
		{#if isLoading}
			<div class="flex justify-center items-center py-10">
				<Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
			</div>
		{:else if getFilteredAccounts().length === 0}
			<div class="py-10 text-center text-muted-foreground">
				{searchQuery
					? `Aucune ville trouvée avec le terme "${searchQuery}"`
					: 'Aucun compte trouvé'}
			</div>
		{:else if groupAccountsByCity().length === 0}
			<div class="py-10 text-center text-muted-foreground">
				Aucune ville sur cette page. <button
					class="underline text-primary hover:text-primary/80"
					onclick={() => changePage(1)}>Revenir à la première page</button
				>
			</div>
		{:else}
			{#each groupAccountsByCity() as group}
				<CityAccountsTable {group} onDelete={deleteAccount} {formatDate} />
			{/each}
		{/if}
	</div>

	<!-- Pagination - adjusted to reflect pagination by cities -->
	{#if getFilteredAccounts().length > 0 && !isLoading}
		<AccountsPagination
			{currentPage}
			totalPages={getTotalPages()}
			totalAccounts={getFilteredAccounts().length}
			{pageSize}
			displayInfo={`${groupAccountsByCity().length} villes`}
			onChangePage={changePage}
			onChangePageSize={changePageSize}
		/>
	{/if}
</div>

<style>
	.animate-spin-hover:hover {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
