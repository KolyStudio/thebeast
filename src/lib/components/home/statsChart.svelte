<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { ventesStore, parsePayoutToNumber } from '$lib/api/ventes.svelte';
	import Chart from 'chart.js/auto';

	let chartElement: HTMLCanvasElement;
	let chart: Chart | null = null;

	// State pour les données dynamiques (types simples)
	let chartData: number[][] = $state([]);
	let chartLabels: string[] = $state([]);

	// Transforme les données du store de ventes en format compatible avec Chart.js
	function processChartData() {
		if (!ventesStore.graph?.results?.length) {
			return {
				ventes: [],
				labels: []
			};
		}

		// Grouper les ventes par date et sommer les payouts
		const groupedByDate = new Map<string, { payout: number; date: Date }>();

		ventesStore.graph.results.forEach((vente) => {
			const dateObj = new Date(vente.created_at);
			const dateKey = dateObj.toLocaleDateString('fr-FR', {
				day: '2-digit',
				month: 'short'
			});

			// Utiliser le début de la journée pour une date fixe et cohérente
			const dayStartDate = new Date(dateObj);
			dayStartDate.setHours(0, 0, 0, 0);

			const current = groupedByDate.get(dateKey) || { payout: 0, date: dayStartDate };
			groupedByDate.set(dateKey, {
				payout: current.payout + parsePayoutToNumber(vente.payout),
				date: current.date // Conserver la date fixe (début de journée)
			});
		});

		// Trier par date (du plus ancien au plus récent) en se basant sur la valeur "date"
		const sortedEntries = Array.from(groupedByDate.entries()).sort(
			([, a], [, b]) => a.date.getTime() - b.date.getTime()
		);

		const labels = sortedEntries.map(([label]) => label);
		const ventes = sortedEntries.map(([, data]) => data.payout);

		return { ventes, labels };
	}

	// Fonction pour mettre à jour le graphique
	function updateChart() {
		if (!chart || !browser) return;

		const { ventes, labels } = processChartData();

		// Créer des copies non-réactives pour éviter les conflits Svelte 5
		chart.data.labels = [...labels];
		chart.data.datasets[0].data = [...ventes]; // Ventes en barres
		chart.update('none'); // Pas d'animation
	}

	// Effet pour mettre à jour les données quand le store change
	$effect(() => {
		if (ventesStore.graph?.results?.length) {
			const { ventes, labels } = processChartData();
			chartData = [ventes]; // Seulement les ventes
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

		return {
			type: 'bar' as const,
			data: {
				labels: labels,
				datasets: [
					{
						label: 'Ventes',
						type: 'bar' as const,
						data: ventesData,
						backgroundColor: '#55c182', // Couleur préférée pour valeurs positives
						borderColor: '#55c182',
						borderWidth: 0,
						borderRadius: 4,
						borderSkipped: false,
						yAxisID: 'y'
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
				if (!ventesStore.graph) {
					await ventesStore.fetchGraph();
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
				if (ventesStore.graph?.results?.length) {
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
	export function updateData(newData: { ventes: number[] }) {
		if (browser && chart) {
			// Créer des copies non-réactives
			chart.data.datasets[0].data = [...newData.ventes]; // Ventes en barres
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
