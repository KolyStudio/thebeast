<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion';

	// Types
	interface Transaction {
		label: string;
		count: number;
		amount: number;
	}

	interface PeriodStats {
		revenue: number;
		clicks: number;
		signups: number;
		transactions: Transaction[];
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
		return `${baseClass} bg-base-200 `;
	}

	// Helper function to get value class with conditional styling
	function getValueClass(value: number): string {
		const baseClass = 'text-xs font-bold';
		if (value > 0) {
			return `${baseClass} text-success`;
		}
		return `${baseClass} `;
	}

	// Classes réutilisables pour les éléments communs
	const statLabelClass = 'text-xs font-bold ';
</script>

<!-- Section principale -->
<section class="flex flex-col gap-4 my-5 mx-2">
	<!-- En-tête avec le jour et les totaux -->
	<header class="flex items-center justify-between">
		<div>
			<h2 class="text-sm font-medium text-neutral-content">{day}</h2>
			<p
				class="text-3xl font-extrabold {stats[getPeriodKey()].revenue > 0
					? 'text-success'
					: stats[getPeriodKey()].revenue === 0
						? 'disabled '
						: ''}"
			>
				{stats[getPeriodKey()].revenue.toFixed(2)}<span class="text-xs px-1 align-super">€</span>
			</p>
		</div>
		<div class="flex items-center justify-between space-x-4 text-center">
			<article>
				<div class="flex items-center justify-center w-16 h-8 font-bold rounded-lg bg-base-200">
					{stats[getPeriodKey()].clicks}
				</div>
				<p class="mt-1 text-xs font-semibold text-neutral-content">CLICS</p>
			</article>
			<article>
				<div class="flex items-center justify-center w-16 h-8 font-bold rounded-lg bg-base-200">
					{stats[getPeriodKey()].signups}
				</div>
				<p class="mt-1 text-xs font-semibold text-neutral-content">INSCRITS</p>
			</article>
		</div>
	</header>

	<!-- Accordéon pour les détails -->
	<Accordion.Root type="single">
		<Accordion.Item value="item-1">
			<Accordion.Trigger variant="statistiques">
				<footer class="flex items-center justify-between pb-0.5 w-full">
					<div class="flex items-center space-x-2">
						<span class={getStatItemClass(stats[getPeriodKey()].transactions[0].count)}>
							{stats[getPeriodKey()].transactions[0].count}
						</span>
						<p class={statLabelClass}>ESSAIS</p>
					</div>
					<p class={getValueClass(stats[getPeriodKey()].transactions[0].amount)}>
						{stats[getPeriodKey()].transactions[0].amount.toFixed(2)} EUR
					</p>
				</footer>
			</Accordion.Trigger>
			<Accordion.Content>
				<div class="flex flex-col">
					<ul class="space-y-0.5">
						{#each stats[getPeriodKey()].transactions.slice(1) as transaction}
							<li class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class={getStatItemClass(transaction.count)}>{transaction.count}</span>
									<span class={statLabelClass}>{transaction.label}</span>
								</div>
								<span class={getValueClass(transaction.amount)}
									>{transaction.amount.toFixed(2)} EUR</span
								>
							</li>
						{/each}
					</ul>
				</div>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</section>
