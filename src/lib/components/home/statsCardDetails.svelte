<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion';
	import { parsePayoutToNumber } from '$lib/api/ventes.svelte';

	// Types simplifiés pour les ventes
	interface PeriodStats {
		ventes: number;
		payout: number;
		goal: {
			current: number;
			target: number;
			percentage: number;
		};
	}

	type PeriodKey = 'today' | 'yesterday' | 'month';

	let { day, stats }: { day: string; stats: Record<PeriodKey, PeriodStats> } = $props();

	// Helper function to get the period key
	function getPeriodKey(): PeriodKey {
		if (day === 'Hier') return 'yesterday';
		else if (day === 'Ce mois-ci') return 'month';
		return 'today';
	}

	// Helper function to get stat item class with conditional styling
	function getStatItemClass(value: number): string {
		const baseClass =
			'w-10 h-8 mb-0.5 flex items-center justify-center rounded-lg text-sm font-bold';
		if (value > 0) {
			return `${baseClass} bg-success/10 text-success`;
		}
		return `${baseClass} bg-base-200 text-neutral-content`;
	}

	// Classes réutilisables pour les éléments communs
	const statLabelClass = 'text-xs font-bold text-neutral-content';
</script>

<!-- Section principale -->
<section class="flex flex-col gap-4 my-5 mx-2">
	<!-- En-tête avec le jour et les totaux -->
	<header class="flex items-center justify-between">
		<div>
			<h2 class="text-sm font-medium text-neutral-content">{day}</h2>
			<p
				class="text-3xl font-extrabold {parsePayoutToNumber(stats[getPeriodKey()].payout) > 0
					? 'text-success'
					: parsePayoutToNumber(stats[getPeriodKey()].payout) === 0
						? 'disabled text-[#e4e2e2]'
						: ''}"
			>
				{parsePayoutToNumber(stats[getPeriodKey()].payout).toFixed(2)}<span
					class="text-xs px-1 align-super">$</span
				>
			</p>
		</div>
		<div class="flex items-center justify-between space-x-4 text-center">
			<article>
				<div
					class="flex items-center justify-center w-16 h-8 font-bold rounded-lg {stats[
						getPeriodKey()
					].ventes > 0
						? 'bg-success/10 text-success'
						: 'bg-base-200'}"
				>
					{stats[getPeriodKey()].ventes}
				</div>
				<p class="mt-1 text-xs font-semibold text-neutral-content">VENTES</p>
			</article>
		</div>
	</header>

	<!-- Accordéon pour les détails -->
	<Accordion.Root type="single">
		<Accordion.Item value="item-1">
			<Accordion.Trigger variant="statistiques">
				<footer class="flex items-center justify-between pb-0.5 w-full">
					<div class="flex items-center space-x-2">
						<span class={getStatItemClass(stats[getPeriodKey()].ventes)}>
							{stats[getPeriodKey()].ventes}
						</span>
						<p class={statLabelClass}>VENTES</p>
					</div>
					<p class="text-xs font-bold text-success">
						{parsePayoutToNumber(stats[getPeriodKey()].payout).toFixed(2)} $
					</p>
				</footer>
			</Accordion.Trigger>
			<Accordion.Content>
				<div class="flex flex-col">
					<p class="text-sm text-neutral-content">Détails des ventes pour {day.toLowerCase()}</p>
				</div>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</section>
