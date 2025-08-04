<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { visitorsStore } from '$lib/api/visitors.svelte';
	import Chart from 'chart.js/auto';

	let chartElement: HTMLCanvasElement;
	let chart: Chart | null = null;
	let refreshInterval: NodeJS.Timeout | null = null;
	let lastUpdate = $state('');
	let isRefreshing = $state(false);
	let hasError = $state(false);

	// Load data on mount
	onMount(async () => {
		await refreshData();
	});

	// Fonction pour rafraîchir les données dynamiques
	async function refreshData() {
		if (isRefreshing) return;

		isRefreshing = true;
		hasError = false;

		try {
			// Always use fetchDynamicChart with appropriate date range and time dimension
			if (visitorsStore.isToday) {
				// For today, use default "day" period with hourly breakdown
				await visitorsStore.fetchDynamicChart(undefined, 'time:hour');
			} else {
				// For other dates, use the dynamic chart data with date range and appropriate time dimension
				if (visitorsStore.currentDateRange) {
					// Convert DateRange to string array format
					const formatDate = (date: { year: number; month: number; day: number }) => {
						const year = date.year;
						const month = date.month.toString().padStart(2, '0');
						const day = date.day.toString().padStart(2, '0');
						return `${year}-${month}-${day}`;
					};

					const dateRange = [
						formatDate(visitorsStore.currentDateRange.start),
						formatDate(visitorsStore.currentDateRange.end)
					];

					// Determine appropriate time dimension based on period type
					const timeDimension = visitorsStore.periodType === 'day' ? 'time:hour' : 'time:day';

					await visitorsStore.fetchDynamicChart(dateRange, timeDimension);
				} else {
					await visitorsStore.fetchDynamicChart();
				}
			}

			lastUpdate = new Date().toLocaleTimeString('fr-FR', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
		} catch (error) {
			hasError = true;
		} finally {
			isRefreshing = false;
		}
	}

	// Démarrer le rafraîchissement automatique (toutes les 60 secondes)
	function startAutoRefresh() {
		if (refreshInterval) clearInterval(refreshInterval);

		refreshInterval = setInterval(() => {
			refreshData();
		}, 120000);
	}

	// Arrêter le rafraîchissement automatique
	function stopAutoRefresh() {
		if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}
	}

	// Computed data from visitors store - always use dynamicChartData
	let chartData = $derived(visitorsStore.dynamicChartData?.data || []);
	let timeLabels = $derived(visitorsStore.dynamicChartData?.time_labels || []);

	let visitorData = $derived(
		chartData.map((item: any) => ({
			time: item.time || '00:00',
			visitors: item.visitors || 0,
			events: item.events || 0,
			date: item.date || '',
			t: item.t || '' // For compatibility
		}))
	);

	// Configuration Chart.js
	function getChartConfig() {
		let labels: string[] = [];
		let data: number[] = [];

		if (timeLabels.length > 0) {
			// Adapter l'affichage selon le type de période
			labels = timeLabels.map((timeLabel: string) => {
				if (visitorsStore.periodType === 'day') {
					// Pour les jours : afficher les heures "HH:MM"
					const timePart = timeLabel.split(' ')[1]; // "HH:MM:SS"
					return timePart.substring(0, 5); // "HH:MM"
				} else {
					// Pour les semaines/mois : afficher les dates "DD/MM"
					const datePart = timeLabel.split(' ')[0]; // "YYYY-MM-DD"
					const [, month, day] = datePart.split('-');
					return `${day}/${month}`;
				}
			});

			// Mapper les données avec les time_labels
			data = timeLabels.map((timeLabel: string) => {
				const matchingItem = visitorData.find((item: any) => item.date === timeLabel);
				return matchingItem?.visitors || 0;
			});
		} else {
			// Fallback pour données sans time_labels
			labels = visitorData.map((item: any) => item.time);
			data = visitorData.map((item: any) => item.visitors);
		}

		return {
			type: 'line' as const,
			data: {
				labels: [...labels],
				datasets: [
					{
						label: 'Visiteurs',
						data: [...data],
						borderColor: '#0a78fe',
						backgroundColor: (context: any) => {
							const chart = context.chart;
							const { ctx, chartArea } = chart;
							if (!chartArea) return null;

							// Créer un gradient compatible mode sombre
							const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
							gradient.addColorStop(0, 'rgba(69, 126, 226, 0.3)'); // Réduit pour mode sombre
							gradient.addColorStop(1, 'rgba(69, 126, 226, 0.05)'); // Plus transparent
							return gradient;
						},
						borderWidth: 2,
						fill: true,
						tension: 0, // Ligne droite (équivalent à curve: 'straight')
						pointRadius: 0, // Augmenter la taille des points pour faciliter le hover
						pointHoverRadius: 3,
						pointBackgroundColor: '#0a78fe',
						pointBorderColor: 'transparent',
						pointHoverBackgroundColor: '#457ee2',
						pointHoverBorderColor: 'transparent',
						pointHoverBorderWidth: 0
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: {
					duration: 0
				},
				interaction: {
					mode: 'nearest' as const,
					intersect: false,
					axis: 'x' as const
				},
				hover: {
					mode: 'nearest' as const,
					intersect: false
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						enabled: true,
						backgroundColor: '#2c2b31',
						titleColor: '#fff',
						bodyColor: '#fff',
						borderColor: '#2c2b31',
						borderWidth: 1,
						cornerRadius: 8,
						displayColors: false, // Enlever la couleur de la légende
						usePointStyle: true, // Utiliser un style de point rond
						padding: 12,
						titleAlign: 'left' as const,
						bodyAlign: 'left' as const,
						titleFont: {
							size: 14,
							weight: 'bold' as const
						},
						bodyFont: {
							size: 13
						},
						callbacks: {
							title: (tooltipItems: any) => {
								return `⏲️ ${tooltipItems[0].label}`;
							},
							label: (context: any) => {
								const value = context.raw;
								return `Visiteurs: ${value}`;
							}
						}
					}
				},
				scales: {
					x: {
						display: true,
						grid: {
							display: false // Enlever la grille verticale
						},
						ticks: {
							color: '#666',
							font: {
								size: 10
							}
						}
					},
					y: {
						display: true,
						beginAtZero: true,
						grid: {
							display: true,
							color: '#2c2b31',
							borderDash: [3, 3]
						},
						ticks: {
							color: '#666',
							font: {
								size: 10
							}
						}
					}
				}
			}
		};
	}

	// Watch for date changes without causing infinite loops
	let lastDateRangeString = $state('');
	let lastIsToday = $state(true);

	$effect(() => {
		const currentDateRangeString = JSON.stringify(visitorsStore.currentDateRange);
		const currentIsToday = visitorsStore.isToday;

		// Only refresh if the date actually changed
		if (lastDateRangeString !== currentDateRangeString || lastIsToday !== currentIsToday) {
			// Update tracking variables first to prevent loops
			lastDateRangeString = currentDateRangeString;
			lastIsToday = currentIsToday;

			// Stop any existing auto-refresh
			stopAutoRefresh();

			// Refresh data for the new date
			refreshData();

			// Start auto-refresh only for today's data
			if (currentIsToday) {
				startAutoRefresh();
			}
		}
	});

	// Effect to create/update chart when data changes
	$effect(() => {
		if (browser && chartElement && visitorData.length > 0) {
			if (!chart) {
				createChart();
			} else {
				updateChart();
			}
		}
	});

	onMount(() => {
		if (!browser) return;

		return () => {
			if (chart) {
				chart.destroy();
				chart = null;
			}
			stopAutoRefresh();
		};
	});

	// Function to create chart
	function createChart() {
		if (!chartElement) return;

		const ctx = chartElement.getContext('2d');
		if (!ctx) return;

		try {
			const config = getChartConfig();
			chart = new Chart(ctx, config);
		} catch (error) {
			// Error creating chart
		}
	}

	// Function to update chart
	function updateChart() {
		if (!chart) return;

		const { labels, data } = getChartData();

		// Vérifier si les données ont changé
		const currentData = chart.data.datasets[0].data;
		const hasChanged = JSON.stringify(currentData) !== JSON.stringify(data);

		if (hasChanged) {
			chart.data.labels = [...labels];
			chart.data.datasets[0].data = [...data];
			// Animation subtile lors des mises à jour automatiques
			chart.update('active');
		}
	}

	// Function to get chart data - utilise la même logique que getChartConfig
	function getChartData() {
		let labels: string[] = [];
		let data: number[] = [];

		if (timeLabels.length > 0) {
			// Adapter l'affichage selon le type de période
			labels = timeLabels.map((timeLabel: string) => {
				if (visitorsStore.periodType === 'day') {
					// Pour les jours : afficher les heures "HH:MM"
					const timePart = timeLabel.split(' ')[1]; // "HH:MM:SS"
					return timePart.substring(0, 5); // "HH:MM"
				} else {
					// Pour les semaines/mois : afficher les dates "DD/MM"
					const datePart = timeLabel.split(' ')[0]; // "YYYY-MM-DD"
					const [, month, day] = datePart.split('-');
					return `${day}/${month}`;
				}
			});

			// Mapper les données avec les time_labels
			data = timeLabels.map((timeLabel: string) => {
				const matchingItem = visitorData.find((item: any) => item.date === timeLabel);
				return matchingItem?.visitors || 0;
			});
		} else {
			// Fallback pour données sans time_labels
			labels = visitorData.map((item: any) => item.time);
			data = visitorData.map((item: any) => item.visitors);
		}

		return { labels, data };
	}
</script>

<div class="w-full h-full bg-base-100 rounded-xl p-1.5">
	<div class="flex divide-x divide-base-100 rounded-lg bg-base-200 w-[50%]">
		<header class="flex-1 py-1">
			<div class="w-full">
				<div>
					<div class="flex items-center px-2 gap-2">
						<div class="font-medium text-xs text-neutral-content">Visiteurs uniques</div>
					</div>
					<div class="text-2xl font-bold px-2">
						{visitorData.reduce((sum: number, item: any) => sum + item.visitors, 0)}
					</div>
				</div>
			</div>
		</header>
		<header class="flex-1 py-1">
			<div class="w-full">
				<div>
					<div class="flex items-center px-2 gap-2">
						<div class="font-medium text-xs text-neutral-content">Pages visitées</div>
					</div>
					<div class="text-2xl font-bold px-2">
						{visitorData.reduce((sum: number, item: any) => sum + item.events, 0)}
					</div>
				</div>
			</div>
		</header>
	</div>

	<!-- Graphique Chart.js -->
	<div class="mt-4" style="height: 350px;">
		<canvas bind:this={chartElement} class="w-full h-full"></canvas>
	</div>
</div>
