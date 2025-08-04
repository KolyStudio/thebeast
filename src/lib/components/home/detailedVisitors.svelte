<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { visitorsStore } from '$lib/api/visitors.svelte';
	import { fetch30MinutesWithCookies } from '$lib/api/analytics';
	import Chart from 'chart.js/auto';

	// Chart state
	let chartElement: HTMLCanvasElement | undefined = undefined;
	let chart = $state<Chart | null>(null);
	let chartData = $state<any[]>([]);
	let totalVisitors30Min = $state(0);
	let isLoadingChart = $state(false);
	let chartError = $state<string | null>(null);
	let refreshInterval: NodeJS.Timeout | null = null;

	// Top stats state
	let topStats = $state<any[]>([]);
	let isLoadingTopStats = $state(false);
	let topStatsError = $state<string | null>(null);
	let currentVisitors = $state(0);
	let uniqueVisitors30min = $state(0);
	let pageviews30min = $state(0);

	// Fetch data on mount
	onMount(async () => {
		if (!visitorsStore.topPages.length && !visitorsStore.topLocations.length) {
			await visitorsStore.fetchToday();
		}

		// Fetch 30-minute chart data
		await fetch30MinuteData();

		// Fetch top stats data
		await fetchTopStatsData();

		// Start auto-refresh
		startAutoRefresh();
	});

	// Cleanup on destroy
	onDestroy(() => {
		stopAutoRefresh();
		if (chart) {
			chart.destroy();
			chart = null;
		}
	});

	// Function to fetch 30-minute chart data
	async function fetch30MinuteData() {
		isLoadingChart = true;
		chartError = null;

		try {
			const data = await fetch30MinutesWithCookies();

			if (data && data.data) {
				chartData = data.data;
				totalVisitors30Min = data.totalVisitors || 0;

				// Update chart if it exists
				if (chart) {
					updateChart();
				} else if (browser && chartElement) {
					createChart();
				}
			} else {
				throw new Error('No data received from API');
			}
		} catch (error) {
			chartError = error instanceof Error ? error.message : 'Unknown error';

			// Ne pas vider chartData en cas d'erreur pour éviter que le graphique disparaisse
			// chartData = [];
			// totalVisitors30Min = 0;
		} finally {
			isLoadingChart = false;
		}
	}

	// Function to fetch top-stats data
	async function fetchTopStatsData() {
		isLoadingTopStats = true;
		topStatsError = null;

		try {
			// Call our SvelteKit API route for top-stats
			const response = await fetch('/api/plausible/top-stats', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = await response.json();

			if (data && data.top_stats) {
				topStats = data.top_stats;

				// Extract specific metrics
				currentVisitors =
					topStats.find((stat: any) => stat.graph_metric === 'current_visitors')?.value || 0;
				uniqueVisitors30min =
					topStats.find((stat: any) => stat.graph_metric === 'visitors')?.value || 0;
				pageviews30min =
					topStats.find((stat: any) => stat.graph_metric === 'pageviews')?.value || 0;
			} else {
				throw new Error('No top_stats data received from API');
			}
		} catch (error) {
			topStatsError = error instanceof Error ? error.message : 'Unknown error';

			// Reset values on error
			currentVisitors = 0;
			uniqueVisitors30min = 0;
			pageviews30min = 0;
		} finally {
			isLoadingTopStats = false;
		}
	}

	// Auto-refresh function
	function startAutoRefresh() {
		refreshInterval = setInterval(() => {
			fetch30MinuteData();
			fetchTopStatsData();
		}, 120000);
	}

	// Stop auto-refresh
	function stopAutoRefresh() {
		if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}
	}

	// Create chart
	function createChart() {
		if (!chartElement || !chartData.length || !browser) return;

		if (chart) {
			chart.destroy();
		}

		const ctx = chartElement.getContext('2d');
		if (!ctx) return;

		const labels = chartData.map((item: any) => item.time);
		const visitors = chartData.map((item: any) => item.visitors || 0);

		chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: [...labels],
				datasets: [
					{
						label: 'Visiteurs',
						data: [...visitors],
						backgroundColor: '#0a78fe',
						borderColor: '#0a78fe',
						borderWidth: 0,
						borderRadius: 4,
						borderSkipped: false
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
					mode: 'nearest',
					intersect: false,
					axis: 'x'
				},
				hover: {
					mode: 'nearest',
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
						displayColors: false,
						usePointStyle: true,
						padding: 12,
						titleAlign: 'left',
						bodyAlign: 'left',
						titleFont: {
							size: 14,
							weight: 'bold'
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
							display: false
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
							color: '#2c2b31'
						},
						ticks: {
							color: '#666',
							font: {
								size: 10
							},
							stepSize: 1
						}
					}
				}
			}
		});
	}

	// Update chart
	function updateChart() {
		if (!chart) return;

		// Si chartData est vide, on met des données vides mais on garde le graphique
		const labels = chartData.length > 0 ? chartData.map((item: any) => item.time) : [];
		const visitors = chartData.length > 0 ? chartData.map((item: any) => item.visitors || 0) : [];

		chart.data.labels = [...labels];
		chart.data.datasets[0].data = [...visitors];
		chart.update('none');
	}

	// Effect to create chart when element is ready
	$effect(() => {
		if (browser && chartElement && !isLoadingChart) {
			if (!chart && chartData.length > 0) {
				// Créer le graphique seulement s'il y a des données initiales
				createChart();
			} else if (chart) {
				// Mettre à jour le graphique existant même si chartData est temporairement vide
				updateChart();
			}
		}
	});

	// Function to get country flag
	function getCountryFlag(location: any) {
		// Try different possible field names for country code
		const countryCode =
			location.country_code || location.country || location.location || location.code;

		if (!countryCode) return '/flags/s/FR.svg';

		// If it's already a 2-letter code, use it
		if (typeof countryCode === 'string' && countryCode.length === 2) {
			return `/flags/s/${countryCode.toUpperCase()}.svg`;
		}

		// If it's a country name, try to map it to a code
		const countryMap: Record<string, string> = {
			France: 'FR',
			'United States': 'US',
			Germany: 'DE',
			'United Kingdom': 'GB',
			Spain: 'ES',
			Italy: 'IT',
			Canada: 'CA',
			Australia: 'AU',
			Japan: 'JP',
			China: 'CN',
			Brazil: 'BR',
			India: 'IN',
			Russia: 'RU',
			Mexico: 'MX',
			Netherlands: 'NL',
			Belgium: 'BE',
			Switzerland: 'CH',
			Austria: 'AT',
			Sweden: 'SE',
			Norway: 'NO',
			Denmark: 'DK',
			Finland: 'FI',
			Poland: 'PL',
			Portugal: 'PT',
			Greece: 'GR',
			Turkey: 'TR',
			'South Korea': 'KR',
			Thailand: 'TH',
			Singapore: 'SG',
			Malaysia: 'MY',
			Indonesia: 'ID',
			Philippines: 'PH',
			Vietnam: 'VN',
			'South Africa': 'ZA',
			Egypt: 'EG',
			Morocco: 'MA',
			Algeria: 'DZ',
			Tunisia: 'TN',
			Argentina: 'AR',
			Chile: 'CL',
			Colombia: 'CO',
			Peru: 'PE',
			Venezuela: 'VE',
			Ecuador: 'EC',
			Uruguay: 'UY',
			Paraguay: 'PY',
			Bolivia: 'BO',
			'Czech Republic': 'CZ',
			Hungary: 'HU',
			Romania: 'RO',
			Bulgaria: 'BG',
			Croatia: 'HR',
			Serbia: 'RS',
			Slovenia: 'SI',
			Slovakia: 'SK',
			Lithuania: 'LT',
			Latvia: 'LV',
			Estonia: 'EE',
			Ireland: 'IE',
			Iceland: 'IS',
			Luxembourg: 'LU',
			Malta: 'MT',
			Cyprus: 'CY',
			Israel: 'IL',
			Lebanon: 'LB',
			Jordan: 'JO',
			'Saudi Arabia': 'SA',
			'United Arab Emirates': 'AE',
			Qatar: 'QA',
			Kuwait: 'KW',
			Bahrain: 'BH',
			Oman: 'OM',
			Iran: 'IR',
			Iraq: 'IQ',
			Pakistan: 'PK',
			Bangladesh: 'BD',
			'Sri Lanka': 'LK',
			Nepal: 'NP',
			Myanmar: 'MM',
			Cambodia: 'KH',
			Laos: 'LA',
			Mongolia: 'MN',
			Kazakhstan: 'KZ',
			Uzbekistan: 'UZ',
			Turkmenistan: 'TM',
			Kyrgyzstan: 'KG',
			Tajikistan: 'TJ',
			Afghanistan: 'AF',
			Ukraine: 'UA',
			Belarus: 'BY',
			Moldova: 'MD',
			Georgia: 'GE',
			Armenia: 'AM',
			Azerbaijan: 'AZ',
			'New Zealand': 'NZ',
			'Papua New Guinea': 'PG',
			Fiji: 'FJ',
			Samoa: 'WS',
			Tonga: 'TO',
			Vanuatu: 'VU',
			'Solomon Islands': 'SB',
			Palau: 'PW',
			Micronesia: 'FM',
			'Marshall Islands': 'MH',
			Kiribati: 'KI',
			Nauru: 'NR',
			Tuvalu: 'TV',
			Mauritius: 'MU'
		};

		const mappedCode = countryMap[countryCode];
		if (mappedCode) {
			return `/flags/s/${mappedCode}.svg`;
		}

		// Default fallback
		return '/flags/s/X.svg';
	}

	// Function to format page path
	function formatPagePath(path: string) {
		if (!path) return '/';
		// Remove domain and keep only path
		const cleanPath = path.replace(/^https?:\/\/[^\/]+/, '');
		return cleanPath || '/';
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Blue Chart Section -->
	<div class="w-full h-full bg-base-100 rounded-xl p-1.5">
		<div class="flex divide-x divide-base-100 rounded-lg bg-base-200 w-full">
			<!-- Visiteurs actuels -->
			<header class="flex-1 py-1">
				<div class="w-full">
					<div>
						<div class="flex items-center px-2 gap-2">
							<div class="font-medium text-xs text-neutral-content">
								<div class="inline-grid *:[grid-area:1/1] space-x-1">
									<div class="status status-error animate-ping"></div>
									<div class="status status-error"></div>
								</div>
								Visiteurs actuels
							</div>
						</div>
						<div class="text-2xl font-bold px-2">
							{currentVisitors}<span class="text-xs align-super"></span>
						</div>
					</div>
				</div>
			</header>
			<!-- Visiteurs uniques -->
			<header class="flex-1 py-1">
				<div class="w-full">
					<div>
						<div class="flex items-center px-2 gap-2">
							<div class="font-medium text-xs text-neutral-content">Visiteurs uniques</div>
						</div>
						<div class="text-2xl font-bold px-2">
							{uniqueVisitors30min}<span class="text-xs align-super"></span>
						</div>
					</div>
				</div>
			</header>

			<!-- Pages vues -->
			<header class="flex-1 py-1">
				<div class="w-full">
					<div>
						<div class="flex items-center px-2 gap-2">
							<div class="font-medium text-xs text-neutral-content">Pages vues</div>
						</div>
						<div class="text-2xl font-bold px-2">
							{pageviews30min}<span class="text-xs align-super"></span>
						</div>
					</div>
				</div>
			</header>
		</div>

		<!-- Chart -->
		<div class="mt-4 h-48 relative">
			{#if chartError}
				<div class="px-4 py-2 bg-error/10 border border-error/20 rounded-lg">
					<p class="text-sm text-error">Erreur: {chartError}</p>
					<button class="btn btn-xs btn-outline btn-error mt-2" onclick={() => fetch30MinuteData()}>
						Réessayer
					</button>
				</div>
			{:else}
				<!-- Canvas toujours présent -->
				<canvas bind:this={chartElement} class="w-full h-full"></canvas>

				<!-- Overlay de chargement seulement pour le chargement initial -->
				{#if isLoadingChart && !chart}
					<div
						class="absolute inset-0 flex items-center justify-center bg-base-100/80 backdrop-blur-sm"
					>
						<span class="loading loading-spinner loading-md"></span>
					</div>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Top Pages Section -->
	<div class="w-full bg-base-100 rounded-xl p-1.5">
		<div class="mb-2">
			<h3 class="text-sm font-medium text-neutral-content px-2">Pages les plus visitées</h3>
		</div>
		<div class="flex gap-3 flex-wrap">
			{#each visitorsStore.topPages.slice(0, 6) as page}
				<div
					class="flex items-center space-x-3 px-4 h-[35px] justify-center py-1 bg-base-200 rounded-lg flex-shrink-0 text-center"
				>
					<div
						class="text-sm font-semibold truncate max-w-[120px]"
						title={formatPagePath(page.pathname)}
					>
						{formatPagePath(page.pathname)}
					</div>
					<div class="font-bold text-[#0a78fe]">{page.visits || 0}</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Top Locations Section -->
	<div class="w-full bg-base-100 rounded-xl p-1.5">
		<div class="mb-2">
			<h3 class="text-sm font-medium text-neutral-content px-2">Pays les plus actifs</h3>
		</div>
		<div class="flex gap-3 flex-wrap">
			{#each visitorsStore.topLocations.slice(0, 6) as location}
				<div
					class="flex items-center space-x-3 w-[100px] h-[35px] justify-center py-1 bg-base-200 rounded-lg flex-shrink-0 text-center"
				>
					<div class="text-sm font-semibold truncate max-w-[60px]">
						<img
							class="w-6 rounded shadow-md"
							alt={location.country || location.location || 'Unknown'}
							src={getCountryFlag(location)}
							onerror={(e) => {
								(e.currentTarget as HTMLImageElement).src = '/flags/s/FR.svg';
							}}
						/>
					</div>
					<div class="text-sm font-semibold">{location.visits || 0}</div>
				</div>
			{/each}
		</div>
	</div>
</div>
