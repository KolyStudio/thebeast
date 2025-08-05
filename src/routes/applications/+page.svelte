<script lang="ts">
	import {
		CirclePlus,
		RefreshCw,
		Loader2,
		Edit,
		Pencil,
		Trash,
		Plus,
		X,
		Info,
		Search
	} from 'lucide-svelte';
	import DeleteConfirmationDialog from '$lib/components/ui/delete-confirmation-dialog.svelte';
	import AddApplicationDialog, {
		type ApplicationData
	} from '$lib/components/applications/addAccount.svelte';
	import * as Select from '$lib/components/ui/select';
	import * as Popover from '$lib/components/ui/popover';
	import { Input } from '$lib/components/ui/input';
	import { supabase } from '$lib/supabaseClient';
	import { instagramAccountsStore, type InstagramAccount } from '$lib/api/instagramAccounts.svelte';
	import { onMount } from 'svelte';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import 'dayjs/locale/fr';

	// Configuration de dayjs
	dayjs.extend(relativeTime);
	dayjs.locale('fr');

	// Liste des villes françaises avec leurs coordonnées (gardée pour référence)
	const villes = [
		{ ville: 'Paris', latitude: 48.8566, longitude: 2.3522 },
		{ ville: 'Marseille', latitude: 43.2965, longitude: 5.3698 },
		{ ville: 'Lyon', latitude: 45.764, longitude: 4.8357 },
		{ ville: 'Toulouse', latitude: 43.6045, longitude: 1.4442 },
		{ ville: 'Nice', latitude: 43.7102, longitude: 7.262 },
		{ ville: 'Nantes', latitude: 47.2184, longitude: -1.5536 },
		{ ville: 'Montpellier', latitude: 43.6119, longitude: 3.8772 },
		{ ville: 'Strasbourg', latitude: 48.5734, longitude: 7.7521 },
		{ ville: 'Bordeaux', latitude: 44.8378, longitude: -0.5792 },
		{ ville: 'Lille', latitude: 50.6292, longitude: 3.0573 },
		{ ville: 'Rennes', latitude: 48.1173, longitude: -1.6778 },
		{ ville: 'Reims', latitude: 49.2583, longitude: 4.0317 },
		{ ville: 'Le Havre', latitude: 49.4944, longitude: 0.1079 },
		{ ville: 'Toulon', latitude: 43.1242, longitude: 5.928 },
		{ ville: 'Angers', latitude: 47.4784, longitude: -0.5632 },
		{ ville: 'Grenoble', latitude: 45.1885, longitude: 5.7245 },
		{ ville: 'Dijon', latitude: 47.322, longitude: 5.0415 },
		{ ville: 'Nîmes', latitude: 43.8367, longitude: 4.3601 },
		{ ville: 'Aix-en-Provence', latitude: 43.5297, longitude: 5.4474 },
		{ ville: 'Villeurbanne', latitude: 45.7578, longitude: 3.0568 },
		{ ville: 'Clermont-Ferrand', latitude: 45.7772, longitude: 3.087 },
		{ ville: 'Brest', latitude: 48.3904, longitude: -4.4861 },
		{ ville: 'Tours', latitude: 47.3445, longitude: 0.7084 },
		{ ville: 'Amiens', latitude: 49.8941, longitude: 2.3022 },
		{ ville: 'Perpignan', latitude: 42.698, longitude: 2.8954 },
		{ ville: 'Metz', latitude: 49.1193, longitude: 6.1757 },
		{ ville: 'Besançon', latitude: 47.2378, longitude: 6.0241 },
		{ ville: 'Orléans', latitude: 47.9029, longitude: 1.9094 },
		{ ville: 'Argenteuil', latitude: 48.946, longitude: 2.2476 },
		{ ville: 'Mulhouse', latitude: 47.7508, longitude: 7.3359 },
		{ ville: 'Rouen', latitude: 49.4431, longitude: 1.0993 },
		{ ville: 'Caen', latitude: 49.4144, longitude: -0.6935 },
		{ ville: 'La Rochelle', latitude: 46.1603, longitude: -1.1511 },
		{ ville: 'Troyes', latitude: 48.2973, longitude: 4.0741 },
		{ ville: 'Nancy', latitude: 48.6921, longitude: 6.1844 },
		{ ville: 'Valence', latitude: 44.9333, longitude: 4.8955 },
		{ ville: 'Évry', latitude: 48.6277, longitude: 2.4437 }
	];

	// Comptes chargés depuis Supabase
	let comptes = $state<any[]>([]);

	// État pour les sélections et filtres
	let selectedAccountIds = $state(new Set());
	let currentFilter = $state('bumble');
	let searchTerm = $state('');
	let isLoading = $state(false);
	let isAddingAccount = $state(false);
	let isEditingAccount = $state(false);
	let isDeletingAccount = $state(false);

	// États pour la gestion des comptes Instagram
	let availableInstagramAccounts = $state<InstagramAccount[]>([]);
	let isLoadingInstagram = $state(false);

	// État pour la confirmation de suppression
	let showDeleteConfirmation = $state(false);
	let compteToDelete = $state<number | null>(null);
	let showBulkDeleteConfirmation = $state(false);
	let showAddCompteDialog = $state(false);
	let showEditCompteDialog = $state(false);
	let compteToEdit = $state<any | null>(null);
	let selectedVille = $state('');
	let selectedPlatform = $state('');

	// État pour le dropdown de changement de statut
	let openDropdownId = $state<number | null>(null);

	// Statuts disponibles pour les comptes
	const availablestatutes = ['actif', 'shadowban', 'banni', 'verification', 'warming', 'nouveau'];

	/**
	 * Fonction pour charger les comptes depuis Supabase
	 */
	async function loadComptes() {
		isLoading = true;
		try {
			const { data, error } = await supabase
				.from('apps_accounts')
				.select('*')
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Erreur lors du chargement des comptes:', error);
				return;
			}

			// Adapter les données de Supabase au format attendu
			comptes = data.map((app) => ({
				id: app.id,
				idd: app.application || `Compte ${app.city}`,
				platform: app.platform,
				statut: app.statut,
				lastActivity: app.created_at,
				matches: 0, // À ajouter dans la BDD si nécessaire
				ville: app.city,
				createdAt: app.created_at,
				application: app.application,
				instagram: app.instagram,
				note: app.note,
				instagram_account_id: app.instagram_account_id
			}));
		} catch (err) {
			console.error('Erreur lors du chargement:', err);
		} finally {
			isLoading = false;
		}
	}

	/**
	 * Fonction pour ajouter un nouveau compte dans Supabase
	 */
	async function handleAddCompteConfirm(data) {
		isAddingAccount = true;
		try {
			const newCompte = {
				platform: selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1),
				statut: data.statut,
				city: selectedVille,
				application: data.id || `Compte ${selectedVille}`,
				instagram: data.instagram || '',
				note: data.note || '',
				created_at: data.createdAt
			};

			const { data: insertedData, error } = await supabase
				.from('apps_accounts')
				.insert([newCompte])
				.select();

			if (error) {
				console.error("Erreur lors de l'ajout:", error);
				return;
			}

			// Ajouter directement le nouveau compte à la liste locale
			const newCompteFormatted = {
				id: insertedData[0].id,
				idd: insertedData[0].application || `Compte ${insertedData[0].city}`,
				platform: insertedData[0].platform,
				statut: insertedData[0].statut,
				lastActivity: insertedData[0].created_at,
				matches: 0,
				ville: insertedData[0].city,
				createdAt: insertedData[0].created_at,
				application: insertedData[0].application,
				instagram: insertedData[0].instagram,
				note: insertedData[0].note,
				instagram_account_id: insertedData[0].instagram_account_id
			};

			comptes = [newCompteFormatted, ...comptes];
			showAddCompteDialog = false;
			console.log('Nouveau compte ajouté:', insertedData[0]);
		} catch (err) {
			console.error("Erreur lors de l'ajout:", err);
		} finally {
			isAddingAccount = false;
		}
	}

	/**
	 * Fonction pour supprimer un compte de Supabase
	 */
	async function handleDeleteConfirm() {
		if (compteToDelete !== null) {
			isDeletingAccount = true;
			try {
				// Récupérer les informations du compte avant suppression
				const { data: compteData, error: fetchError } = await supabase
					.from('apps_accounts')
					.select('instagram_account_id')
					.eq('id', compteToDelete)
					.single();

				if (fetchError) {
					console.error('Erreur lors de la récupération du compte:', fetchError);
					return;
				}

				// Si un compte Instagram était lié, changer son statut à "utilisé"
				if (compteData?.instagram_account_id) {
					await instagramAccountsStore.updateAccount(compteData.instagram_account_id, {
						statut: 'utilisé'
					});
				}

				// Supprimer le compte
				const { error } = await supabase.from('apps_accounts').delete().eq('id', compteToDelete);

				if (error) {
					console.error('Erreur lors de la suppression:', error);
					return;
				}

				// Supprimer directement le compte de la liste locale
				comptes = comptes.filter((compte) => compte.id !== compteToDelete);

				// Mettre à jour la sélection
				selectedAccountIds.delete(compteToDelete);
				selectedAccountIds = new Set(selectedAccountIds);

				// Mettre à jour la liste des comptes Instagram disponibles si nécessaire
				if (compteData?.instagram_account_id) {
					availableInstagramAccounts = instagramAccountsStore.accounts.filter(
						(account) => account.statut === 'disponible'
					);
				}

				console.log('Compte supprimé:', compteToDelete);
			} catch (err) {
				console.error('Erreur lors de la suppression:', err);
			} finally {
				isDeletingAccount = false;
			}
		}
		showDeleteConfirmation = false;
		compteToDelete = null;
	}

	/**
	 * Fonction pour supprimer plusieurs comptes sélectionnés
	 */
	async function handleBulkDeleteConfirm() {
		if (selectedAccountIds.size === 0) return;

		isDeletingAccount = true;
		try {
			const accountsToDelete = Array.from(selectedAccountIds);

			// Récupérer les informations des comptes avant suppression
			const { data: comptesData, error: fetchError } = await supabase
				.from('apps_accounts')
				.select('id, instagram_account_id')
				.in('id', accountsToDelete);

			if (fetchError) {
				console.error('Erreur lors de la récupération des comptes:', fetchError);
				return;
			}

			// Marquer les comptes Instagram liés comme "utilisé"
			for (const compte of comptesData || []) {
				if (compte.instagram_account_id) {
					await instagramAccountsStore.updateAccount(compte.instagram_account_id, {
						statut: 'utilisé'
					});
				}
			}

			// Supprimer tous les comptes sélectionnés
			const { error } = await supabase.from('apps_accounts').delete().in('id', accountsToDelete);

			if (error) {
				console.error('Erreur lors de la suppression en lot:', error);
				return;
			}

			// Supprimer les comptes de la liste locale
			comptes = comptes.filter((compte) => !selectedAccountIds.has(compte.id));

			// Vider la sélection
			selectedAccountIds.clear();
			selectedAccountIds = new Set(selectedAccountIds);

			// Mettre à jour la liste des comptes Instagram disponibles
			availableInstagramAccounts = instagramAccountsStore.accounts.filter(
				(account) => account.statut === 'disponible'
			);

			console.log('Comptes supprimés en lot:', accountsToDelete);
		} catch (err) {
			console.error('Erreur lors de la suppression en lot:', err);
		} finally {
			isDeletingAccount = false;
		}
		showBulkDeleteConfirmation = false;
	}

	/**
	 * Fonction pour mettre à jour le statut d'un compte
	 */
	async function handlestatutChange(compteId, newstatut) {
		try {
			const { error } = await supabase
				.from('apps_accounts')
				.update({ statut: newstatut })
				.eq('id', compteId);

			if (error) {
				console.error('Erreur lors de la mise à jour du statut:', error);
				return;
			}

			// Mettre à jour directement le statut dans la liste locale
			comptes = comptes.map((compte) =>
				compte.id === compteId ? { ...compte, statut: newstatut } : compte
			);

			console.log('Statut mis à jour:', compteId, newstatut);
			closeDropdown();
		} catch (err) {
			console.error('Erreur lors de la mise à jour:', err);
		}
	}

	/**
	 * Fonction pour actualiser la liste depuis Supabase
	 */
	async function refreshComptes() {
		await loadComptes();
		await loadAvailableInstagramAccounts();
	}

	/**
	 * Fonction pour charger les comptes Instagram disponibles
	 */
	async function loadAvailableInstagramAccounts() {
		try {
			await instagramAccountsStore.fetchAccounts();
			availableInstagramAccounts = instagramAccountsStore.accounts.filter(
				(account) => account.statut === 'disponible'
			);
		} catch (error) {
			console.error('Erreur lors du chargement des comptes Instagram:', error);
		}
	}

	/**
	 * Fonction pour lier un compte Instagram à une application
	 */
	async function linkInstagramAccount(appId: number, instagramAccountId: number) {
		isLoadingInstagram = true;
		try {
			// Récupérer le username du compte Instagram
			const instagramAccount = instagramAccountsStore.accounts.find(
				(acc) => acc.id === instagramAccountId
			);
			const username = instagramAccount?.username || `Compte ${instagramAccountId}`;

			// Mettre à jour l'application avec le compte Instagram et son username
			const { error: appError } = await supabase
				.from('apps_accounts')
				.update({
					instagram_account_id: instagramAccountId,
					instagram: username
				})
				.eq('id', appId);

			if (appError) {
				console.error('Erreur lors de la liaison du compte Instagram:', appError);
				return;
			}

			// Changer le statut du compte Instagram à "en cours"
			await instagramAccountsStore.updateAccount(instagramAccountId, { statut: 'en cours' });

			// Mettre à jour directement le compte dans la liste locale
			comptes = comptes.map((compte) =>
				compte.id === appId
					? {
							...compte,
							instagram_account_id: instagramAccountId,
							instagram: username
						}
					: compte
			);

			// Mettre à jour la liste des comptes Instagram disponibles
			availableInstagramAccounts = instagramAccountsStore.accounts.filter(
				(account) => account.statut === 'disponible'
			);

			console.log('Compte Instagram lié avec succès:', appId, instagramAccountId);
		} catch (error) {
			console.error('Erreur lors de la liaison:', error);
		} finally {
			isLoadingInstagram = false;
		}
	}

	/**
	 * Fonction pour délier un compte Instagram d'une application
	 */
	async function unlinkInstagramAccount(appId: number, instagramAccountId: number) {
		isLoadingInstagram = true;
		try {
			// Retirer le compte Instagram de l'application et vider le champ instagram
			const { error: appError } = await supabase
				.from('apps_accounts')
				.update({
					instagram_account_id: null,
					instagram: null
				})
				.eq('id', appId);

			if (appError) {
				console.error('Erreur lors du déliaison du compte Instagram:', appError);
				return;
			}

			// Changer le statut du compte Instagram à "disponible"
			await instagramAccountsStore.updateAccount(instagramAccountId, { statut: 'disponible' });

			// Mettre à jour directement le compte dans la liste locale
			comptes = comptes.map((compte) =>
				compte.id === appId
					? {
							...compte,
							instagram_account_id: null,
							instagram: null
						}
					: compte
			);

			// Mettre à jour la liste des comptes Instagram disponibles
			availableInstagramAccounts = instagramAccountsStore.accounts.filter(
				(account) => account.statut === 'disponible'
			);

			console.log('Compte Instagram délié avec succès:', appId, instagramAccountId);
		} catch (error) {
			console.error('Erreur lors du déliaison:', error);
		} finally {
			isLoadingInstagram = false;
		}
	}

	// Charger les comptes au montage du composant
	onMount(() => {
		loadComptes();
		loadAvailableInstagramAccounts();
	});

	/**
	 * Fonction pour obtenir la couleur de fond du statut
	 */
	function getstatutColor(statut: string) {
		switch (statut?.toLowerCase()) {
			case 'actif':
				return 'bg-success/20 text-success/90';
			case 'shadowban':
				return 'bg-warning/20 text-warning/90';
			case 'banni':
				return 'bg-error/20 text-error/90';
			case 'verification':
				return 'bg-purple-500/20 text-purple-500';
			case 'warming':
				return 'bg-info/20 text-info/90';
			// Fallback pour les anciens statuts
			case 'disponible':
				return 'bg-success/20 text-success/90';
			case 'en cours':
				return 'bg-info/20 text-info/90';
			case 'nouveau':
				return 'bg-info/20 text-info/90';
			case 'erreur':
				return 'bg-warning/20 text-warning/90';
			default:
				return 'bg-gray/20 text-gray/90';
		}
	}

	/**
	 * Fonction pour obtenir la couleur du point de statut
	 */
	function getstatutDotClass(statut: string) {
		switch (statut?.toLowerCase()) {
			case 'actif':
				return 'bg-success';
			case 'shadowban':
				return 'bg-warning';
			case 'banni':
				return 'bg-error';
			case 'verification':
				return 'bg-purple-500';
			case 'warming':
				return 'bg-info';
			// Fallback pour les anciens statuts
			case 'disponible':
				return 'bg-success';
			case 'en cours':
				return 'bg-info';
			case 'nouveau':
				return 'bg-info';
			case 'erreur':
				return 'bg-warning';
			default:
				return 'bg-gray-400';
		}
	}

	/**
	 * Fonction pour capitaliser le statut
	 */
	function capitalizestatut(statut: string) {
		if (!statut) return 'Inconnu';
		return statut.charAt(0).toUpperCase() + statut.slice(1).toLowerCase();
	}

	/**
	 * Fonction pour formater la date de création
	 */
	function formatCreationDate(dateString: string) {
		const date = dayjs(dateString);
		const today = dayjs();
		const yesterday = today.subtract(1, 'day');

		if (date.isSame(today, 'day')) {
			return "Aujourd'hui";
		} else if (date.isSame(yesterday, 'day')) {
			return 'Hier';
		} else {
			const daysDiff = today.diff(date, 'day');
			return `${daysDiff} jour${daysDiff > 1 ? 's' : ''}`;
		}
	}

	/**
	 * Fonction pour créer les données du tableau avec toutes les villes
	 * Les comptes existants sont triés en haut
	 */
	let tableData = $derived(() => {
		return villes
			.map((ville) => {
				// Chercher s'il existe un compte pour cette ville et cette plateforme
				const existingCompte = comptes.find(
					(compte) =>
						compte.ville === ville.ville && compte.platform.toLowerCase() === currentFilter
				);

				return {
					ville: ville.ville,
					latitude: ville.latitude,
					longitude: ville.longitude,
					compte: existingCompte || null,
					hasAccount: !!existingCompte
				};
			})
			.filter((item) => {
				// Filtrer selon la plateforme sélectionnée
				if (item.compte && item.compte.platform.toLowerCase() !== currentFilter) {
					return false;
				}

				// Filtrer selon le terme de recherche
				if (searchTerm.trim()) {
					const searchLower = searchTerm.toLowerCase().trim();

					// Rechercher dans la ville
					const villeMatch = item.ville.toLowerCase().includes(searchLower);

					// Rechercher dans l'ID de l'application si le compte existe
					const idMatch =
						item.compte &&
						(item.compte.application?.toLowerCase().includes(searchLower) ||
							item.compte.idd?.toLowerCase().includes(searchLower));

					// Afficher l'élément s'il y a une correspondance dans la ville ou l'ID
					return villeMatch || idMatch;
				}

				return true;
			})
			.sort((a, b) => {
				// Trier pour mettre les comptes existants en haut
				if (a.hasAccount && !b.hasAccount) return -1;
				if (!a.hasAccount && b.hasAccount) return 1;
				// Si les deux ont le même statut, trier par ville alphabétiquement
				return a.ville.localeCompare(b.ville);
			});
	});

	// Compteurs dynamiques pour chaque plateforme
	let platformCounts = $derived(() => {
		const counts = {
			bumble: 0,
			badoo: 0,
			tinder: 0
		};

		comptes.forEach((compte) => {
			const platform = compte.platform?.toLowerCase();
			if (platform && platform in counts) {
				counts[platform as keyof typeof counts]++;
			}
		});
		return counts;
	});

	/**
	 * Fonction pour basculer la sélection d'un compte
	 */
	function toggleAccountSelection(accountId: number) {
		if (selectedAccountIds.has(accountId)) {
			selectedAccountIds.delete(accountId);
		} else {
			selectedAccountIds.add(accountId);
		}
		// Forcer la réactivité
		selectedAccountIds = new Set(selectedAccountIds);
	}

	/**
	 * Fonction pour sélectionner/désélectionner tous les comptes
	 */
	function toggleSelectAll() {
		const existingComptes = tableData()
			.filter((item) => item.hasAccount)
			.map((item) => item.compte!.id);
		const allSelected = existingComptes.every((id) => selectedAccountIds.has(id));

		if (allSelected) {
			// Désélectionner tous les comptes
			existingComptes.forEach((id) => selectedAccountIds.delete(id));
		} else {
			// Sélectionner tous les comptes
			existingComptes.forEach((id) => selectedAccountIds.add(id));
		}
		selectedAccountIds = new Set(selectedAccountIds);
	}

	// Computed pour vérifier si tous les comptes sont sélectionnés
	let allSelected = $derived.by(() => {
		const existingComptes = tableData().filter((item) => item.hasAccount);
		return (
			existingComptes.length > 0 &&
			existingComptes.every((item) => selectedAccountIds.has(item.compte!.id))
		);
	});

	/**
	 * Fonction pour ouvrir le dialog d'ajout de compte
	 */
	function addAccountForCity(ville: string, platform: string) {
		selectedVille = ville;
		selectedPlatform = platform;
		showAddCompteDialog = true;
	}

	/**
	 * Fonction pour fermer le dialog d'ajout de compte
	 */
	function handleAddCompteCancel() {
		showAddCompteDialog = false;
		selectedVille = '';
		selectedPlatform = '';
	}

	/**
	 * Fonction pour annuler l'édition d'un compte
	 */
	function handleEditCompteCancel() {
		showEditCompteDialog = false;
		compteToEdit = null;
		selectedVille = '';
		selectedPlatform = '';
	}

	/**
	 * Fonction pour confirmer l'édition d'un compte
	 */
	async function handleEditCompteConfirm(data) {
		if (!compteToEdit) return;

		try {
			isEditingAccount = true;

			// Mise à jour du compte dans Supabase
			const { error } = await supabase
				.from('apps_accounts')
				.update({
					application: data.id,
					created_at: data.createdAt,
					statut: data.statut,
					note: data.note
				})
				.eq('id', compteToEdit.id);

			if (error) {
				console.error('Erreur lors de la mise à jour du compte:', error);
				alert('Erreur lors de la mise à jour du compte');
				return;
			}

			// Mettre à jour directement le compte dans la liste locale
			comptes = comptes.map((compte) =>
				compte.id === compteToEdit.id
					? {
							...compte,
							application: data.id,
							createdAt: data.createdAt,
							statut: data.statut,
							note: data.note
						}
					: compte
			);

			console.log('Compte mis à jour avec succès');
		} catch (error) {
			console.error('Erreur:', error);
			alert('Erreur lors de la mise à jour du compte');
		} finally {
			isEditingAccount = false;
			showEditCompteDialog = false;
			compteToEdit = null;
		}
	}

	/**
	 * Fonction pour éditer un compte
	 */
	function editCompte(compte: any) {
		compteToEdit = compte;
		selectedVille = compte.ville;
		selectedPlatform = compte.platform;
		showEditCompteDialog = true;
	}

	/**
	 * Fonction pour confirmer la suppression d'un compte
	 */
	function confirmDeleteCompte(id: number) {
		compteToDelete = id;
		showDeleteConfirmation = true;
	}

	/**
	 * Fonction pour annuler la suppression
	 */
	function handleDeleteCancel() {
		showDeleteConfirmation = false;
		compteToDelete = null;
	}

	/**
	 * Fonction pour confirmer la suppression en lot
	 */
	function confirmBulkDelete() {
		if (selectedAccountIds.size > 0) {
			showBulkDeleteConfirmation = true;
		}
	}

	/**
	 * Fonction pour annuler la suppression en lot
	 */
	function handleBulkDeleteCancel() {
		showBulkDeleteConfirmation = false;
	}

	/**
	 * Fonction pour supprimer un compte (ancienne version)
	 */
	function deleteCompte(id: number) {
		comptes = comptes.filter((compte) => compte.id !== id);
		selectedAccountIds.delete(id);
		selectedAccountIds = new Set(selectedAccountIds);
		console.log('Compte supprimé:', id);
	}

	/**
	 * Fonction pour basculer l'état d'un dropdown
	 */
	function toggleDropdown(compteId: number) {
		if (openDropdownId === compteId) {
			openDropdownId = null;
		} else {
			openDropdownId = compteId;
		}
	}

	/**
	 * Fonction pour fermer un dropdown
	 */
	function closeDropdown() {
		openDropdownId = null;
	}

	/**
	 * Gestionnaire pour fermer le dropdown en cliquant en dehors
	 */
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Element;
		if (!target.closest('.dropdown-container')) {
			openDropdownId = null;
		}
	}

	// Ajouter l'événement click sur le document
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

<div class="bg-base-100 rounded-2xl">
	<div class="flex justify-between items-center">
		<div class="h-10 tabs tabs-box m-2 w-fit">
			<!-- Tabs pour les plateformes : Bumble - Badoo - Tinder -->
			<input
				type="radio"
				name="platform_tabs"
				class="h-8 tab"
				aria-label="Bumble - {platformCounts().bumble}"
				checked={currentFilter === 'bumble'}
				onchange={() => (currentFilter = 'bumble')}
			/>

			<input
				type="radio"
				name="platform_tabs"
				class="h-8 tab"
				aria-label="Badoo - {platformCounts().badoo}"
				checked={currentFilter === 'badoo'}
				onchange={() => (currentFilter = 'badoo')}
			/>

			<input
				type="radio"
				name="platform_tabs"
				class="h-8 tab"
				aria-label="Tinder - {platformCounts().tinder}"
				checked={currentFilter === 'tinder'}
				onchange={() => (currentFilter = 'tinder')}
			/>
		</div>
		<div class="gap-2 flex items-center">
			{#if selectedAccountIds.size > 0}
				<button
					onclick={confirmBulkDelete}
					class="bg-error hover:bg-error/80 text-error-content cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center"
					disabled={isDeletingAccount}
					title="Supprimer les comptes sélectionnés"
				>
					{#if isDeletingAccount}
						<Loader2 class="w-4 h-4 animate-spin inline mr-2" />
					{:else}
						<Trash class="w-4 h-4 inline mr-2" />
					{/if}
					({selectedAccountIds.size})
				</button>
			{/if}

			<!-- Champ de recherche -->
			<div class="relative">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<Search class="h-4 w-4 text-neutral-content/50" />
				</div>
				<Input
					type="text"
					placeholder="Rechercher par ID ou ville..."
					bind:value={searchTerm}
					class="pl-10 w-64 h-8 text-sm bg-base-200 border-base-300 focus:border-primary"
				/>
			</div>

			<button
				onclick={refreshComptes}
				class="bg-base-200 hover:bg-base-300 cursor-pointer rounded-lg mr-2"
				disabled={isLoading}
			>
				{#if isLoading}
					<Loader2 class="w-5 h-5 m-2 animate-spin" />
				{:else}
					<RefreshCw class="w-5 h-5 m-2" />
				{/if}
			</button>
		</div>
	</div>

	<!-- Tableau des comptes par ville -->
	<table class="w-full border-collapse text-center text-sm table-fixed">
		<thead>
			<tr class="bg-base-200 text-neutral-content">
				<th class="p-2 text-left font-semibold w-12">
					<input
						type="checkbox"
						class="checkbox checkbox-success bg-base-200 rounded"
						checked={allSelected}
						onchange={toggleSelectAll}
					/>
				</th>
				<th class="p-2 first:text-left font-semibold text-center w-20">Plateforme</th>
				<th class="p-2 first:text-left font-semibold text-center w-24">Statut</th>
				<th class="p-2 first:text-left font-semibold text-center w-32">ID</th>
				<th class="p-2 first:text-left font-semibold text-center w-28">Ville</th>
				<th class="p-2 first:text-left font-semibold text-center w-40">Instagram</th>
				<th class="p-2 first:text-left font-semibold text-center w-20">Création</th>
				<th class="p-2 text-right font-semibold w-24">Actions</th>
			</tr>
		</thead>
		<tbody>
			{#if isLoading}
				<tr>
					<td colspan="8" class="p-8 text-center text-neutral-content/60">
						<div class="flex items-center justify-center gap-2">
							<Loader2 class="h-6 w-6 animate-spin" />
							<span>Chargement des comptes...</span>
						</div>
					</td>
				</tr>
			{:else}
				{#each tableData() as item, index}
					{#if item.hasAccount}
						<tr class="bg-base-100 text-white">
							<td class="p-2 h-12 text-left">
								<input
									type="checkbox"
									class="checkbox checkbox-success bg-base-200 rounded"
									checked={selectedAccountIds.has(item.compte.id)}
									onchange={() => toggleAccountSelection(item.compte.id)}
								/>
							</td>
							<td class="p-2 h-12">
								<div class="flex justify-center items-center">
									<img
										src="/{item.compte.platform.toLowerCase()}.webp"
										alt={item.compte.platform}
										class="h-6 w-auto"
									/>
								</div>
							</td>
							<td class="p-2 h-12 relative">
								<div class="relative dropdown-container">
									<div
										class="px-3 py-1 flex items-center gap-2 w-fit rounded m-auto cursor-pointer hover:opacity-80 transition-opacity text-xs {getstatutColor(
											item.compte.statut
										)}"
										onclick={() => toggleDropdown(item.compte.id)}
										title="Cliquer pour changer le statut"
									>
										<div class="statut {getstatutDotClass(item.compte.statut)}"></div>
										<p>{capitalizestatut(item.compte.statut)}</p>
										<svg
											class="w-3 h-3 ml-1 transition-transform {openDropdownId === item.compte.id
												? 'rotate-180'
												: ''}"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7"
											></path>
										</svg>
									</div>
									{#if openDropdownId === item.compte.id}
										<ul
											class="menu bg-base-100 rounded-box z-[9999] w-44 p-2 shadow absolute top-full left-1/2 transform -translate-x-1/2 mt-1"
										>
											{#each availablestatutes as statut}
												<li>
													<button
														class="flex items-center gap-2 w-full text-left hover:bg-base-200 p-2 rounded text-xs {item.compte.statut?.toLowerCase() ===
														statut
															? 'bg-base-200'
															: ''}"
														onclick={() => {
															handlestatutChange(item.compte.id, statut);
															closeDropdown();
														}}
														disabled={isLoading}
													>
														<div class="statut {getstatutDotClass(statut)}"></div>
														<span>{capitalizestatut(statut)}</span>
													</button>
												</li>
											{/each}
										</ul>
									{/if}
								</div>
							</td>
							<td class="p-2 h-12">
								<span class="font-medium">{item.compte.application}</span>
							</td>
							<td class="p-2 h-12 font-medium">
								{item.ville}
							</td>
							<td class="p-2 h-12 text-center">
								<div class="w-full flex justify-center items-center">
									{#if item.compte.instagram_account_id}
										<!-- Compte Instagram déjà assigné -->
										<div class="flex items-center gap-1 justify-center max-w-full">
											<span
												class="text-sm truncate max-w-24"
												title={item.compte.instagram ||
													`Compte ${item.compte.instagram_account_id}`}
											>
												{item.compte.instagram || `Compte ${item.compte.instagram_account_id}`}
											</span>
											<button
												onclick={() =>
													unlinkInstagramAccount(item.compte.id, item.compte.instagram_account_id)}
												class="btn btn-xs btn-ghost hover:bg-base-200 flex-shrink-0"
												disabled={isLoadingInstagram}
												title="Libérer le compte Instagram"
											>
												{#if isLoadingInstagram}
													<Loader2 class="w-3 h-3 animate-spin" />
												{:else}
													<X class="w-3 h-3" />
												{/if}
											</button>
										</div>
									{:else}
										<!-- Sélecteur de compte Instagram disponible -->
										<Select.Root
											type="single"
											disabled={isLoadingInstagram || availableInstagramAccounts.length === 0}
										>
											<Select.Trigger class="w-36 h-7 text-xs">
												<span class="text-xs truncate"> Sélectionner </span>
											</Select.Trigger>
											<Select.Content>
												{#each availableInstagramAccounts as account}
													<Select.Item
														value={account.id.toString()}
														label={account.username || `Compte ${account.id}`}
														onclick={() => linkInstagramAccount(item.compte.id, account.id)}
													>
														{account.username || `Compte ${account.id}`}
													</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									{/if}
								</div>
							</td>
							<td class="p-2 h-12">
								<span class="text-sm">{formatCreationDate(item.compte.createdAt)}</span>
							</td>
							<td class="p-2 h-12">
								<div class="flex space-x-2 items-center justify-end">
									{#if item.compte.note}
										<Popover.Root>
											<Popover.Trigger>
												<button
													class="hover:bg-base-200 p-1 rounded transition-colors cursor-pointer"
												>
													<Info class="w-4 h-4" color="#3b82f6" />
												</button>
											</Popover.Trigger>
											<Popover.Content class="w-80">
												<div class="space-y-2">
													<h4 class="text-sm font-semibold">Note</h4>
													<p class="text-sm text-muted-foreground">
														{item.compte.note}
													</p>
												</div>
											</Popover.Content>
										</Popover.Root>
									{/if}
									<button
										onclick={() => editCompte(item.compte)}
										class="hover:bg-base-200 p-1 rounded transition-colors cursor-pointer"
										disabled={isEditingAccount}
									>
										<Pencil class="w-4 h-4" color="#f39b59" />
									</button>
									<button
										onclick={() => confirmDeleteCompte(item.compte.id)}
										class="hover:bg-base-200 p-1 rounded transition-colors cursor-pointer"
										disabled={isDeletingAccount}
									>
										{#if isDeletingAccount}
											<Loader2 class="w-4 h-4 animate-spin" />
										{:else}
											<Trash class="w-4 h-4" color="#e1504f" />
										{/if}
									</button>
								</div>
							</td>
						</tr>
					{:else}
						<tr
							class="dashed-row hover:border hover:border-bleu-400 cursor-pointer text-neutral-content/90"
							onclick={() => addAccountForCity(item.ville, currentFilter)}
							title="Cliquer pour ajouter un compte pour {item.ville}"
						>
							<td class="p-2 h-12 text-left">
								<Plus class="w-4 h-4 ml-1 text-success" />
							</td>
							<td class="p-2 h-12">
								<span class="empty-cell font-bold">
									{currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)}
								</span>
							</td>
							<td class="p-2 h-12">
								<span class="empty-cell text-sm">-</span>
							</td>
							<td class="p-2 h-12">
								<span class="empty-cell text-sm">-</span>
							</td>
							<td class="p-2 h-12 font-medium">
								{item.ville}
							</td>
							<td class="p-2 h-12">
								<span class="empty-cell text-sm">-</span>
							</td>
							<td class="p-2 h-12">
								<span class="empty-cell text-sm">-</span>
							</td>
							<td class="p-2 h-12">
								<span class="empty-cell text-sm flex items-center justify-end gap-1"> - </span>
							</td>
						</tr>
					{/if}
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<!-- Dialog de confirmation de suppression -->
<DeleteConfirmationDialog
	bind:open={showDeleteConfirmation}
	title="Supprimer le compte"
	description="Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible."
	confirmText="Supprimer"
	cancelText="Annuler"
	isLoading={isDeletingAccount}
	onConfirm={handleDeleteConfirm}
	onCancel={handleDeleteCancel}
/>

<!-- Dialog de confirmation de suppression en lot -->
<DeleteConfirmationDialog
	bind:open={showBulkDeleteConfirmation}
	title="Supprimer les comptes sélectionnés"
	description="Êtes-vous sûr de vouloir supprimer les {selectedAccountIds.size} comptes sélectionnés ? Cette action est irréversible."
	confirmText="Supprimer tout"
	cancelText="Annuler"
	isLoading={isDeletingAccount}
	onConfirm={handleBulkDeleteConfirm}
	onCancel={handleBulkDeleteCancel}
/>

<!-- Dialog d'ajout de compte -->
<AddApplicationDialog
	bind:open={showAddCompteDialog}
	ville={selectedVille}
	platform={selectedPlatform}
	isLoading={isAddingAccount}
	onClose={handleAddCompteCancel}
	onConfirm={handleAddCompteConfirm}
/>

<!-- Dialog d'édition de compte -->
<AddApplicationDialog
	bind:open={showEditCompteDialog}
	ville={selectedVille}
	platform={selectedPlatform}
	isLoading={isEditingAccount}
	onClose={handleEditCompteCancel}
	onConfirm={handleEditCompteConfirm}
	editData={compteToEdit}
/>

<style>
	/* Styles pour le tableau à largeur fixe */
	table {
		table-layout: fixed;
		width: 100%;
	}

	table td,
	table th {
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Exception pour la colonne Instagram qui peut avoir du contenu flexible */
	table td:nth-child(6) {
		white-space: normal;
	}

	.statut {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
	}

	.dashed-row {
		/* border: 2px dashed red; */
		opacity: 0.5;
		background-color: hsl(var(--b2) / 0.3);
		pointer-events: auto;
		transition: all 0.3s ease;
		border-radius: 8px;
		margin: 2px 0;
		border: 2px dashed #2c2b31;
	}

	.dashed-row:hover {
		opacity: 0.8;
		background-color: hsl(var(--b3) / 0.5);
		border: 2px dashed #2c2b31;
		cursor: pointer;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px hsl(var(--bc) / 0.1);
	}

	.dashed-row td {
		color: hsl(var(--bc) / 0.4) !important;
		font-style: italic;
	}

	.dashed-row:hover td {
		color: hsl(var(--bc) / 0.7) !important;
	}

	.add-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 2px dashed hsl(var(--bc) / 0.4);
		border-radius: 0.5rem;
		background-color: transparent;
		color: hsl(var(--bc) / 0.6);
		transition: all 0.2s;
		font-size: 0.75rem;
	}

	.add-button:hover {
		border-color: hsl(var(--p));
		color: hsl(var(--p));
		background-color: hsl(var(--p) / 0.1);
	}

	.empty-cell {
		color: hsl(var(--bc) / 0.3);
		font-weight: 300;
	}

	.dashed-row .empty-cell {
		color: hsl(var(--bc) / 0.4);
		font-style: italic;
	}

	.dashed-row:hover .empty-cell {
		color: hsl(var(--bc) / 0.6);
	}

	.disabled-icon {
		opacity: 0.3;
		filter: grayscale(100%);
	}

	.dashed-row:hover .disabled-icon {
		opacity: 0.6;
		filter: grayscale(50%);
	}
</style>
