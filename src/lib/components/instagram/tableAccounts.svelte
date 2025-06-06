<script lang="ts">
	import { Pencil, Trash, Loader2 } from 'lucide-svelte';
	import { type InstagramAccount } from '$lib/api/instagramAccounts.svelte';
	import { formatRelativeTime } from '$lib/utils/dateUtils';

	interface Props {
		accounts: InstagramAccount[];
		isLoading: boolean;
		selectedAccountIds: Set<number>;
		onEdit: (account: InstagramAccount) => void;
		onDelete: (id: number) => void;
		onToggleSelect: (id: number) => void;
		onToggleSelectAll: () => void;
		onStatusChange: (accountId: number, newStatus: string) => Promise<void>;
	}

	let {
		accounts,
		isLoading,
		selectedAccountIds,
		onEdit,
		onDelete,
		onToggleSelect,
		onToggleSelectAll,
		onStatusChange
	}: Props = $props();

	function capitalizeStatus(status: string | null) {
		if (!status) return 'Inconnu';
		return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
	}

	/**
	 * Fonction pour obtenir la couleur de fond du statut
	 */
	function getStatusColor(status: string | null) {
		switch (status?.toLowerCase()) {
			case 'actif':
				return 'bg-success/20 text-success/90';
			case 'disponible':
				return 'bg-success/20 text-success/90';
			case 'en cours':
				return 'bg-info/20 text-info/90';
			case 'utilisé':
				return 'bg-orange-500/20 text-orange-500';
			case 'nouveau':
				return 'bg-purple-500/20 text-purple-500';
			case 'erreur':
				return 'bg-warning/20 text-warning/90';
			case 'banni':
			case 'shadowban':
			case 'verification':
			case 'warming':
				return 'bg-error/30 text-error/90';
			default:
				return 'bg-gray/20 text-gray/90';
		}
	}

	/**
	 * Fonction pour obtenir la couleur du point de statut
	 */
	function getStatusDotClass(status: string | null) {
		switch (status?.toLowerCase()) {
			case 'actif':
				return 'bg-success';
			case 'disponible':
				return 'bg-success';
			case 'en cours':
				return 'bg-info';
			case 'utilisé':
				return 'bg-orange-500';
			case 'nouveau':
				return 'bg-purple-500';
			case 'erreur':
				return 'bg-warning';
			case 'banni':
			case 'shadowban':
			case 'verification':
			case 'warming':
				return 'bg-error';
			default:
				return 'bg-gray-400';
		}
	}

	function getChangeColor(changed: boolean | null) {
		return changed ? 'bg-success/20 text-success/90' : 'bg-error/20 text-error/90';
	}

	// Liste des statuts disponibles pour le dropdown
	const availableStatuses = [
		'actif',
		'en cours',
		'disponible',
		'utilisé',
		'nouveau',
		'erreur',
		'banni'
	];

	/**
	 * Fonction pour gérer le changement de statut
	 */
	async function handleStatusChange(accountId: number, newStatus: string) {
		await onStatusChange(accountId, newStatus);
	}

	// État pour contrôler l'ouverture des dropdowns
	let openDropdownId = $state<number | null>(null);

	/**
	 * Fonction pour basculer l'état d'un dropdown
	 */
	function toggleDropdown(accountId: number) {
		if (openDropdownId === accountId) {
			openDropdownId = null;
		} else {
			openDropdownId = accountId;
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

	// Computed pour vérifier si tous les comptes sont sélectionnés
	let allSelected = $derived(
		accounts.length > 0 && accounts.every((account) => selectedAccountIds.has(account.id))
	);
</script>

<table class="w-full border-collapse overflow-visible text-center text-sm">
	<thead>
		<tr class="bg-base-200 h-12 text-neutral-content/80 text-center">
			<th class="p-2 font-semibold text-center w-12">
				<input
					type="checkbox"
					class="checkbox checkbox-success bg-base-100 rounded"
					checked={allSelected}
					onchange={onToggleSelectAll}
				/>
			</th>
			<th class="p-2 first:text-left font-semibold text-center">Statut</th>
			<th class="p-2 first:text-left font-semibold text-center">Compte</th>
			<th class="p-2 first:text-left font-semibold text-center">Pseudo changé</th>
			<th class="p-2 first:text-left font-semibold text-center">Nom de l'agent</th>
			<th class="p-2 first:text-left font-semibold text-center">Changements</th>
			<th class="p-2 first:text-left font-semibold text-center">Actions</th>
		</tr>
	</thead>
	<tbody>
		{#if isLoading}
			<tr>
				<td colspan="7" class="p-8 text-center text-neutral-content/60">
					<div class="flex items-center justify-center gap-2">
						<Loader2 class="h-6 w-6 animate-spin" />
						<span>Chargement des comptes...</span>
					</div>
				</td>
			</tr>
		{:else if accounts.length === 0}
			<tr>
				<td colspan="7" class="p-8 text-center text-neutral-content/60">
					Aucun compte trouvé pour le filtre.
				</td>
			</tr>
		{:else}
			{#each accounts as account, index}
				<tr class="bg-base-100 text-white">
					<td class="p-2 h-12 text-center">
						<input
							type="checkbox"
							class="checkbox checkbox-success bg-base-200 rounded"
							checked={selectedAccountIds.has(account.id)}
							onchange={() => onToggleSelect(account.id)}
						/>
					</td>
					<td class="p-2 h-12 relative {index === accounts.length - 1 ? 'rounded-bl-2xl' : ''}">
						<div class="relative dropdown-container">
							<div
								class="px-4 py-1 flex items-center gap-2 w-fit rounded m-auto cursor-pointer hover:opacity-80 transition-opacity text-xs {getStatusColor(
									account.statut
								)}"
								onclick={() => toggleDropdown(account.id)}
							>
								<div class="status {getStatusDotClass(account.statut)}"></div>
								<p>{capitalizeStatus(account.statut)}</p>
								<svg
									class="w-3 h-3 ml-1 transition-transform {openDropdownId === account.id
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
							{#if openDropdownId === account.id}
								<ul
									class="menu bg-base-100 rounded-box z-[9999] w-52 p-2 shadow border border-base-200 absolute top-full left-1/2 transform -translate-x-1/2 mt-1"
								>
									{#each availableStatuses as status}
										<li>
											<button
												class="flex items-center gap-2 w-full text-left hover:bg-base-200 p-2 rounded {account.statut?.toLowerCase() ===
												status
													? 'bg-base-200'
													: ''}"
												onclick={() => {
													handleStatusChange(account.id, status);
													closeDropdown();
												}}
												disabled={isLoading}
											>
												<div class="status {getStatusDotClass(status)}"></div>
												<span>{capitalizeStatus(status)}</span>
											</button>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</td>
					<td class="p-2 h-12">
						{#if account.username}
							<a
								class="text-info font-bold"
								href="https://www.instagram.com/{account.username.replace('@', '')}"
								target="_blank"
							>
								{account.username}
							</a>
						{:else}
							<span class="text-white/60">Pas de nom d'utilisateur</span>
						{/if}
					</td>
					<td class="p-2 h-12">
						<span
							class="text-sm {formatRelativeTime(account.last_username_changed) === 'Jamais'
								? 'text-white/60'
								: 'text-white'}"
						>
							{formatRelativeTime(account.last_username_changed)}
						</span>
					</td>
					<td class="p-2 h-12 text-white">
						{account.modele_name || 'Aucun modèle'}
					</td>
					<td class="p-2 h-12">
						<div class="flex gap-1 justify-center flex-wrap">
							<div
								class="px-2 py-1 flex items-center gap-1 w-fit rounded text-xs {getChangeColor(
									account.changed_username
								)}"
							>
								<p>Pseudo</p>
							</div>
							<div
								class="px-2 py-1 flex items-center gap-1 w-fit rounded text-xs {getChangeColor(
									account.changed_bio
								)}"
							>
								<p>Bio</p>
							</div>
							<div
								class="px-2 py-1 flex items-center gap-1 w-fit rounded text-xs {getChangeColor(
									account.changed_photo
								)}"
							>
								<p>Photo</p>
							</div>
							<div
								class="px-2 py-1 flex items-center gap-1 w-fit rounded text-xs {getChangeColor(
									account.changed_firstname
								)}"
							>
								<p>Nom</p>
							</div>
							<div
								class="px-2 py-1 flex items-center gap-1 w-fit rounded text-xs {getChangeColor(
									account.changed_url
								)}"
							>
								<p>URL</p>
							</div>
							<div
								class="px-2 py-1 flex items-center gap-1 w-fit rounded text-xs {getChangeColor(
									account.changed_statut
								)}"
							>
								<p>Statut</p>
							</div>
							<div
								class="px-2 py-1 flex items-center gap-1 w-fit rounded text-xs {getChangeColor(
									account.changed_type
								)}"
							>
								<p>Type</p>
							</div>
						</div>
					</td>
					<td class="p-2 h-12 {index === accounts.length - 1 ? 'rounded-br-2xl' : ''}">
						<div class="flex space-x-2 items-center justify-center">
							<button
								onclick={() => onEdit(account)}
								class="hover:bg-base-200 p-1 rounded transition-colors cursor-pointer"
								disabled={isLoading}
							>
								<Pencil class="w-4 h-4" color="#f39b59" />
							</button>
							<button
								onclick={() => onDelete(account.id)}
								class="hover:bg-base-200 p-1 rounded transition-colors cursor-pointer"
								disabled={isLoading}
							>
								{#if isLoading}
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
