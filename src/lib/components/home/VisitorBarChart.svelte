<script lang="ts">
	import Chart from 'chart.js/auto';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Props
	let { data = [], isLoading = false } = $props();

	// State
	let chart: Chart | null = null;
	let chartElement: HTMLCanvasElement;

	// Format date/time for display
	function formatDateTime(dateStr: string): string {
		if (!dateStr) return '';

		try {
			const dateObj = new Date(dateStr);
			// Vérifier si la date est valide
			if (isNaN(dateObj.getTime())) {
				return '';
			}

			// Ajouter 2 heures pour le fuseau français
			dateObj.setHours(dateObj.getHours() + 2);

			return dateObj.toLocaleTimeString('fr-FR', {
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			console.warn('Error formatting date:', dateStr, error);
			return '';
		}
	}

	// Effet pour mettre à jour le graphique quand les données changent
	$effect(() => {
		if (data.length > 0 && !isLoading && browser && chartElement) {
			if (!chart) {
				createChart();
			} else {
				updateChart();
			}
		}
	});

	// Mise à jour du graphique sans réinitialisation
	function updateChart() {
		if (!chart || !data?.length) return;

		// Créer des copies non-réactives pour éviter les conflits Svelte 5
		const labels = data.map((item: any) => formatDateTime(item.t));
		const visits = data.map((item: any) => item.visits || 0);

		chart.data.labels = [...labels];
		chart.data.datasets[0].data = [...visits];
		chart.update('none'); // Mode 'none' pour éviter les animations
	}

	// Création initiale du graphique
	function createChart() {
		if (!chartElement || !data?.length) return;

		// S'assurer que nous ne créons pas de duplicata
		if (chart) {
			chart.destroy();
		}

		const ctx = chartElement.getContext('2d');
		if (!ctx) return;

		// Créer des copies non-réactives pour éviter les conflits Svelte 5
		const labels = data.map((item: any) => formatDateTime(item.t));
		const visits = data.map((item: any) => item.visits || 0);

		chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: [...labels], // Copie non-réactive
				datasets: [
					{
						label: 'Visites',
						data: [...visits], // Utiliser la variable visits
						backgroundColor: '#3B81F6',
						borderRadius: 4,
						borderSkipped: false
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: {
					duration: 0 // Désactiver les animations pour éviter des mises à jour supplémentaires
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
								const label = context.dataset.label;
								const value = context.raw;
								return `${label}: ${value}`;
							}
						}
					}
				},
				scales: {
					x: {
						display: false
					},
					y: {
						display: false,
						beginAtZero: true
					}
				}
			}
		});
	}

	// Nettoyage lors du démontage
	onMount(() => {
		return () => {
			if (chart) {
				chart.destroy();
				chart = null;
			}
		};
	});
</script>

<div class="mt-4 h-48">
	<canvas bind:this={chartElement} class="w-full h-full"></canvas>
</div>
