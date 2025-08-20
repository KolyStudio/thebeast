<script lang="ts">
	import DetailledStats from './statsCardDetails.svelte';
	import StatsCardItem from './statsCardItem.svelte';
	import { onMount } from 'svelte';
	import { statsStore } from '$lib/api/stats.svelte';

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

	let activeTab = $state("Aujourd'hui");

	// Valeurs maximales fixes pour les pourcentages
	const MAX_REVENUE = 5000;
	const MAX_SIGNUPS = 2000;
	const MAX_ESSAIS = 143;

	// Props
	let goal = MAX_REVENUE;

	// State
	let updateTime = $state('--:--');
	let stats = $state<Record<PeriodKey, PeriodStats>>({
		today: createPeriodStats(),
		yesterday: createPeriodStats(),
		month: createPeriodStats()
	});

	function handleTabChange(event: Event) {
		const target = event.target as HTMLInputElement;
		activeTab = target.getAttribute('aria-label') || "Aujourd'hui";
	}

	// Création de la structure de données de période
	function createPeriodStats(): PeriodStats {
		return {
			revenue: 0.0,
			clicks: 0,
			signups: 0,
			transactions: [
				{ label: 'ESSAIS', count: 0, amount: 0.0 },
				{ label: 'BILLS', count: 0, amount: 0.0 },
				{ label: 'UPSELLS', count: 0, amount: 0.0 },
				{ label: 'REBILLS', count: 0, amount: 0.0 },
				{ label: 'IMPAYES', count: 0, amount: 0.0 }
			],
			goal: {
				current: 0,
				target: goal,
				percentage: 0
			}
		};
	}

	// Calcul de la somme d'une colonne spécifique
	function sumColumnForPeriod(data: any[], columnIndex: number): number {
		if (!data || !data.length) return 0;
		return data.reduce((sum: number, item: any) => {
			if (!item || typeof item !== 'object') return sum;
			const value = item[columnIndex];
			const numValue = typeof value === 'number' ? value : parseFloat(value);
			return sum + (isNaN(numValue) ? 0 : numValue);
		}, 0);
	}

	// Mise à jour des transactions pour une période
	function updateTransactionsFromData(period: PeriodKey, data: any[]): void {
		if (!data || !data.length) return;

		const transactions = stats[period].transactions;

		// ESSAIS
		transactions[0].count = sumColumnForPeriod(data, 4);
		transactions[0].amount = sumColumnForPeriod(data, 9);

		// BILLS
		transactions[1].count = sumColumnForPeriod(data, 5);
		transactions[1].amount = sumColumnForPeriod(data, 13);

		// UPSELLS
		transactions[2].count = sumColumnForPeriod(data, 6);
		transactions[2].amount = sumColumnForPeriod(data, 10);

		// REBILLS
		transactions[3].count = sumColumnForPeriod(data, 7);
		transactions[3].amount = sumColumnForPeriod(data, 14);

		// IMPAYES
		transactions[4].count = sumColumnForPeriod(data, 8);
		transactions[4].amount = sumColumnForPeriod(data, 15);
	}

	// Refresh des statistiques
	function refreshStats(): void {
		statsStore.fetchAllStats();
		updateTime = new Date().toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Mise à jour des statistiques
	function updateStats(): void {
		const periods = {
			today: statsStore.today?.results || [],
			yesterday: statsStore.yesterday?.results || [],
			month: statsStore.month?.results || []
		};

		(Object.entries(periods) as [PeriodKey, any[]][]).forEach(([period, data]) => {
			if (data.length > 0) {
				stats[period].clicks = sumColumnForPeriod(data, 2);
				stats[period].signups = sumColumnForPeriod(data, 3);
				stats[period].revenue = sumColumnForPeriod(data, 16);

				if (period === 'month') {
					stats.month.goal.current = stats.month.revenue;
					stats.month.goal.percentage = Math.min(
						100,
						Math.round((stats.month.revenue / goal) * 100)
					);
				}

				updateTransactionsFromData(period, data);
			}
		});
	}

	// Initialisation des données
	function fetchInitialData(): void {
		statsStore.fetchAllStats();
		updateTime = new Date().toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Au chargement de la page et lorsque statsStore change
	$effect(() => {
		// Use object destructuring to create a dependency on the specific properties
		const { today, yesterday, month } = statsStore;

		// Only update if we have actual data
		if (today?.results?.length || yesterday?.results?.length || month?.results?.length) {
			updateTime = new Date().toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit'
			});

			// Process the data
			updateStats();
		}
	});

	// Initialisation
	onMount(() => {
		fetchInitialData();
	});
</script>

<section class="flex flex-col gap-3 md:w-1/2">
	<section class="w-full p-1.5 bg-base-100 rounded-xl">
		<!-- Refresh + Tabs -->
		<header class="flex items-start justify-between">
			<button
				class="hidden md:flex items-center p-1 px-2 space-x-2 text-sm font-semibold rounded-lg cursor-pointer bg-base-200 hover:bg-base-300"
				onclick={refreshStats}
			>
				<div class="inline-grid *:[grid-area:1/1]">
					<div class="status status-success animate-ping"></div>
					<div class="status status-success"></div>
				</div>
				<span>{updateTime}</span>
			</button>
			<div class="h-10 tabs tabs-box w-full md:w-auto">
				<input
					type="radio"
					name="my_tabs_1"
					class="h-8 tab"
					aria-label="Aujourd'hui"
					checked
					onchange={handleTabChange}
				/>
				<input
					type="radio"
					name="my_tabs_1"
					class="h-8 tab"
					aria-label="Hier"
					onchange={handleTabChange}
				/>
				<input
					type="radio"
					name="my_tabs_1"
					class="h-8 tab"
					aria-label="Ce mois-ci"
					onchange={handleTabChange}
				/>
			</div>
		</header>

		<DetailledStats day={activeTab} {stats} />
	</section>
	<section class="w-full">
		<div class="flex justify-between gap-3">
			<StatsCardItem
				title="Essais"
				value={stats.month.transactions[0].count}
				max={MAX_ESSAIS}
				color="#69a1fe"
			/>
			<!-- <StatsCardItem
				title="Chiffre d'affaire"
				value={stats.month.revenue}
				max={MAX_REVENUE}
				color="#65c96a"
			/> -->
			<StatsCardItem
				title="Inscrits"
				value={stats.month.signups}
				max={MAX_SIGNUPS}
				color="#fbce5d"
			/>
		</div>
	</section>
</section>
