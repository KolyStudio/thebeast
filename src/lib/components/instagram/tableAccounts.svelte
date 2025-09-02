<script lang="ts">
	import { Pencil, Trash, Loader2 } from 'lucide-svelte';
	import { type InstagramAccount } from '$lib/api/instagramAccounts.svelte';
	import dayjs from 'dayjs';

	interface Props {
		accounts: InstagramAccount[];
		isLoading: boolean;
		selectedAccountIds: Set<number>;
		onEdit: (account: InstagramAccount) => void;
		onDelete: (id: number) => void;
		onToggleSelect: (id: number) => void;
		onToggleSelectAll: () => void;
		onStatusChange: (accountId: number, newStatus: string) => Promise<void>;
		onChangeToggle?: (accountId: number, changeType: string, newValue: boolean) => Promise<void>;
		onWarmupPhaseChange: (accountId: number, warmupPhase: number | null) => Promise<void>;
	}

	let {
		accounts,
		isLoading,
		selectedAccountIds,
		onEdit,
		onDelete,
		onToggleSelect,
		onToggleSelectAll,
		onStatusChange,
		onChangeToggle,
		onWarmupPhaseChange
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
			case 'warmup':
				return 'bg-yellow-500/20 text-yellow-500';
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
			case 'warmup':
				return 'bg-yellow-500';
			default:
				return 'bg-gray-400';
		}
	}

	function getChangeColor(changed: boolean | null) {
		return changed ? 'bg-success/20 text-success/90' : 'bg-error/20 text-error/90';
	}

	/**
	 * Fonction pour basculer l'état d'un changement
	 */
	async function toggleChange(accountId: number, changeType: string, currentValue: boolean | null) {
		if (onChangeToggle) {
			const newValue = !currentValue;
			await onChangeToggle(accountId, changeType, newValue);
		}
	}

	/**
	 * Fonction pour obtenir l'icône d'un changement
	 */
	function getChangeIcon(changed: boolean | null) {
		return changed ? '✓' : '✗';
	}

	/**
	 * Fonction pour obtenir la couleur basée sur l'âge d'un événement
	 * Rouge: 3 jours ou plus, Orange: 2 jours exactement, Vert: moins de 2 jours
	 */
	function getAgeBasedColor(date: string | Date | null | undefined): string {
		if (!date) {
			return 'bg-gray-500/20 text-gray-500';
		}

		try {
			const targetDate = dayjs(date);
			const now = dayjs();

			if (!targetDate.isValid()) {
				return 'bg-gray-500/20 text-gray-500';
			}

			const daysDiff = now.diff(targetDate, 'day');

			if (daysDiff >= 3) {
				return 'bg-error/20 text-error/90'; // Rouge
			} else if (daysDiff === 2) {
				return 'bg-warning/20 text-warning/90'; // Orange
			} else {
				return 'bg-success/20 text-success/90'; // Vert
			}
		} catch (error) {
			return 'bg-gray-500/20 text-gray-500';
		}
	}

	/**
	 * Fonction pour formater le temps relatif sans "il y a"
	 */
	function formatRelativeTimeWithoutPrefix(date: string | Date | null | undefined): string {
		if (!date) {
			return 'Jamais';
		}

		try {
			const targetDate = dayjs(date);
			const now = dayjs();

			if (!targetDate.isValid()) {
				return 'Date invalide';
			}

			if (targetDate.isSame(now, 'day')) {
				return "Aujourd'hui";
			} else if (targetDate.isSame(now.subtract(1, 'day'), 'day')) {
				return 'Hier';
			} else if (targetDate.isSame(now.subtract(2, 'day'), 'day')) {
				return '2 jours';
			} else {
				const daysDiff = now.diff(targetDate, 'day');
				if (daysDiff < 30) {
					return `${daysDiff} jours`;
				} else {
					// Pour les dates plus anciennes, utiliser le format court
					return targetDate.format('DD/MM/YY');
				}
			}
		} catch (error) {
			console.error('Erreur lors du formatage de la date:', error);
			return 'Date invalide';
		}
	}

	// Liste des statuts disponibles pour le dropdown
	const availableStatuses = [
		'actif',
		'en cours',
		'disponible',
		'utilisé',
		'nouveau',
		'erreur',
		'banni',
		'warmup'
	];

	/**
	 * Fonction pour gérer le changement de statut
	 */
	async function handleStatusChange(accountId: number, newStatus: string) {
		await onStatusChange(accountId, newStatus);
	}

	/**
	 * Fonction pour gérer le changement de phase de warmup
	 */
	async function handleWarmupPhaseChange(accountId: number, warmupPhase: number | null) {
		await onWarmupPhaseChange(accountId, warmupPhase);
	}

	// État pour contrôler l'ouverture des dropdowns
	let openDropdownId = $state<number | string | null>(null);

	/**
	 * Fonction pour basculer l'état d'un dropdown
	 */
	function toggleDropdown(accountId: number | string) {
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
			<th class="p-2 first:text-left font-semibold text-center">Warmup</th>
			<th class="p-2 first:text-left font-semibold text-center">Dernier warmup</th>
			<th class="p-2 first:text-left font-semibold text-center">Changements</th>
			<th class="p-2 first:text-left font-semibold text-center">Actions</th>
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
		{:else if accounts.length === 0}
			<tr>
				<td colspan="8" class="p-8 text-center text-neutral-content/60">
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
									class="menu bg-base-100 rounded-box z-[9999] w-52 p-2 shadow absolute top-full left-1/2 transform -translate-x-1/2 mt-1"
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
						<div class="flex justify-center">
							<div
								class="px-3 py-1 flex items-center gap-2 w-fit rounded text-xs transition-all duration-200 hover:scale-105 hover:shadow-sm {getAgeBasedColor(
									account.last_username_changed
								)}"
							>
								<div
									class="w-2 h-2 rounded-full {account.last_username_changed
										? dayjs().diff(dayjs(account.last_username_changed), 'day') >= 3
											? 'bg-error/90'
											: dayjs().diff(dayjs(account.last_username_changed), 'day') === 2
												? 'bg-warning/90'
												: 'bg-success/90'
										: 'bg-gray-500'}"
								></div>
								<span class="font-medium">
									{formatRelativeTimeWithoutPrefix(account.last_username_changed)}
								</span>
							</div>
						</div>
					</td>
					<td class="p-2 h-12 relative">
						<div class="relative dropdown-container">
							<div
								class="px-3 py-1 flex items-center gap-2 w-fit rounded m-auto cursor-pointer hover:opacity-80 transition-opacity text-xs {account.warmup_phase ==
								5
									? 'bg-success/20 text-success/90'
									: account.warmup_phase
										? 'bg-warning/20 text-warning/90'
										: 'bg-gray-500/20 text-gray-500'}"
								onclick={() => toggleDropdown(`warmup_${account.id}`)}
							>
								<div
									class="w-2 h-2 rounded-full {account.warmup_phase == 5
										? 'bg-success/90'
										: account.warmup_phase
											? 'bg-warning/90'
											: 'bg-gray-500'}"
								></div>
								{#if account.warmup_phase === 5}
									<p class="text-success/90 font-semibold">Terminé</p>
								{:else if account.warmup_phase === null}
									<p>Aucune</p>
								{:else if account.warmup_phase === 0}
									<p>Phase 0</p>
								{:else if account.warmup_phase >= 5}
									<p class="text-success/90 font-semibold">Terminé</p>
								{:else}
									<p>Phase {account.warmup_phase}</p>
								{/if}
								<svg
									class="w-3 h-3 ml-1 transition-transform {openDropdownId ===
									`warmup_${account.id}`
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
							{#if openDropdownId === `warmup_${account.id}`}
								<ul
									class="menu bg-base-100 rounded-box z-[9999] w-32 p-2 shadow absolute top-full left-1/2 transform -translate-x-1/2 mt-1"
								>
									<li>
										<button
											class="flex items-center gap-2 w-full text-left hover:bg-base-200 p-2 rounded {account.warmup_phase ===
											null
												? 'bg-base-200'
												: ''}"
											onclick={() => {
												handleWarmupPhaseChange(account.id, null);
												closeDropdown();
											}}
											disabled={isLoading}
										>
											<div class="w-2 h-2 rounded-full bg-gray-500"></div>
											<span>Aucune</span>
										</button>
									</li>
									{#each [0, 1, 2, 3, 4] as phase}
										<li>
											<button
												class="flex items-center gap-2 w-full text-left hover:bg-base-200 p-2 rounded {account.warmup_phase ===
												phase
													? 'bg-base-200'
													: ''}"
												onclick={() => {
													handleWarmupPhaseChange(account.id, phase);
													closeDropdown();
												}}
												disabled={isLoading}
											>
												<div class="w-2 h-2 rounded-full bg-yellow-500"></div>
												<span>Phase {phase}</span>
											</button>
										</li>
									{/each}
									<!-- Phase 5 - Terminé -->
									<li>
										<button
											class="flex items-center gap-2 w-full text-left hover:bg-base-200 p-2 rounded {account.warmup_phase ===
											5
												? 'bg-base-200'
												: ''}"
											onclick={() => {
												handleWarmupPhaseChange(account.id, 5);
												closeDropdown();
											}}
											disabled={isLoading}
										>
											<div class="w-2 h-2 rounded-full bg-green-500"></div>
											<span>Terminé</span>
										</button>
									</li>
								</ul>
							{/if}
						</div>
					</td>
					<td class="p-2 h-12">
						<div class="flex justify-center">
							<div
								class="px-3 py-1 flex items-center gap-2 w-fit rounded text-xs transition-all duration-200 hover:scale-105 hover:shadow-sm {getAgeBasedColor(
									account.last_warmup
								)}"
							>
								<div
									class="w-2 h-2 rounded-full {account.last_warmup
										? dayjs().diff(dayjs(account.last_warmup), 'day') >= 3
											? 'bg-error/90'
											: dayjs().diff(dayjs(account.last_warmup), 'day') === 2
												? 'bg-warning/90'
												: 'bg-success/90'
										: 'bg-gray-500'}"
								></div>
								<span class="font-medium">
									{formatRelativeTimeWithoutPrefix(account.last_warmup)}
								</span>
							</div>
						</div>
					</td>
					<td class="p-2 h-12">
						<div class="flex gap-1 justify-center flex-wrap">
							<button
								class="px-2 py-1 flex items-center gap-1 w-fit rounded text-xs transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-pointer {getChangeColor(
									account.changed_username
								)}"
								onclick={() =>
									toggleChange(account.id, 'changed_username', account.changed_username)}
								disabled={isLoading}
								title="Cliquez pour basculer le statut du pseudo"
							>
								<span class="font-medium">{getChangeIcon(account.changed_username)}</span>
								<p>Pseudo</p>
							</button>
							<button
								class="px-2 py-1 flex items-center gap-1 w-fit rounded text-xs transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-pointer {getChangeColor(
									account.changed_bio
								)}"
								onclick={() => toggleChange(account.id, 'changed_bio', account.changed_bio)}
								disabled={isLoading}
								title="Cliquez pour basculer le statut de la bio"
							>
								<span class="font-medium">{getChangeIcon(account.changed_bio)}</span>
								<p>Bio</p>
							</button>
							<button
								class="px-2 py-1 flex items-center gap-1 w-fit rounded text-xs transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-pointer {getChangeColor(
									account.changed_photo
								)}"
								onclick={() => toggleChange(account.id, 'changed_photo', account.changed_photo)}
								disabled={isLoading}
								title="Cliquez pour basculer le statut de la photo"
							>
								<span class="font-medium">{getChangeIcon(account.changed_photo)}</span>
								<p>Photo</p>
							</button>
							<button
								class="px-2 py-1 flex items-center gap-1 w-fit rounded text-xs transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-pointer {getChangeColor(
									account.changed_firstname
								)}"
								onclick={() =>
									toggleChange(account.id, 'changed_firstname', account.changed_firstname)}
								disabled={isLoading}
								title="Cliquez pour basculer le statut du nom"
							>
								<span class="font-medium">{getChangeIcon(account.changed_firstname)}</span>
								<p>Nom</p>
							</button>
							<button
								class="px-2 py-1 flex items-center gap-1 w-fit rounded text-xs transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-pointer {getChangeColor(
									account.changed_url
								)}"
								onclick={() => toggleChange(account.id, 'changed_url', account.changed_url)}
								disabled={isLoading}
								title="Cliquez pour basculer le statut de l'URL"
							>
								<span class="font-medium">{getChangeIcon(account.changed_url)}</span>
								<p>URL</p>
							</button>
							<button
								class="px-2 py-1 flex items-center gap-1 w-fit rounded text-xs transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-pointer {getChangeColor(
									account.changed_statut
								)}"
								onclick={() => toggleChange(account.id, 'changed_statut', account.changed_statut)}
								disabled={isLoading}
								title="Cliquez pour basculer le statut du statut"
							>
								<span class="font-medium">{getChangeIcon(account.changed_statut)}</span>
								<p>Statut</p>
							</button>
							<button
								class="px-2 py-1 flex items-center gap-1 w-fit rounded text-xs transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-pointer {getChangeColor(
									account.changed_type
								)}"
								onclick={() => toggleChange(account.id, 'changed_type', account.changed_type)}
								disabled={isLoading}
								title="Cliquez pour basculer le statut du type"
							>
								<span class="font-medium">{getChangeIcon(account.changed_type)}</span>
								<p>Type</p>
							</button>
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

<style>
	.status {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
	}
</style>
