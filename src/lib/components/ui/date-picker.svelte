<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { type DateValue, DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	/**
	 * Props du composant DatePicker
	 */
	let {
		value = $bindable(),
		placeholder = 'Sélectionner une date',
		class: className = '',
		disabled = false,
		...restProps
	}: {
		value?: DateValue;
		placeholder?: string;
		class?: string;
		disabled?: boolean;
	} = $props();

	/**
	 * Formateur de date pour l'affichage
	 */
	const df = new DateFormatter('fr-FR', {
		dateStyle: 'long'
	});

	/**
	 * État du popover (ouvert/fermé)
	 */
	let open = $state(false);
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class={cn(
					'w-[280px] justify-start text-left font-normal',
					!value && 'text-muted-foreground',
					className
				)}
				{disabled}
				{...props}
				{...restProps}
			>
				<CalendarIcon class="mr-2 size-4" />
				{value ? df.format(value.toDate(getLocalTimeZone())) : placeholder}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0">
		<Calendar
			bind:value
			type="single"
			initialFocus
			onchange={() => {
				// Fermer le popover après sélection
				open = false;
			}}
		/>
	</Popover.Content>
</Popover.Root>
