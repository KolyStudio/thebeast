<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Scale, Loader2, Calendar as CalendarIcon, Plus, Minus } from 'lucide-svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import { cn } from '$lib/utils.js';
	import { supabase } from '$lib/supabaseClient';
	import { CalendarDate, today, getLocalTimeZone, type DateValue } from '@internationalized/date';

	interface Props {
		open: boolean;
		selectedWeight?: { date: Date; weight: number; id?: number } | null;
		onClose: () => void;
		onSave?: () => void;
	}

	let { open = $bindable(), selectedWeight = null, onClose, onSave }: Props = $props();

	// État du formulaire
	let formData = $state({
		date: today(getLocalTimeZone()) as DateValue,
		weight: 0,
		isCycleStart: false
	});

	let isLoading = $state(false);
	let isDeleting = $state(false);
	let errors = $state<{ date?: string; weight?: string }>({});
	let calendarOpen = $state(false);

	// État pour la dernière pesée
	let lastWeight = $state<{ date: Date; weight: number } | null>(null);

	// Variable pour le Calendar (qui attend un tableau)
	let calendarValue = $state<DateValue | undefined>(today(getLocalTimeZone()));

	// Fonctions de conversion entre Date et DateValue
	function dateToDateValue(date: Date): DateValue {
		return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
	}

	function dateValueToDate(dateValue: DateValue): Date {
		return dateValue.toDate(getLocalTimeZone());
	}

	function dateValueToISOString(dateValue: DateValue): string {
		// Utiliser directement les propriétés de DateValue pour éviter les problèmes de fuseau horaire
		const year = dateValue.year;
		const month = dateValue.month.toString().padStart(2, '0');
		const day = dateValue.day.toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	// Réinitialiser le formulaire quand le dialog s'ouvre
	$effect(() => {
		if (open) {
			if (selectedWeight) {
				// Mode édition - ne pas modifier le comportement existant
				const dateValue = dateToDateValue(new Date(selectedWeight.date));
				formData.date = dateValue;
				calendarValue = dateValue;
				formData.weight = selectedWeight.weight;
			} else {
				// Mode création - récupérer la dernière pesée et l'utiliser comme valeur initiale
				fetchLastWeight().then(() => {
					// Utiliser la dernière pesée comme valeur initiale si disponible
					formData.weight = lastWeight?.weight ?? 0;
				});

				const todayValue = today(getLocalTimeZone());
				formData.date = todayValue;
				calendarValue = todayValue;
				formData.isCycleStart = false; // Réinitialiser la case à cocher
			}
			errors = {};
		}
	});

	// Validation du formulaire
	function validateForm(): boolean {
		errors = {};
		let isValid = true;

		if (!formData.date) {
			errors.date = 'La date est requise';
			isValid = false;
		}

		if (!formData.weight || formData.weight <= 0) {
			errors.weight = 'Le poids doit être supérieur à 0';
			isValid = false;
		} else if (formData.weight > 500) {
			errors.weight = 'Le poids ne peut pas dépasser 500 kg';
			isValid = false;
		}

		return isValid;
	}

	// Sauvegarder la pesée
	async function handleSave() {
		if (!validateForm()) return;

		isLoading = true;
		try {
			const weightData = {
				date: dateValueToISOString(formData.date),
				weight: formData.weight,
				is_cycle_start: formData.isCycleStart
			};

			if (selectedWeight?.id) {
				// Mode édition
				const { error } = await supabase
					.from('weights')
					.update(weightData)
					.eq('id', selectedWeight.id);

				if (error) throw error;
			} else {
				// Mode création
				const { error } = await supabase.from('weights').insert([weightData]);

				if (error) throw error;
			}

			onSave?.();
			handleClose();
		} catch (error) {
			console.error('Erreur lors de la sauvegarde:', error);
		} finally {
			isLoading = false;
		}
	}

	// Fermer le dialog
	function handleClose() {
		onClose();
		calendarOpen = false;
	}

	// Gérer le changement de date dans le calendrier
	function handleDateChange() {
		if (calendarValue) {
			formData.date = calendarValue;
		}
		calendarOpen = false;
	}

	// Supprimer la pesée
	async function handleDelete() {
		if (!selectedWeight?.id) return;

		isDeleting = true;
		try {
			const { error } = await supabase.from('weights').delete().eq('id', selectedWeight.id);

			if (error) throw error;

			onSave?.();
			handleClose();
		} catch (error) {
			console.error('Erreur lors de la suppression:', error);
			alert('Erreur lors de la suppression de la pesée.');
		} finally {
			isDeleting = false;
		}
	}

	// Formater la date pour l'affichage
	function formatDate(date: DateValue): string {
		const jsDate = dateValueToDate(date);
		return jsDate.toLocaleDateString('fr-FR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	// Fonctions d'ajustement du poids
	function incrementWeight() {
		formData.weight = Math.round((formData.weight + 0.1) * 10) / 10;
	}

	function decrementWeight() {
		if (formData.weight > 0.1) {
			formData.weight = Math.round((formData.weight - 0.1) * 10) / 10;
		}
	}

	// Gestionnaires pour forcer le format décimal avec point uniquement
	function handleWeightInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value;

		// Remplacer toutes les virgules par des points pour forcer le format anglais
		if (value.includes(',')) {
			const correctedValue = value.replace(/,/g, '.');
			target.value = correctedValue;
			formData.weight = parseFloat(correctedValue) || 0;
		}
	}

	function handleWeightKeydown(event: KeyboardEvent) {
		// Convertir les virgules en points lors de la frappe
		if (event.key === ',') {
			event.preventDefault();
			const target = event.target as HTMLInputElement;
			const start = target.selectionStart || 0;
			const end = target.selectionEnd || 0;
			const currentValue = target.value;

			// Insérer un point à la position du curseur
			const newValue = currentValue.slice(0, start) + '.' + currentValue.slice(end);
			target.value = newValue;

			// Repositionner le curseur après le point
			target.setSelectionRange(start + 1, start + 1);

			// Mettre à jour la valeur du formulaire
			formData.weight = parseFloat(newValue) || 0;
		}
	}

	// Fonction pour forcer l'affichage avec des points
	function formatWeightDisplay(weight: number): string {
		return weight.toString().replace(',', '.');
	}

	// Récupérer la dernière pesée
	async function fetchLastWeight() {
		try {
			const { data, error } = await supabase
				.from('weights')
				.select('date, weight')
				.order('date', { ascending: false })
				.order('created_at', { ascending: false })
				.limit(1);

			if (error) {
				console.error('Erreur lors de la récupération de la dernière pesée:', error);
				return;
			}

			if (data && data.length > 0) {
				lastWeight = {
					date: new Date(data[0].date),
					weight: parseFloat(data[0].weight)
				};
			}
		} catch (error) {
			console.error('Erreur lors de la récupération de la dernière pesée:', error);
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<div class="flex items-center gap-3">
				<div class="p-2 bg-success/20 rounded-lg">
					<Scale class="w-5 h-5 text-success" />
				</div>
				<div>
					<Dialog.Title>
						{selectedWeight ? 'Modifier la pesée' : 'Ajouter une pesée'}
					</Dialog.Title>
					<Dialog.Description>
						{selectedWeight
							? 'Modifiez les informations de cette pesée'
							: 'Ajoutez une nouvelle entrée de poids'}
					</Dialog.Description>
				</div>
			</div>
		</Dialog.Header>

		<div class="grid gap-4 py-4">
			<!-- Sélection de date -->
			<div class="grid gap-2">
				<Label for="date">Date de la pesée</Label>
				<Popover.Root bind:open={calendarOpen}>
					<Popover.Trigger>
						<Button
							variant="outline"
							class={cn(
								'w-full justify-start text-left font-normal',
								!formData.date && 'text-muted-foreground',
								errors.date && 'border-red-500'
							)}
						>
							<CalendarIcon class="mr-2 h-4 w-4" />
							{formData.date ? formatDate(formData.date) : 'Sélectionner une date'}
						</Button>
					</Popover.Trigger>
					<Popover.Content class="w-auto p-0" align="start">
						<Calendar
							type="single"
							bind:value={calendarValue as never}
							initialFocus
							onValueChange={handleDateChange}
						/>
					</Popover.Content>
				</Popover.Root>
				{#if errors.date}
					<span class="text-sm text-red-500">{errors.date}</span>
				{/if}
			</div>

			<!-- Saisie du poids -->
			<div class="grid gap-3">
				<div class="flex items-center justify-between">
					<Label for="weight">Poids (kg)</Label>
					{#if lastWeight && !selectedWeight}
						<span class="text-sm text-muted-foreground">
							Dernière pesée : {lastWeight.weight} kg ({lastWeight.date.toLocaleDateString(
								'fr-FR',
								{ day: 'numeric', month: 'long', year: 'numeric' }
							)})
						</span>
					{/if}
				</div>

				<!-- Contrôles de saisie avec boutons d'ajustement -->
				<div class="flex items-center gap-2">
					<!-- Bouton décrémentation -->
					<Button
						type="button"
						variant="outline"
						size="icon"
						onclick={decrementWeight}
						disabled={formData.weight <= 0.1}
						title="Diminuer de 0.1 kg"
						class="h-10 w-10 shrink-0"
					>
						<Minus class="w-4 h-4" />
					</Button>

					<!-- Champ de saisie -->
					<div class="relative flex-1">
						<Input
							id="weight"
							type="text"
							step="0.1"
							min="0"
							max="500"
							placeholder="65.5"
							lang="en"
							bind:value={formData.weight}
							oninput={handleWeightInput}
							onkeydown={handleWeightKeydown}
							class={cn(errors.weight && 'border-red-500')}
						/>
						<span
							class="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground"
						>
							kg
						</span>
					</div>

					<!-- Bouton incrémentation -->
					<Button
						type="button"
						variant="outline"
						size="icon"
						onclick={incrementWeight}
						disabled={formData.weight >= 500}
						title="Augmenter de 0.1 kg"
						class="h-10 w-10 shrink-0"
					>
						<Plus class="w-4 h-4" />
					</Button>
				</div>
				{#if errors.weight}
					<span class="text-sm text-red-500">{errors.weight}</span>
				{/if}
			</div>

			<!-- Case à cocher pour commencer un nouveau cycle (mode création uniquement) -->
			{#if !selectedWeight}
				<div class="flex items-center space-x-2 mt-4">
					<input
						id="cycle-start"
						type="checkbox"
						bind:checked={formData.isCycleStart}
						class="w-4 h-4 text-primary bg-base-100 border-base-300 rounded focus:ring-primary focus:ring-2"
					/>
					<Label
						for="cycle-start"
						class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Commencer un nouveau cycle de 5 jours
					</Label>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<div class="flex justify-between w-full">
				<!-- Bouton de suppression (seulement en mode édition) -->
				<div>
					{#if selectedWeight?.id}
						<Button
							variant="destructive"
							onclick={handleDelete}
							disabled={isLoading || isDeleting}
							class="bg-error hover:bg-error/90 text-white"
						>
							{#if isDeleting}
								<Loader2 class="w-4 h-4 mr-2 animate-spin" />
							{/if}
							Supprimer
						</Button>
					{/if}
				</div>

				<!-- Boutons d'action principaux -->
				<div class="flex gap-2">
					<Button variant="outline" onclick={handleClose} disabled={isLoading || isDeleting}
						>Annuler</Button
					>
					<Button onclick={handleSave} disabled={isLoading || isDeleting} class="bg-white">
						{#if isLoading}
							<Loader2 class="w-4 h-4 mr-2 animate-spin" />
						{/if}
						{selectedWeight ? 'Sauvegarder' : 'Ajouter une pesée'}
					</Button>
				</div>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
