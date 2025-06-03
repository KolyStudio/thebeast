<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { CirclePlus, Loader2 } from 'lucide-svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import dayjs from 'dayjs';

	interface Props {
		open: boolean;
		onClose: () => void;
		onConfirm: (data: ApplicationData) => void;
		ville: string;
		platform: string;
		isLoading?: boolean;
		editData?: any;
	}

	export interface ApplicationData {
		id: string;
		createdAt: string;
		statut: string;
		note: string;
	}

	let {
		open = $bindable(),
		onClose,
		onConfirm,
		ville,
		platform,
		isLoading = false,
		editData = null
	}: Props = $props();

	// États du formulaire
	let formData = $state({
		id: '',
		createdAt: dayjs().format('YYYY-MM-DD'),
		statut: 'nouveau',
		note: ''
	});

	// État pour les erreurs de validation
	let errors = $state({
		id: '',
		createdAt: '',
		general: ''
	});

	// Liste des statuts disponibles
	const availablestatutes = [
		{ value: 'nouveau', label: 'Nouveau' },
		{ value: 'actif', label: 'Actif' },
		{ value: 'shadowban', label: 'Shadowban' },
		{ value: 'banni', label: 'Banni' },
		{ value: 'verification', label: 'Vérification' },
		{ value: 'warming', label: 'Warming' }
	];

	/**
	 * Fonction pour réinitialiser les erreurs
	 */
	function clearErrors() {
		errors = {
			id: '',
			createdAt: '',
			general: ''
		};
	}

	/**
	 * Fonction pour effacer une erreur spécifique
	 */
	function clearFieldError(field: keyof typeof errors) {
		errors[field] = '';
	}

	/**
	 * Fonction pour valider le formulaire
	 */
	function validateForm(): boolean {
		clearErrors();
		let isValid = true;

		if (!formData.id.trim()) {
			errors.id = 'Veuillez saisir un ID.';
			isValid = false;
		}

		if (!formData.createdAt) {
			errors.createdAt = 'Veuillez sélectionner une date de création.';
			isValid = false;
		}

		return isValid;
	}

	/**
	 * Fonction pour réinitialiser le formulaire
	 */
	function resetForm() {
		formData = {
			id: '',
			createdAt: dayjs().format('YYYY-MM-DD'),
			statut: 'nouveau',
			note: ''
		};
		clearErrors();
	}

	/**
	 * Fonction pour gérer la soumission du formulaire
	 */
	function handleSubmit() {
		if (!validateForm()) return;

		onConfirm({
			id: formData.id,
			createdAt: formData.createdAt,
			statut: formData.statut,
			note: formData.note
		});
	}

	/**
	 * Fonction pour annuler et réinitialiser le formulaire
	 */
	function handleCancel() {
		resetForm();
		onClose();
	}

	// Effet pour initialiser le formulaire avec les données d'édition
	$effect(() => {
		if (open && editData) {
			formData = {
				id: editData.application || '',
				createdAt: editData.createdAt
					? dayjs(editData.createdAt).format('YYYY-MM-DD')
					: dayjs().format('YYYY-MM-DD'),
				statut: editData.statut || 'nouveau',
				note: editData.note || ''
			};
		} else if (open && !editData) {
			resetForm();
		}
	});

	// Effet pour réinitialiser le formulaire quand le dialog se ferme
	$effect(() => {
		if (!open && !isLoading && !editData) {
			resetForm();
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<div class="flex space-x-3">
				<div
					class="h-10 w-10 bg-base-300 rounded-xl border-base-100 border-dashed border flex items-center justify-center flex-shrink-0"
				>
					<CirclePlus class="h-5 w-5" />
				</div>
				<div>
					<h1 class="font-medium">{editData ? 'Modifier le compte' : 'Ajouter un compte'}</h1>
					<h2 class="text-neutral-content text-sm">
						Ajoutez un nouveau compte pour {ville} sur {platform.charAt(0).toUpperCase() +
							platform.slice(1)}.
					</h2>
				</div>
			</div>
		</Dialog.Header>

		<!-- Message d'erreur général -->
		{#if errors.general}
			<div class="bg-error/10 border border-error/20 text-error rounded-lg p-3 text-sm">
				{errors.general}
			</div>
		{/if}

		<div class="flex flex-col gap-4">
			<!-- ID -->
			<div class="flex w-full flex-col gap-1.5">
				<Label for="app-id">ID de l'application</Label>
				<Input
					id="app-id"
					bind:value={formData.id}
					placeholder="Saisissez l'ID unique"
					disabled={isLoading}
					class={errors.id ? 'border-error focus-visible:border-error' : ''}
					oninput={() => clearFieldError('id')}
				/>
				{#if errors.id}
					<span class="text-error text-sm">{errors.id}</span>
				{/if}
			</div>

			<!-- Date de création -->
			<div class="flex w-full flex-col gap-1.5">
				<Label for="created-date">Date de création</Label>
				<Input
					id="created-date"
					type="date"
					bind:value={formData.createdAt}
					disabled={isLoading}
					class={errors.createdAt ? 'border-error focus-visible:border-error' : ''}
					onchange={() => clearFieldError('createdAt')}
				/>
				{#if errors.createdAt}
					<span class="text-error text-sm">{errors.createdAt}</span>
				{/if}
			</div>

			<!-- Statut -->
			<div class="flex w-full flex-col gap-1.5">
				<Label for="statut">Statut</Label>
				<Select.Root type="single" disabled={isLoading}>
					<Select.Trigger class="w-full cursor-pointer">
						<span
							>{availablestatutes.find((s) => s.value === formData.statut)?.label ||
								'Nouveau'}</span
						>
					</Select.Trigger>
					<Select.Content>
						{#each availablestatutes as statut}
							<Select.Item value={statut.value} onclick={() => (formData.statut = statut.value)}
								>{statut.label}</Select.Item
							>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<!-- Ville (lecture seule) -->
			<div class="flex w-full flex-col gap-1.5">
				<Label for="ville">Ville</Label>
				<Input id="ville" value={ville} disabled class="bg-base-200 cursor-not-allowed" />
			</div>

			<!-- Note -->
			<div class="flex w-full flex-col gap-1.5">
				<Label for="note"
					>Note <span class="text-xs text-neutral-content/50">(optionnel)</span></Label
				>
				<Textarea
					id="note"
					bind:value={formData.note}
					placeholder="Ajoutez une note ou des informations supplémentaires..."
					class="min-h-[80px]"
					disabled={isLoading}
				/>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={handleCancel} disabled={isLoading}>Annuler</Button>
			<Button onclick={handleSubmit} class="bg-white hover:bg-white" disabled={isLoading}>
				{#if isLoading}
					<Loader2 class="w-4 h-4 animate-spin mr-2" />
				{/if}
				{editData ? 'Modifier le compte' : 'Ajouter le compte'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
