<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { statsStore } from '$lib/api/stats.svelte';
	import Chart from 'chart.js/auto';

	let chartElement: HTMLCanvasElement;
	let chart: Chart | null = null;

	// State pour les données dynamiques (types simples)
	let chartData: number[][] = $state([]);
	let chartLabels: string[] = $state([]);

	// Transforme les données du store en format compatible avec ApexCharts
	function processChartData() {
		if (!statsStore.graph?.results?.length) {
			return {
				ventes: [],
				revenus: [],
				labels: []
			};
		}

		const revenus = statsStore.graph.results.map((entry: any) => parseFloat(entry[3] || '0')); // Revenus (barres)
		const ventes = statsStore.graph.results.map((entry: any) => parseFloat(entry[2] || '0')); // Inscriptions (ligne)
		const labels = statsStore.graph.results.map((entry: any) => {
			const date = new Date(entry[0]);
			return date.toLocaleDateString('fr-FR', {
				day: '2-digit',
				month: 'short'
			});
		});

		return { revenus, ventes, labels };
	}

	// Fonction pour mettre à jour le graphique
	function updateChart() {
		if (!chart || !browser) return;

		const { revenus, ventes, labels } = processChartData();

		// Créer des copies non-réactives pour éviter les conflits Svelte 5
		chart.data.labels = [...labels];
		chart.data.datasets[0].data = [...revenus]; // Revenus en barres
		chart.data.datasets[1].data = [...ventes]; // Ventes en ligne
		chart.update('none'); // Pas d'animation
	}

	// Effet pour mettre à jour les données quand le store change
	$effect(() => {
		if (statsStore.graph?.results?.length) {
			const { revenus, ventes, labels } = processChartData();
			chartData = [revenus, ventes]; // [0] = revenus (barres), [1] = ventes (ligne)
			chartLabels = labels;

			// Mettre à jour le graphique si il existe déjà
			updateChart();
		}
	});

	// Plugin personnalisé pour afficher les valeurs dans des étiquettes
	const dataLabelsPlugin = {
		id: 'dataLabels',
		afterDatasetsDraw(chart: any) {
			const { ctx, data } = chart;

			// Seulement pour le dataset "Inscrits" (index 1)
			const dataset = data.datasets[1];
			if (!dataset || dataset.label !== 'Inscrits') return;

			const meta = chart.getDatasetMeta(1);
			if (!meta.visible) return;

			ctx.save();

			meta.data.forEach((point: any, index: number) => {
				const value = dataset.data[index];
				if (value > 0) {
					// Seulement afficher si la valeur est > 0
					const text = value.toString();

					// Mesurer le texte pour dimensionner l'étiquette
					ctx.font = 'bold 11px Arial';
					const textMetrics = ctx.measureText(text);
					const textWidth = textMetrics.width;
					const textHeight = 11; // Hauteur approximative de la police

					// Dimensions de l'étiquette avec padding
					const padding = 6;
					const labelWidth = textWidth + padding * 2;
					const labelHeight = textHeight + padding * 1.5;
					const radius = 4;

					// Position de l'étiquette (sous le point)
					const x = point.x - labelWidth / 2;
					const y = point.y + 8; // 8px sous le point

					// Dessiner le fond de l'étiquette avec bordures arrondies
					ctx.fillStyle = '#2c2b31';
					ctx.beginPath();
					ctx.roundRect(x, y, labelWidth, labelHeight, radius);
					ctx.fill();

					// Dessiner le texte en blanc
					ctx.fillStyle = '#ffffff';
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(text, point.x, y + labelHeight / 2);
				}
			});

			ctx.restore();
		}
	};

	// Configuration Chart.js statique
	function getChartConfig() {
		// Créer des copies non-réactives des données pour éviter les conflits Svelte 5
		const labels = chartLabels.length
			? [...chartLabels] // Copie du tableau
			: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

		const ventesData = chartData[0] ? [...chartData[0]] : [];
		const inscritsData = chartData[1] ? [...chartData[1]] : [];

		return {
			type: 'bar' as const,
			data: {
				labels: labels,
				datasets: [
					{
						label: 'Ventes',
						type: 'bar' as const,
						data: ventesData,
						backgroundColor: '#4bd47a', // Couleur verte pour valeurs positives selon préférences
						borderColor: '#4bd47a',
						borderWidth: 0,
						borderRadius: 4,
						borderSkipped: false,
						yAxisID: 'y'
					},
					{
						label: 'Inscrits',
						type: 'line' as const,
						data: inscritsData,
						borderColor: 'transparent', // Ligne transparente selon les préférences
						backgroundColor: 'transparent',
						borderWidth: 0,
						pointRadius: 0, // Supprimer les points
						pointHoverRadius: 0,
						tension: 0,
						yAxisID: 'y1',
						// Points invisibles
						pointBackgroundColor: 'transparent',
						pointBorderColor: 'transparent',
						pointBorderWidth: 0
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
					mode: 'index' as const,
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
								return tooltipItems[0].label;
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
						display: false,
						grid: {
							display: false
						}
					},
					y: {
						type: 'linear' as const,
						display: false,
						position: 'left' as const,
						grid: {
							display: false
						},
						beginAtZero: true
					},
					y1: {
						type: 'linear' as const,
						display: false,
						position: 'right' as const,
						grid: {
							display: false
						},
						beginAtZero: true
					}
				}
			},
			plugins: [dataLabelsPlugin] // Ajouter le plugin personnalisé
		};
	}

	onMount(() => {
		if (!browser) return;

		// Charger les données du graphique
		const fetchData = async () => {
			try {
				if (!statsStore.graph) {
					await statsStore.fetchGraph();
				}
			} catch (error) {
				console.error('Error fetching graph data:', error);
			}
		};

		// Créer le graphique Chart.js
		const createChart = () => {
			try {
				const ctx = chartElement.getContext('2d');
				if (!ctx) return;

				chart = new Chart(ctx, getChartConfig());

				// Mettre à jour avec les données actuelles si disponibles
				if (statsStore.graph?.results?.length) {
					updateChart();
				}
			} catch (error) {
				console.error('Erreur lors de la création du graphique Chart.js :', error);
			}
		};

		// Charger les données puis créer le graphique avec un petit délai
		fetchData().then(() => {
			// Petit délai pour s'assurer que le DOM est prêt
			setTimeout(() => {
				createChart();
			}, 100);
		});

		return () => {
			if (chart) {
				chart.destroy();
				chart = null;
			}
		};
	});

	// Fonction pour mettre à jour les données du graphique
	export function updateData(newData: { ventes: number[]; revenus: number[] }) {
		if (browser && chart) {
			// Créer des copies non-réactives
			chart.data.datasets[0].data = [...newData.revenus]; // Ventes en barres
			chart.data.datasets[1].data = [...newData.ventes]; // Inscrits en ligne
			chart.update('none');
		}
	}
</script>

<div class="chart-container">
	<canvas bind:this={chartElement} style="height: 290px;"></canvas>
</div>

<style>
	.chart-container {
		width: 100%;
		max-width: 900px;
		margin: 0 auto;
	}
</style>
