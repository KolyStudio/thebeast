<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { Calendar as CalendarIcon } from 'lucide-svelte';
	import { DateFormatter, type DateValue } from '@internationalized/date';

	type DateRange = {
		start: DateValue | undefined;
		end: DateValue | undefined;
	};

	let {
		value = $bindable<DateRange | undefined>(undefined),
		onValueChange,
		class: className
	} = $props();

	let open = $state(false);
	let formatter = $state(
		new DateFormatter('fr-FR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	);

	// État pour la sélection de plage
	let startDate = $state<DateValue | undefined>(value?.start);
	let endDate = $state<DateValue | undefined>(value?.end);
	let isRangeComplete = $state(false);
	// Calculer selectedValues de manière réactive sans effet
	let selectedValues = $derived.by<DateValue[]>(() => {
		if (startDate && endDate) {
			return [startDate, endDate];
		} else if (startDate) {
			return [startDate];
		} else {
			return [];
		}
	});

	$effect(() => {
		if (value?.start) {
			startDate = value.start;
		}
		if (value?.end) {
			endDate = value.end;
		}
		// Marquer comme complet si on a les deux dates
		isRangeComplete = !!(startDate && endDate);
	});

	/**
	 * Vérifie si une date est déjà sélectionnée dans la plage actuelle
	 */
	function isDateSelected(date: DateValue): boolean {
		return selectedValues.some((selectedDate) => selectedDate.compare(date) === 0);
	}

	/**
	 * Gère la sélection de dates pour créer une plage
	 * Logique améliorée pour permettre une nouvelle sélection après une plage complète
	 */
	function handleDateSelect(dates: DateValue[]) {
		if (dates.length === 0) {
			return;
		}

		const clickedDate = dates[dates.length - 1]; // La dernière date cliquée

		// Si on a déjà une plage complète, commencer une nouvelle sélection
		if (isRangeComplete) {
			startDate = clickedDate;
			endDate = undefined;
			isRangeComplete = false;
			return;
		}

		if (!startDate) {
			// Première sélection
			startDate = clickedDate;
		} else if (startDate && !endDate) {
			// Si on clique sur la même date que le début, recommencer
			if (clickedDate.compare(startDate) === 0) {
				startDate = clickedDate;
				return;
			}

			// Compléter la sélection
			if (clickedDate.compare(startDate) >= 0) {
				endDate = clickedDate;
			} else {
				// Si la date sélectionnée est antérieure, inverser
				endDate = startDate;
				startDate = clickedDate;
			}
			isRangeComplete = true;

			// Mettre à jour la valeur
			const newValue = { start: startDate, end: endDate };
			value = newValue;
			if (onValueChange) {
				onValueChange(newValue);
			}

			// Fermer le popover après une sélection complète
			setTimeout(() => {
				open = false;
			}, 200);
		}
	}

	function isDateInRange(date: DateValue): boolean {
		if (!startDate) return false;
		if (!endDate) return false;
		return date.compare(startDate) >= 0 && date.compare(endDate) <= 0;
	}

	function isDateRangeStart(date: DateValue): boolean {
		return startDate ? date.compare(startDate) === 0 : false;
	}

	function isDateRangeEnd(date: DateValue): boolean {
		return endDate ? date.compare(endDate) === 0 : false;
	}

	/**
	 * Réinitialise la sélection de dates
	 */
	function handleReset() {
		startDate = undefined;
		endDate = undefined;
		isRangeComplete = false;
		const newValue = { start: undefined, end: undefined };
		value = newValue;
		if (onValueChange) {
			onValueChange(newValue);
		}
		// Le popover reste ouvert pour permettre une nouvelle sélection immédiate
	}

	// Surveiller l'ouverture du popover pour réinitialiser l'état si nécessaire
	$effect(() => {
		if (open && isRangeComplete) {
			// Réinitialiser l'état pour permettre une nouvelle sélection
			isRangeComplete = false;
		}
	});

	function formatDate(date: DateValue | undefined): string {
		if (!date) return '';
		try {
			// Convertir DateValue en Date JavaScript puis formatter
			const jsDate = new Date(date.year, date.month - 1, date.day);
			return formatter.format(jsDate);
		} catch (error) {
			console.error('Erreur lors du formatage de la date:', error);
			return '';
		}
	}
</script>

<Popover bind:open>
	<PopoverTrigger>
		<div
			class={cn(
				'inline-flex items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
				'w-[280px] text-left font-normal',
				!value && 'text-muted-foreground',
				className
			)}
		>
			<CalendarIcon class="mr-2 h-4 w-4" />
			{#if value?.start}
				{#if value.end}
					<span>
						{formatDate(value.start)} - {formatDate(value.end)}
					</span>
				{:else}
					<span>
						{formatDate(value.start)} - ?
					</span>
				{/if}
			{:else}
				<span>Sélectionner une période</span>
			{/if}
		</div>
	</PopoverTrigger>
	<PopoverContent class="w-auto p-0" align="start">
		<div class="p-3">
			<div class="flex items-center justify-between mb-3">
				<h3 class="text-sm font-medium">Sélectionner une période</h3>
				<Button variant="ghost" size="sm" onclick={handleReset} class="h-7 text-xs">
					Réinitialiser
				</Button>
			</div>
			<CalendarPrimitive.Root
				type="multiple"
				value={selectedValues}
				onValueChange={handleDateSelect}
				locale="fr-FR"
				class="rounded-md  p-3"
			>
				{#snippet children({ months, weekdays })}
					<div class="flex flex-col space-y-4">
						<div class="flex items-center justify-between">
							<CalendarPrimitive.PrevButton
								class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent hover:bg-accent hover:text-accent-foreground h-7 w-7 p-0 opacity-50 hover:opacity-100 cursor-pointer"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 19l-7-7 7-7"
									/>
								</svg>
							</CalendarPrimitive.PrevButton>
							<CalendarPrimitive.Heading class="text-sm font-medium" />
							<CalendarPrimitive.NextButton
								class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent hover:bg-accent hover:text-accent-foreground h-7 w-7 p-0 opacity-50 hover:opacity-100 cursor-pointer"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</CalendarPrimitive.NextButton>
						</div>
						<CalendarPrimitive.Grid class="w-full border-collapse space-y-1">
							<CalendarPrimitive.GridHead>
								<CalendarPrimitive.GridRow class="flex">
									{#each weekdays as weekday}
										<CalendarPrimitive.HeadCell
											class="text-muted-foreground rounded-md w-auto font-normal text-[0.8rem]"
										>
											{weekday}
										</CalendarPrimitive.HeadCell>
									{/each}
								</CalendarPrimitive.GridRow>
							</CalendarPrimitive.GridHead>
							<CalendarPrimitive.GridBody>
								{#each months as month}
									{#each month.weeks as weekDates}
										<CalendarPrimitive.GridRow class="flex w-full mt-2">
											{#each weekDates as date}
												<CalendarPrimitive.Cell
													{date}
													month={month.value}
													class={cn(
														'h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
														isDateInRange(date) && 'bg-accent z-10',
														isDateRangeStart(date) && 'bg-white text-black rounded-l-md z-20',
														isDateRangeEnd(date) && 'bg-white text-black rounded-r-md z-20',
														isDateRangeStart(date) && isDateRangeEnd(date) && 'rounded-md z-20'
													)}
												>
													<CalendarPrimitive.Day
														class={cn(
															'inline-flex items-center justify-center rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 w-9 p-0 font-normal cursor-pointer',
															// Appliquer le hover seulement si la date n'est pas dans une plage sélectionnée
															!isDateInRange(date) &&
																!isDateRangeStart(date) &&
																!isDateRangeEnd(date) &&
																'hover:bg-accent hover:text-accent-foreground',
															// Style spécial pour les dates de la plage
															(isDateRangeStart(date) || isDateRangeEnd(date)) && 'relative z-30'
														)}
													/>
												</CalendarPrimitive.Cell>
											{/each}
										</CalendarPrimitive.GridRow>
									{/each}
								{/each}
							</CalendarPrimitive.GridBody>
						</CalendarPrimitive.Grid>
					</div>
				{/snippet}
			</CalendarPrimitive.Root>
		</div>
	</PopoverContent>
</Popover>
