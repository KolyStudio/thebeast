<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Chart from 'chart.js/auto';
	import {
		Scale,
		TrendingDown,
		TrendingUp,
		Pencil,
		Plus,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';
	import WeightDialog from './WeightDialog.svelte';
	import { supabase } from '$lib/supabaseClient';

	let chartElement: HTMLCanvasElement;
	let chart: Chart | null = null;

	// État pour la période sélectionnée
	type Period = '5J' | '1S' | '1M' | '3M' | '6M' | '1A' | 'Tout';
	let selectedPeriod = $state<Period>('1S');

	// État pour la navigation temporelle
	let currentOffset = $state(0); // 0 = période actuelle, -1 = précédente, +1 = suivante

	// État pour le dialog de gestion des pesées
	let weightDialogOpen = $state(false);
	let selectedWeightForEdit = $state<{ date: Date; weight: number; id?: number } | null>(null);

	// État pour les données de la base
	let realWeightData = $state<
		{ date: Date; weight: number; id: number; created_at: Date; is_cycle_start?: boolean }[]
	>([]);
	let isLoadingWeights = $state(false);

	// Fonction pour récupérer les pesées de la base de données
	async function fetchWeights() {
		if (!browser) return;

		isLoadingWeights = true;
		try {
			const { data, error } = await supabase
				.from('weights')
				.select('id, date, weight, created_at, is_cycle_start')
				.order('date', { ascending: false })
				.order('created_at', { ascending: true }); // Tri secondaire par ordre chronologique d'ajout

			if (error) {
				console.error('Erreur lors de la récupération des pesées:', error);
				return;
			}

			realWeightData = (data || []).map((item) => ({
				id: item.id,
				date: new Date(item.date),
				weight: parseFloat(item.weight), // Convertir en nombre
				created_at: new Date(item.created_at),
				is_cycle_start: item.is_cycle_start || false
			}));
		} catch (error) {
			console.error('Erreur lors de la récupération des pesées:', error);
		} finally {
			isLoadingWeights = false;
		}
	}

	// Fonction pour générer les données du graphique à partir des vraies données
	function generateChartData(period: Period) {
		if (!browser || !period) {
			return { data: [], labels: [] };
		}

		const filteredData = weightHistory();

		if (filteredData.length === 0) {
			return { data: [], labels: [] };
		}

		// Trier par date croissante pour le graphique, puis par ordre chronologique d'ajout
		const sortedData = [...filteredData].sort((a, b) => {
			const dateCompare = a.date.getTime() - b.date.getTime();
			if (dateCompare !== 0) return dateCompare;
			// Si même date, trier par ordre chronologique d'ajout
			return a.created_at.getTime() - b.created_at.getTime();
		});

		const data = sortedData.map((entry) => entry.weight);
		const labels = sortedData.map((entry) => {
			const date = entry.date;

			// Format des labels selon la période
			if (period === '1S') {
				const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
				return dayNames[date.getDay()];
			} else if (period === '1M') {
				const monthNames = [
					'jan',
					'fév',
					'mars',
					'avr',
					'mai',
					'juin',
					'juil',
					'août',
					'sept',
					'oct',
					'nov',
					'déc'
				];
				const day = date.getDate();
				const month = monthNames[date.getMonth()];
				return `${day} ${month}`;
			} else {
				const monthNames = [
					'jan',
					'fév',
					'mars',
					'avr',
					'mai',
					'juin',
					'juil',
					'août',
					'sept',
					'oct',
					'nov',
					'déc'
				];
				const day = date.getDate();
				const month = monthNames[date.getMonth()];
				return `${day} ${month}`;
			}
		});

		return { data, labels };
	}

	// Fonction pour récupérer les données de la période précédente équivalente
	function getPreviousPeriodData(): {
		date: Date;
		weight: number;
		id: number;
		created_at: Date;
		is_cycle_start?: boolean;
	}[] {
		if (!browser) return [];

		const now = new Date();
		let startDate: Date;
		let endDate: Date;

		switch (selectedPeriod) {
			case '5J':
				// Pour les cycles, récupérer le cycle précédent du cycle affiché
				const cycleStarts = realWeightData
					.filter((entry) => entry.is_cycle_start)
					.sort((a, b) => b.date.getTime() - a.date.getTime());

				const targetCycleIndex = currentOffset + 1; // Cycle précédent du cycle affiché
				if (targetCycleIndex >= cycleStarts.length) return []; // Pas de cycle précédent

				const targetCycleStart = cycleStarts[targetCycleIndex];
				const nextCycleStart = targetCycleIndex > 0 ? cycleStarts[targetCycleIndex - 1] : null;

				if (nextCycleStart) {
					return realWeightData.filter(
						(entry) => entry.date >= targetCycleStart.date && entry.date < nextCycleStart.date
					);
				} else {
					// Premier cycle (le plus récent après le cycle actuel)
					return realWeightData.filter((entry) => entry.date >= targetCycleStart.date);
				}

			case '1S':
				// Semaine précédente de la semaine affichée (lundi-dimanche)
				const today = new Date(now);
				const dayOfWeek = today.getDay();
				const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

				// Lundi de la semaine précédente de la semaine affichée
				const previousMondayOfWeek = new Date(today);
				previousMondayOfWeek.setDate(today.getDate() - daysToSubtract - (currentOffset + 1) * 7);
				previousMondayOfWeek.setHours(0, 0, 0, 0);

				// Dimanche de la semaine précédente de la semaine affichée
				const previousSundayOfWeek = new Date(previousMondayOfWeek);
				previousSundayOfWeek.setDate(previousMondayOfWeek.getDate() + 6);
				previousSundayOfWeek.setHours(23, 59, 59, 999);

				startDate = previousMondayOfWeek;
				endDate = previousSundayOfWeek;
				break;

			case '1M':
				// Mois précédent du mois affiché
				startDate = new Date(now.getFullYear(), now.getMonth() - currentOffset - 1, 1);
				endDate = new Date(now.getFullYear(), now.getMonth() - currentOffset, 1);
				break;

			case '3M':
				// 3 mois précédents de la période affichée
				startDate = new Date(now.getFullYear(), now.getMonth() - 2 - (currentOffset + 1) * 3, 1);
				endDate = new Date(now.getFullYear(), now.getMonth() + 1 - (currentOffset + 1) * 3, 1);
				break;

			case '6M':
				// 6 mois précédents de la période affichée
				startDate = new Date(now.getFullYear(), now.getMonth() - 5 - (currentOffset + 1) * 6, 1);
				endDate = new Date(now.getFullYear(), now.getMonth() + 1 - (currentOffset + 1) * 6, 1);
				break;

			case '1A':
				// Année précédente de l'année affichée
				startDate = new Date(now.getFullYear() - 1 - currentOffset - 1, 0, 1);
				endDate = new Date(now.getFullYear() - currentOffset - 1, 0, 1);
				break;

			case 'Tout':
				// Pas de période précédente pour "Tout"
				return [];

			default:
				return [];
		}

		return realWeightData.filter((entry) => entry.date >= startDate && entry.date < endDate);
	}

	// Calculer les statistiques avec comparaison entre périodes
	function calculateStats(data: number[] | undefined | null) {
		// Vérifications de sécurité pour éviter les erreurs
		if (!data || !Array.isArray(data) || data.length === 0) {
			return { average: 0, difference: 0, latest: 0 };
		}

		const latest = data[data.length - 1];
		const average = data.reduce((sum, weight) => sum + weight, 0) / data.length;

		// Calculer la différence selon le type de période
		let difference = 0;

		if (selectedPeriod === 'Tout') {
			// Pour "Tout", garder le calcul actuel (première vs dernière pesée)
			const oldest = data[0];
			difference = latest - oldest;
		} else {
			// Pour les autres périodes, comparer avec la période précédente
			const previousPeriodData = getPreviousPeriodData();

			if (previousPeriodData.length > 0) {
				// Calculer la moyenne de la période précédente
				const previousAverage =
					previousPeriodData.reduce((sum, entry) => sum + entry.weight, 0) /
					previousPeriodData.length;
				difference = average - previousAverage;
			} else {
				// Pas de période précédente, utiliser première vs dernière de la période actuelle
				if (data.length > 1) {
					const oldest = data[0];
					difference = latest - oldest;
				} else {
					difference = 0; // Une seule pesée
				}
			}
		}

		return {
			average: parseFloat(average.toFixed(1)),
			difference: parseFloat(difference.toFixed(1)),
			latest
		};
	}

	// Plugin personnalisé pour dessiner la grille en pointillé
	const dashedGridPlugin = {
		id: 'dashedGrid',
		beforeDraw(chart: any) {
			const { ctx, chartArea, scales } = chart;
			if (!chartArea) return;

			ctx.save();
			ctx.setLineDash([2, 3]); // Pointillé
			ctx.strokeStyle = 'oklch(0.2768 0 100%)'; // base-300
			ctx.lineWidth = 0.5;

			// Dessiner les lignes horizontales (axe Y) - par pas de 0.5
			if (scales.y) {
				const yScale = scales.y;
				const min = yScale.min;
				const max = yScale.max;

				// Générer les valeurs par pas de 0.5
				for (let value = Math.ceil(min * 2) / 2; value <= max; value += 0.5) {
					const y = yScale.getPixelForValue(value);
					if (y >= chartArea.top && y <= chartArea.bottom) {
						ctx.beginPath();
						ctx.moveTo(chartArea.left, y);
						ctx.lineTo(chartArea.right, y);
						ctx.stroke();
					}
				}
			}

			// Grille verticale supprimée selon la demande

			ctx.restore();
		}
	};

	// Configuration du graphique
	function createChart() {
		if (!chartElement || !browser) return;

		const ctx = chartElement.getContext('2d');
		if (!ctx) return;

		const { data, labels } = generateChartData(selectedPeriod);

		// Vérification de sécurité pour les données
		if (!data || data.length === 0) return;

		chart = new Chart(ctx, {
			type: 'line',
			plugins: [dashedGridPlugin],
			data: {
				labels: [...labels],
				datasets: [
					{
						label: 'Poids',
						data: [...data],
						borderColor: '#10b981', // Couleur verte comme dans l'image
						backgroundColor: 'transparent',
						borderWidth: 2,
						pointBackgroundColor: 'oklch(0.2804 0 0)', // Couleur de fond du widget (base-200)
						pointBorderColor: '#10b981',
						pointBorderWidth: 2,
						pointRadius: 4,
						pointHoverRadius: 4, // Même taille au survol
						tension: 0.1,
						fill: false
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: false, // Désactiver toutes les animations
				plugins: {
					legend: {
						display: false // Désactiver la légende Chart.js pour utiliser une légende personnalisée
					},
					tooltip: {
						backgroundColor: 'oklch(0.2804 0 0)', // base-200 pour cohérence
						titleColor: '#ffffff',
						bodyColor: '#ffffff',
						borderColor: 'oklch(0.2768 0 0)', // base-300
						borderWidth: 2,
						cornerRadius: 12,
						displayColors: false,
						padding: 12,
						titleFont: {
							size: 13,
							weight: 'bold'
						},
						bodyFont: {
							size: 14,
							weight: 'normal'
						},
						callbacks: {
							title: function (context) {
								return `${context[0].label}`;
							},
							label: function (context) {
								return `${context.parsed.y} kg`;
							}
						}
					}
				},
				scales: {
					x: {
						display: true,
						grid: {
							display: false // On va dessiner la grille avec un plugin personnalisé
						},
						ticks: {
							color: '#ffffff', // Axes en blanc
							font: {
								size: 12
							}
						}
					},
					y: {
						display: true,
						position: 'right',
						grid: {
							display: false // On va dessiner la grille avec un plugin personnalisé
						},
						ticks: {
							color: '#ffffff', // Axes en blanc
							font: {
								size: 12
							},
							stepSize: 0.5, // Pas de 0.5 en 0.5
							callback: function (value) {
								// Afficher seulement les valeurs entières et les .5
								const numValue = Number(value);
								if (numValue % 1 === 0) {
									return numValue.toString(); // 61, 62, 63, etc.
								} else if (numValue % 0.5 === 0) {
									return numValue.toFixed(1); // 61.5, 62.5, etc.
								}
								return ''; // Ne pas afficher les autres valeurs
							}
						},
						min: data.length > 0 ? Math.floor((Math.min(...data) - 1) * 2) / 2 : 0,
						max: data.length > 0 ? Math.ceil((Math.max(...data) + 1) * 2) / 2 : 100
					}
				},
				interaction: {
					intersect: false,
					mode: 'index'
				}
			}
		});
	}

	// Fonction pour mettre à jour le graphique quand la période change
	function updateChart() {
		if (!chart || !browser) return;

		const { data, labels } = generateChartData(selectedPeriod);

		// Vérifications de sécurité
		if (!data || data.length === 0) return;

		chart.data.labels = [...labels];
		chart.data.datasets[0].data = [...data];

		// Mettre à jour les limites de l'axe Y avec vérifications et arrondi aux multiples de 0.5
		if (chart.options?.scales?.y && data.length > 0) {
			const minValue = Math.min(...data);
			const maxValue = Math.max(...data);

			// Arrondir aux multiples de 0.5 les plus proches
			chart.options.scales.y.min = Math.floor((minValue - 1) * 2) / 2; // Arrondir vers le bas
			chart.options.scales.y.max = Math.ceil((maxValue + 1) * 2) / 2; // Arrondir vers le haut
		}

		chart.update('none'); // Pas d'animation lors de la mise à jour
	}

	// Fonction pour changer la période
	function changePeriod(period: Period) {
		selectedPeriod = period;
		currentOffset = 0; // Réinitialiser l'offset quand on change de période
		updateChart();
	}

	// Effet pour recalculer les stats quand la période change
	let currentData = $derived(() => {
		// Vérification pour le SSR et l'état initial
		if (!browser || !selectedPeriod) {
			return { data: [], labels: [] };
		}
		try {
			return generateChartData(selectedPeriod);
		} catch (error) {
			console.warn('Error generating chart data:', error);
			return { data: [], labels: [] };
		}
	});

	let stats = $derived(() => {
		try {
			const data = currentData();
			return calculateStats(data?.data);
		} catch (error) {
			console.warn('Error calculating stats:', error);
			return { average: 0, difference: 0, latest: 0 };
		}
	});

	// Historique des pesées pour l'affichage de la liste (données réelles)
	let weightHistory = $derived(() => {
		if (!browser) {
			return [];
		}
		try {
			// Filtrer les données selon la période sélectionnée et l'offset
			const now = new Date();
			let startDate: Date;
			let endDate: Date;

			switch (selectedPeriod) {
				case '5J':
					// Pour les cycles de 5 jours, trouver les pesées du cycle
					return getCycleWeights(currentOffset);
				case '1S':
					// Pour la semaine calendaire (lundi-dimanche), calculer avec l'offset
					const today = new Date(now);
					const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
					const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Calculer les jours jusqu'au lundi

					// Trouver le lundi de la semaine ciblée
					const mondayOfWeek = new Date(today);
					mondayOfWeek.setDate(today.getDate() - daysToSubtract - currentOffset * 7);
					mondayOfWeek.setHours(0, 0, 0, 0); // Début de journée

					// Trouver le dimanche de la semaine ciblée
					const sundayOfWeek = new Date(mondayOfWeek);
					sundayOfWeek.setDate(mondayOfWeek.getDate() + 6);
					sundayOfWeek.setHours(23, 59, 59, 999); // Fin de journée

					startDate = mondayOfWeek;
					endDate = sundayOfWeek;
					break;
				case '1M':
					// Pour le mois, calculer avec l'offset
					const monthStart = new Date(now.getFullYear(), now.getMonth() - currentOffset, 1);
					startDate = monthStart;
					endDate = new Date(now.getFullYear(), now.getMonth() - currentOffset + 1, 1);
					break;
				case '3M':
					// Pour 3 mois, calculer avec l'offset
					const threeMonthStart = new Date(
						now.getFullYear(),
						now.getMonth() - 2 - currentOffset * 3,
						1
					);
					startDate = threeMonthStart;
					endDate = new Date(now.getFullYear(), now.getMonth() + 1 - currentOffset * 3, 1);
					break;
				case '6M':
					// Pour 6 mois, calculer avec l'offset
					const sixMonthStart = new Date(
						now.getFullYear(),
						now.getMonth() - 5 - currentOffset * 6,
						1
					);
					startDate = sixMonthStart;
					endDate = new Date(now.getFullYear(), now.getMonth() + 1 - currentOffset * 6, 1);
					break;
				case '1A':
					// Pour l'année, calculer avec l'offset
					const yearStart = new Date(now.getFullYear() - 1 - currentOffset, 0, 1);
					startDate = yearStart;
					endDate = new Date(now.getFullYear() - currentOffset, 0, 1);
					break;
				case 'Tout':
					// Pour tout, pas d'offset (toutes les données)
					startDate = new Date(now.getFullYear() - 10, 0, 1);
					endDate = new Date(now.getFullYear() + 1, 0, 1);
					break;
				default:
					startDate = new Date(now.getFullYear(), now.getMonth(), 1);
					endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
			}

			return realWeightData.filter((entry) => entry.date >= startDate && entry.date < endDate);
		} catch (error) {
			console.warn('Error filtering weight history:', error);
			return [];
		}
	});

	// Fonction pour grouper les entrées par semaine
	function groupByWeek(entries: { date: Date; weight: number; id: number; created_at: Date }[]) {
		const groups = new Map<
			string,
			{ date: Date; weight: number; id: number; created_at: Date }[]
		>();

		entries.forEach((entry) => {
			// Obtenir le lundi de la semaine pour cette date
			const date = new Date(entry.date);
			const dayOfWeek = date.getDay();
			const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
			const monday = new Date(date);
			monday.setDate(date.getDate() - daysToSubtract);

			// Créer une clé unique pour la semaine
			const weekKey = monday.toISOString().split('T')[0];

			if (!groups.has(weekKey)) {
				groups.set(weekKey, []);
			}
			groups.get(weekKey)!.push(entry);
		});

		// Convertir en tableau et trier par semaine (plus récente en premier)
		return Array.from(groups.entries())
			.map(([weekKey, entries]) => ({
				weekStart: new Date(weekKey),
				// Trier par date décroissante, puis par ordre chronologique d'ajout (created_at croissant)
				entries: entries.sort((a, b) => {
					const dateCompare = b.date.getTime() - a.date.getTime();
					if (dateCompare !== 0) return dateCompare;
					// Si même date, trier par ordre chronologique d'ajout
					return a.created_at.getTime() - b.created_at.getTime();
				})
			}))
			.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
	}

	// Historique groupé par semaine
	let groupedWeightHistory = $derived(() => {
		const history = weightHistory();
		return groupByWeek(history);
	});

	// Fonctions pour gérer le dialog des pesées
	function openAddWeightDialog() {
		selectedWeightForEdit = null;
		weightDialogOpen = true;
	}

	function openEditWeightDialog(entry: {
		date: Date;
		weight: number;
		id?: number;
		created_at?: Date;
	}) {
		selectedWeightForEdit = {
			date: entry.date,
			weight: entry.weight,
			id: entry.id
		};
		weightDialogOpen = true;
	}

	function closeWeightDialog() {
		weightDialogOpen = false;
		selectedWeightForEdit = null;
	}

	// Fonctions de navigation temporelle
	function navigatePrevious() {
		if (selectedPeriod === 'Tout') return;

		if (selectedPeriod === '5J') {
			// Pour les cycles, vérifier qu'il y a un cycle précédent
			const cycleStarts = realWeightData
				.filter((entry) => entry.is_cycle_start)
				.sort((a, b) => b.date.getTime() - a.date.getTime());

			// Permettre la navigation vers tous les cycles disponibles
			if (currentOffset < cycleStarts.length - 1) {
				currentOffset++;
			}
		} else {
			currentOffset++;
		}

		if (chart) {
			updateChart();
		}
	}

	function navigateNext() {
		if (selectedPeriod === 'Tout') return;

		if (selectedPeriod === '5J') {
			// Pour les cycles, ne pas aller au-delà du cycle actuel
			if (currentOffset > 0) {
				currentOffset--;
			}
		} else {
			currentOffset--;
		}

		if (chart) {
			updateChart();
		}
	}

	// Fonction pour récupérer les pesées d'un cycle spécifique
	function getCycleWeights(
		offset: number
	): { date: Date; weight: number; id: number; created_at: Date; is_cycle_start?: boolean }[] {
		// Trouver toutes les pesées marquées comme début de cycle, triées par date décroissante
		const cycleStarts = realWeightData
			.filter((entry) => entry.is_cycle_start)
			.sort((a, b) => b.date.getTime() - a.date.getTime());

		if (cycleStarts.length === 0) {
			// Aucun cycle démarré
			return [];
		}

		if (offset === 0) {
			// Cycle actuel : depuis la dernière pesée marquée jusqu'à maintenant
			const lastCycleStart = cycleStarts[0];
			return realWeightData.filter((entry) => entry.date >= lastCycleStart.date);
		} else {
			// Cycles précédents
			const cycleIndex = offset;
			if (cycleIndex >= cycleStarts.length) {
				return []; // Pas de cycle à cet offset
			}

			const cycleStart = cycleStarts[cycleIndex];
			const nextCycleStart = cycleIndex > 0 ? cycleStarts[cycleIndex - 1] : null; // Cycle plus récent

			if (nextCycleStart) {
				// Pesées entre ce cycle et le suivant
				return realWeightData.filter(
					(entry) => entry.date >= cycleStart.date && entry.date < nextCycleStart.date
				);
			} else {
				// Premier cycle (le plus récent après le cycle actuel)
				return realWeightData.filter((entry) => entry.date >= cycleStart.date);
			}
		}
	}

	// Fonction pour obtenir le titre de la période actuelle
	function getCurrentPeriodTitle(): string {
		const now = new Date();

		switch (selectedPeriod) {
			case '5J':
				const cycleWeights = getCycleWeights(currentOffset);
				if (cycleWeights.length === 0) {
					return currentOffset === 0 ? 'Aucun cycle en cours' : 'Aucun cycle trouvé';
				}

				if (currentOffset === 0) {
					// Cycle actuel
					const cycleStart = cycleWeights[0]; // Première pesée du cycle
					const daysSinceStart = Math.floor(
						(now.getTime() - cycleStart.date.getTime()) / (1000 * 60 * 60 * 24)
					);
					return `Cycle en cours - Jour ${daysSinceStart + 1}`;
				} else {
					// Cycles précédents - numéroter depuis le plus récent
					const cycleStarts = realWeightData
						.filter((entry) => entry.is_cycle_start)
						.sort((a, b) => b.date.getTime() - a.date.getTime());
					const cycleNumber = cycleStarts.length - currentOffset;
					return `Cycle ${cycleNumber} - ${cycleWeights.length} pesée(s)`;
				}
			case '1S':
				const today = new Date(now);
				const dayOfWeek = today.getDay();
				const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

				// Calculer le lundi et dimanche de la semaine ciblée
				const mondayOfWeek = new Date(today);
				mondayOfWeek.setDate(today.getDate() - daysToSubtract - currentOffset * 7);
				const sundayOfWeek = new Date(mondayOfWeek);
				sundayOfWeek.setDate(mondayOfWeek.getDate() + 6);

				return `Semaine du ${mondayOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${sundayOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

			case '1M':
				const month = new Date(now.getFullYear(), now.getMonth() - currentOffset, 1);
				return month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

			case '3M':
				const threeMonthStart = new Date(
					now.getFullYear(),
					now.getMonth() - 2 - currentOffset * 3,
					1
				);
				const threeMonthEnd = new Date(now.getFullYear(), now.getMonth() - currentOffset * 3, 0);
				return `${threeMonthStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} - ${threeMonthEnd.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;

			case '6M':
				const sixMonthStart = new Date(
					now.getFullYear(),
					now.getMonth() - 5 - currentOffset * 6,
					1
				);
				const sixMonthEnd = new Date(now.getFullYear(), now.getMonth() - currentOffset * 6, 0);
				return `${sixMonthStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} - ${sixMonthEnd.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;

			case '1A':
				const year = now.getFullYear() - 1 - currentOffset;
				return `Année ${year}`;

			case 'Tout':
				return 'Toutes les données';

			default:
				return '';
		}
	}

	async function handleWeightSaved() {
		// Rafraîchir les données depuis la base de données
		await fetchWeights();
		// Mettre à jour le graphique avec les nouvelles données
		if (chart) {
			updateChart();
		}
		closeWeightDialog();
	}

	// Effet pour mettre à jour le graphique quand les données ou la période changent
	$effect(() => {
		if (chart && browser) {
			updateChart();
		}
	});

	onMount(() => {
		if (!browser) return;

		// Charger les données d'abord, puis créer le graphique
		fetchWeights().then(() => {
			createChart();
		});

		return () => {
			if (chart) {
				chart.destroy();
				chart = null;
			}
		};
	});
</script>

<div class="bg-base-100 rounded-xl p-6">
	<!-- En-tête du widget -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-3">
			<div class="p-2 bg-success/20 rounded-lg">
				<Scale class="w-5 h-5 text-success" />
			</div>
			<h2 class="text-xl font-semibold text-base-content">Suivi des pesées</h2>
		</div>
	</div>

	<!-- Statistiques -->
	<div class="grid grid-cols-2 gap-4 mb-6">
		<div>
			<p class="text-sm text-base-content/70">Moyenne</p>
			<p class="text-2xl font-bold text-base-content">
				{stats().average}<span class="text-sm font-normal">&nbsp;kg</span>
			</p>
		</div>
		<div>
			<p class="text-sm text-base-content/70">Différence</p>
			<div class="flex items-center gap-2">
				{#if stats().difference < 0}
					<!-- Perte de poids : texte blanc, icône rouge -->
					<p class="text-2xl font-bold text-white">
						{Math.abs(stats().difference) >= 1
							? `${stats().difference} kg`
							: `-${Math.round(Math.abs(stats().difference) * 1000)} g`}
					</p>
					<TrendingDown class="w-4 h-4 text-error" />
				{:else if stats().difference > 0}
					<!-- Prise de poids : texte blanc, icône verte -->
					<p class="text-2xl font-bold text-white">
						+{stats().difference >= 1
							? `${stats().difference} kg`
							: `${Math.round(stats().difference * 1000)} g`}
					</p>
					<TrendingUp class="w-4 h-4 text-success" />
				{:else}
					<!-- Pas de changement : gris -->
					<p class="text-2xl font-bold text-base-content/70">
						{stats().difference} kg
					</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Période -->
	<p class="text-sm text-base-content/70 mb-4">
		{#if selectedPeriod === '1S'}
			{(() => {
				const today = new Date();
				const dayOfWeek = today.getDay();
				const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
				const monday = new Date(today);
				monday.setDate(today.getDate() - daysToSubtract);
				return monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
			})()}
		{:else if selectedPeriod === '1M'}
			{(() => {
				const today = new Date();
				const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
				return firstDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
			})()}
		{:else if selectedPeriod === '3M'}
			{(() => {
				const today = new Date();
				const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
				return threeMonthsAgo.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
			})()}
		{:else if selectedPeriod === '6M'}
			{(() => {
				const today = new Date();
				const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
				return sixMonthsAgo.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
			})()}
		{:else if selectedPeriod === '1A'}
			{(() => {
				const today = new Date();
				const oneYearAgo = new Date(today.getFullYear() - 1, 0, 1);
				return oneYearAgo.toLocaleDateString('fr-FR', {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				});
			})()}
		{:else}
			{(() => {
				const today = new Date();
				const twoYearsAgo = new Date(today.getFullYear() - 2, 0, 1);
				return twoYearsAgo.toLocaleDateString('fr-FR', {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				});
			})()}
		{/if}
		-
		{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
	</p>

	<!-- Graphique -->
	<div class="h-64 relative">
		<canvas bind:this={chartElement} class="w-full h-full"></canvas>
	</div>

	<!-- Légende personnalisée -->
	<div class="flex justify-center mt-4 mb-6 bg-base-200/50 rounded-lg py-2 w-[250px] m-auto">
		<div class="flex gap-2 text-sm items-center">
			<div class="relative w-6 h-6">
				<div class="absolute top-1/2 left-0 w-6 h-1 bg-success transform -translate-y-1/2"></div>
				<div
					class="absolute top-1/2 left-1/2 w-3 h-3 rounded-full border-2 border-success bg-base-300 transform -translate-x-1/2 -translate-y-1/2"
				></div>
			</div>
			<span class="text-base-content font-medium">Poids</span>
		</div>
	</div>

	<!-- Sélecteur de période avec navigation temporelle -->
	<div class="mt-4">
		<!-- Titre de la période actuelle -->
		<div class="flex items-center justify-center mb-3">
			<h3 class="text-lg font-semibold text-base-content">
				{getCurrentPeriodTitle()}
			</h3>
		</div>

		<!-- Navigation temporelle et sélecteur de période -->
		<div class="flex items-center justify-center gap-4">
			<!-- Bouton précédent -->
			<button
				onclick={navigatePrevious}
				disabled={selectedPeriod === 'Tout' ||
					(selectedPeriod === '5J' &&
						(() => {
							const cycleStarts = realWeightData.filter((entry) => entry.is_cycle_start);
							return currentOffset >= cycleStarts.length - 1;
						})())}
				class="p-2 rounded-lg bg-base-200 hover:bg-base-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				title="Période précédente"
			>
				<ChevronLeft class="w-5 h-5" />
			</button>

			<!-- Sélecteur de période -->
			<div class="h-10 tabs tabs-box w-fit">
				<input
					type="radio"
					name="weight_period_tabs"
					class="h-8 tab"
					aria-label="5J"
					checked={selectedPeriod === '5J'}
					onchange={() => changePeriod('5J')}
				/>
				<input
					type="radio"
					name="weight_period_tabs"
					class="h-8 tab"
					aria-label="1S"
					checked={selectedPeriod === '1S'}
					onchange={() => changePeriod('1S')}
				/>
				<input
					type="radio"
					name="weight_period_tabs"
					class="h-8 tab"
					aria-label="1M"
					checked={selectedPeriod === '1M'}
					onchange={() => changePeriod('1M')}
				/>
				<input
					type="radio"
					name="weight_period_tabs"
					class="h-8 tab"
					aria-label="3M"
					checked={selectedPeriod === '3M'}
					onchange={() => changePeriod('3M')}
				/>
				<input
					type="radio"
					name="weight_period_tabs"
					class="h-8 tab"
					aria-label="6M"
					checked={selectedPeriod === '6M'}
					onchange={() => changePeriod('6M')}
				/>
				<input
					type="radio"
					name="weight_period_tabs"
					class="h-8 tab"
					aria-label="1A"
					checked={selectedPeriod === '1A'}
					onchange={() => changePeriod('1A')}
				/>
				<input
					type="radio"
					name="weight_period_tabs"
					class="h-8 tab"
					aria-label="Tout"
					checked={selectedPeriod === 'Tout'}
					onchange={() => changePeriod('Tout')}
				/>
			</div>

			<!-- Bouton suivant -->
			<button
				onclick={navigateNext}
				disabled={selectedPeriod === 'Tout' || currentOffset <= 0}
				class="p-2 rounded-lg bg-base-200 hover:bg-base-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				title="Période suivante"
			>
				<ChevronRight class="w-5 h-5" />
			</button>
		</div>
	</div>

	<!-- Liste des pesées -->
	<div class="mt-8 no-scrollbar">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-semibold text-base-content flex items-center gap-2">
				<Scale class="w-5 h-5 text-success" />
				Historique des pesées
			</h3>
			<button
				onclick={openAddWeightDialog}
				class="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg cursor-pointer"
				title="Ajouter une nouvelle pesée"
			>
				<span class="text-sm font-medium">Ajouter une pesée</span>
			</button>
		</div>
		{#if isLoadingWeights}
			<div class="text-center py-8">
				<div
					class="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-3"
				>
					<Scale class="w-6 h-6 text-base-content/50 animate-pulse" />
				</div>
				<p class="text-base-content/70">Chargement des pesées...</p>
			</div>
		{:else if groupedWeightHistory().length > 0}
			<div class="space-y-4 max-h-64 overflow-y-auto">
				{#each groupedWeightHistory().slice(0, 4) as week (week.weekStart.getTime())}
					<div class="space-y-2">
						<!-- En-tête de semaine -->
						<div class="text- font-semibold px-2">
							{week.weekStart.toLocaleDateString('fr-FR', {
								day: 'numeric',
								month: 'long'
							})} au {(() => {
								const weekEnd = new Date(week.weekStart);
								weekEnd.setDate(week.weekStart.getDate() + 6);
								return weekEnd.toLocaleDateString('fr-FR', {
									day: 'numeric',
									month: 'long'
								});
							})()}
						</div>

						<!-- Entrées de la semaine -->
						<div class="bg-base-200/50 rounded-lg overflow-hidden no-scrollbar px-3">
							{#each week.entries as entry, index (entry.id)}
								<div
									class="flex items-center justify-between py-3 px-3 transition-colors group {index <
									week.entries.length - 1
										? 'border-b border-base-100/50'
										: ''}"
								>
									<div class="flex items-center gap-6">
										<Scale class="w-6 h-6 text-success" />
										<div class="flex flex-col">
											<span class="text-lg font-bold text-base-content">
												{entry.weight}<span class="text-sm font-normal text-base-content/70"
													>&nbsp;kg</span
												>
											</span>
											<span class="text-sm text-base-content/70">
												{entry.date.toLocaleDateString('fr-FR', {
													weekday: 'long',
													day: 'numeric',
													month: 'long'
												})}
											</span>
										</div>
									</div>
									<button
										onclick={() => openEditWeightDialog(entry)}
										class="bg-base-100 p-2 rounded-lg cursor-pointer hover:bg-base-200 transition-colors"
										title="Modifier cette pesée"
									>
										<Pencil class="w-4 h-4 text-base-content/70 hover:text-base-content" />
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			{#if groupedWeightHistory().length > 4}
				<div class="mt-4 text-center">
					<span class="text-sm text-base-content/70">
						Affichage des 4 semaines les plus récentes sur {groupedWeightHistory().length} au total
					</span>
				</div>
			{/if}
		{:else}
			<div class="text-center py-8">
				<div
					class="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-3"
				>
					<Scale class="w-6 h-6 text-base-content/50" />
				</div>
				<p class="text-base-content/70">Aucune pesée disponible pour cette période</p>
			</div>
		{/if}
	</div>
</div>

<!-- Dialog de gestion des pesées -->
<WeightDialog
	bind:open={weightDialogOpen}
	selectedWeight={selectedWeightForEdit}
	onClose={closeWeightDialog}
	onSave={handleWeightSaved}
/>
