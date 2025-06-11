<script lang="ts">
	import DetailledStats from './statsCardDetails.svelte';
	import StatsCardItem from './statsCardItem.svelte';
	import { onMount } from 'svelte';
	import { ventesStore, parsePayoutToNumber } from '$lib/api/ventes.svelte';

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

	let activeTab = $state("Aujourd'hui");

	// Valeurs maximales fixes pour les pourcentages
	const MAX_VENTES = 1000; // Nouvelle cible fixe pour les ventes

	// Props
	let goal = MAX_VENTES;

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

	// Création de la structure de données de période simplifiée pour les ventes
	function createPeriodStats(): PeriodStats {
		return {
			ventes: 0,
			payout: 0,
			goal: {
				current: 0,
				target: goal,
				percentage: 0
			}
		};
	}

	// Refresh des statistiques
	function refreshStats(): void {
		ventesStore.fetchAllStats();
		updateTime = new Date().toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Mise à jour des statistiques de ventes
	function updateStats(): void {
		const periods = {
			today: {
				count: ventesStore.today?.count || 0,
				payout: parsePayoutToNumber(ventesStore.today?.totalPayout)
			},
			yesterday: {
				count: ventesStore.yesterday?.count || 0,
				payout: parsePayoutToNumber(ventesStore.yesterday?.totalPayout)
			},
			month: {
				count: ventesStore.month?.count || 0,
				payout: parsePayoutToNumber(ventesStore.month?.totalPayout)
			}
		};

		(Object.entries(periods) as [PeriodKey, { count: number; payout: number }][]).forEach(
			([period, data]) => {
				stats[period].ventes = data.count || 0;
				stats[period].payout = data.payout || 0;

				if (period === 'month') {
					stats.month.goal.current = data.count || 0; // Utiliser le nombre de ventes pour l'objectif
					stats.month.goal.percentage = Math.min(100, Math.round(((data.count || 0) / goal) * 100));
				}
			}
		);
	}

	// Initialisation des données
	function fetchInitialData(): void {
		ventesStore.fetchAllStats();
		updateTime = new Date().toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Au chargement de la page et lorsque ventesStore change
	$effect(() => {
		// Use object destructuring to create a dependency on the specific properties
		const { today, yesterday, month } = ventesStore;

		// Only update if we have actual data
		if (
			today?.totalPayout !== undefined ||
			yesterday?.totalPayout !== undefined ||
			month?.totalPayout !== undefined
		) {
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

<section class="flex flex-col gap-3 md:w-1/2 w-full">
	<section class="w-full p-1.5 bg-base-100 border border-base-300 rounded-xl">
		<!-- Refresh + Tabs -->
		<header class="flex items-start justify-center md:justify-between">
			<button
				class="md:flex hidden items-center p-1 px-2 space-x-2 text-sm font-semibold rounded-lg cursor-pointer bg-base-200 hover:bg-base-300"
				onclick={refreshStats}
			>
				<div class="inline-grid *:[grid-area:1/1]">
					<div class="status status-success animate-ping"></div>
					<div class="status status-success"></div>
				</div>
				<span>{updateTime}</span>
			</button>
			<div class="h-10 tabs tabs-box">
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
			<StatsCardItem title="Ventes" value={stats.month.ventes} max={MAX_VENTES} color="#55c182" />
		</div>
	</section>
</section>
