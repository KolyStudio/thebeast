<script lang="ts">
	import StatsCardDetails from './statsCardDetails.svelte';
	import StatsChart from './statsChart.svelte';
	import { statsStore } from '$lib/api/stats.svelte';
	import { onMount } from 'svelte';

	// Props with types
	let { period = 'ce mois-ci' } = $props<{
		period?: string;
	}>();

	let activeTab = $state("Aujourd'hui");

	// Computed values
	let revenueValue = $state(0);
	let expensesValue = $state(0); // Valeur fixe pour les dépenses pour l'instant

	// Calculate revenue when statsStore.month changes
	$effect(() => {
		if (!statsStore.month?.results?.length) {
			revenueValue = 0;
			return;
		}

		revenueValue = statsStore.month.results.reduce((sum: number, item: any) => {
			const value = item[16] ? parseFloat(item[16]) : 0;
			return sum + value;
		}, 0);
	});

	// Derived from revenueValue
	let profit = $derived(revenueValue - expensesValue);

	// Format amount with euro symbol
	function formatAmount(amount: number) {
		return `${Math.round(amount)}`;
	}

	/**
	 * Récupère les données de statistiques si elles ne sont pas déjà chargées
	 */
	async function fetchStatsData() {
		try {
			if (!statsStore.month?.results?.length) {
				await statsStore.fetchAllStats();
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

<section class="hidden md:block md:w-1/2 mt-3 md:mt-0 bg-base-100 rounded-xl">
	<!-- Refresh + Tabs -->

	<div class="flex divide-x divide-base-100 rounded-lg bg-base-200 md:w-[70%] m-1.5">
		<header class="flex-1 py-1">
			<div class="w-full">
				<div class="flex flex-col">
					<div class="flex items-center px-2 gap-3">
						<div class="inline-grid *:[grid-area:1/1]">
							<div class="status status-info"></div>
						</div>
						<div class="font-medium text-xs text-neutral-content">Chiffre d'affaire</div>
					</div>
					<div class="text-2xl font-bold px-4">
						{formatAmount(revenueValue)}<span class="text-xs px-1 align-super">€</span>
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
					<div class="text-2xl font-bold px-4">
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
					<div class="text-2xl font-bold px-4">
						{formatAmount(profit)}<span class="text-xs px-1 align-super">€</span>
					</div>
				</div>
			</div>
		</header>
	</div>

	<StatsChart />
</section>
