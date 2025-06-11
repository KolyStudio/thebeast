<script lang="ts">
	import StatsCardDetails from './statsCardDetails.svelte';
	import StatsChart from './statsChart.svelte';
	import { ventesStore, parsePayoutToNumber } from '$lib/api/ventes.svelte';
	import { onMount } from 'svelte';

	let USDtoEUR = 0.8742424;

	// Props with types
	let { period = 'ce mois-ci' } = $props<{
		period?: string;
	}>();

	let activeTab = $state("Aujourd'hui");

	// Computed values
	let ventesValue = $state(0);
	let expensesValue = $state(0); // Valeur fixe pour les dépenses pour l'instant

	// Calculate ventes when ventesStore.month changes
	$effect(() => {
		if (ventesStore.month?.totalPayout === undefined) {
			ventesValue = 0;
			return;
		}

		ventesValue = parsePayoutToNumber(ventesStore.month.totalPayout);
	});

	// Derived from ventesValue
	let profit = $derived(ventesValue - expensesValue);

	// Format amount with euro symbol
	function formatAmount(amount: number) {
		return amount.toFixed(2); // 2 décimales pour les ventes
	}

	/**
	 * Récupère les données de statistiques si elles ne sont pas déjà chargées
	 */
	async function fetchStatsData() {
		try {
			if (ventesStore.month?.totalPayout === undefined) {
				await ventesStore.fetchAllStats();
			}
		} catch (error) {
			console.error('Error fetching stats data:', error);
		}
	}

	function handleTabChange(event: Event) {
		const target = event.target as HTMLInputElement;
		activeTab = target.getAttribute('aria-label') || "Aujourd'hui";
	}

	// Initialisation
	onMount(fetchStatsData);
</script>

<section class="md:w-1/2 w-full bg-base-100 border border-base-300 rounded-xl">
	<!-- Refresh + Tabs -->

	<div class="flex divide-x divide-base-100 rounded-lg bg-base-200 md:w-[70%] w-[95%] m-1.5">
		<header class="flex-1 py-1">
			<div class="w-full">
				<div class="flex flex-col">
					<div class="flex items-center px-2 gap-3">
						<div class="inline-grid *:[grid-area:1/1]">
							<div class="status status-info"></div>
						</div>
						<div class="font-medium text-xs text-neutral-content">Ventes</div>
					</div>
					<div class="md:text-2xl text-lg font-bold px-4">
						{formatAmount(ventesValue * USDtoEUR)}<span class="text-xs px-1 align-super">€</span>
					</div>
				</div>
			</div>
		</header>

		<header class="flex-1 py-1">
			<div class="w-full">
				<div class="flex flex-col">
					<div class="flex items-center px-2 gap-3">
						<div class="inline-grid *:[grid-area:1/1]">
							<div class="status status-error"></div>
						</div>
						<div class="font-medium text-xs text-neutral-content">Dépenses</div>
					</div>
					<div class="md:text-2xl text-lg font-bold px-4">
						{formatAmount(expensesValue)}<span class="text-xs px-1 align-super">€</span>
					</div>
				</div>
			</div>
		</header>

		<header class="flex-1 py-1">
			<div class="w-full">
				<div class="flex flex-col">
					<div class="flex items-center px-2 gap-3">
						<div class="inline-grid *:[grid-area:1/1]">
							<div class="status status-success"></div>
						</div>
						<div class="font-medium text-xs text-neutral-content">Bénéfice</div>
					</div>
					<div class="md:text-2xl text-lg font-bold px-4">
						{formatAmount(profit)}<span class="text-xs px-1 align-super">€</span>
					</div>
				</div>
			</div>
		</header>
	</div>

	<StatsChart />
</section>
