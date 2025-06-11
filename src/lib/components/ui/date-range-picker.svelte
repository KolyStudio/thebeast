<script lang="ts">
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import {
		type DateValue,
		DateFormatter,
		getLocalTimeZone,
	} from "@internationalized/date";
	import { cn } from "$lib/utils.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { RangeCalendar } from "$lib/components/ui/range-calendar/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";

	/**
	 * Props du composant DateRangePicker
	 */
	let {
		value = $bindable(),
		placeholder = "Sélectionner une plage de dates",
		class: className = "",
		disabled = false,
		onchange,
		...restProps
	}: {
		value?: { start: DateValue; end: DateValue } | undefined;
		placeholder?: string;
		class?: string;
		disabled?: boolean;
		onchange?: () => void;
	} = $props();

	/**
	 * Formateur de date pour l'affichage
	 */
	const df = new DateFormatter("fr-FR", {
		dateStyle: "medium",
	});

	/**
	 * État du popover (ouvert/fermé)
	 */
	let open = $state(false);

	/**
	 * Formate l'affichage de la plage de dates
	 */
	function formatDateRange(): string {
		if (!value || !value.start || !value.end) {
			return placeholder;
		}
		
		const startFormatted = df.format(value.start.toDate(getLocalTimeZone()));
		const endFormatted = df.format(value.end.toDate(getLocalTimeZone()));
		
		return `${startFormatted} - ${endFormatted}`;
	}

	/**
	 * Gère le changement de valeur du calendrier
	 */
	function handleCalendarChange() {
		// Fermer le popover si les deux dates sont sélectionnées
		if (value && value.start && value.end) {
			open = false;
			// Appeler la fonction de callback si fournie
			if (onchange) {
				onchange();
			}
		}
	}

	/**
	 * Surveille les changements de valeur pour déclencher le callback
	 */
	$effect(() => {
		if (value && value.start && value.end && onchange) {
			onchange();
		}
	});
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class={cn(
					"w-[320px] justify-start text-left font-normal",
					!value && "text-muted-foreground",
					className
				)}
				{disabled}
				{...props}
				{...restProps}
			>
				<CalendarIcon class="mr-2 size-4" />
				{formatDateRange()}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0">
		<RangeCalendar 
			bind:value 
			initialFocus 
			locale="fr-FR"
			onvaluechange={handleCalendarChange}
		/>
	</Popover.Content>
</Popover.Root>