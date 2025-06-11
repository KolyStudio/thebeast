<script lang="ts">
	import { ventesStore, parsePayoutToNumber } from '$lib/api/ventes.svelte';
	import { visitorsStore } from '$lib/api/visitors.svelte';
	import DateRangePicker from '$lib/components/ui/date-range-picker.svelte';
	import { CalendarDate, type DateValue } from '@internationalized/date';
	import dayjs from 'dayjs';
	import 'dayjs/locale/fr';
	import isoWeek from 'dayjs/plugin/isoWeek';
	import timezone from 'dayjs/plugin/timezone';
	import utc from 'dayjs/plugin/utc';

	let USDtoEUR = 0.8742424;
	dayjs.extend(utc);
	dayjs.extend(timezone);
	dayjs.extend(isoWeek);
	dayjs.locale('fr');

	let activePreset = $state('today');
	let startDate = $state('');
	let endDate = $state('');

	// Variable pour le DateRangePicker de Shadcn
	let dateRangeValue = $state<{ start: DateValue; end: DateValue } | undefined>();

	const presetItems = [
		{ label: "Aujourd'hui", value: 'today' },
		{ label: 'Hier', value: 'yesterday' },
		{ label: 'Cette semaine', value: 'week' },
		{ label: 'Ce mois', value: 'month' },
		{ label: 'Personnalisé', value: 'custom' }
	];

	// En-têtes du tableau avec source
	const headers = ['Source', 'Ventes', 'Total'];

	/**
	 * Convertit une DateValue en string YYYY-MM-DD
	 */
	function dateValueToString(dateValue: DateValue | undefined): string {
		if (!dateValue) return '';
		return `${dateValue.year}-${String(dateValue.month).padStart(2, '0')}-${String(dateValue.day).padStart(2, '0')}`;
	}

	/**
	 * Convertit une string YYYY-MM-DD en DateValue
	 */
	function stringToDateValue(dateStr: string): DateValue | undefined {
		if (!dateStr) return undefined;
		const [year, month, day] = dateStr.split('-').map(Number);
		return new CalendarDate(year, month, day);
	}

	/**
	 * Trouve le preset correspondant aux dates données
	 */
	function findMatchingPreset(startDateStr: string, endDateStr: string): string | null {
		const now = dayjs().tz('Europe/Paris');

		// Aujourd'hui
		const todayStr = now.format('YYYY-MM-DD');
		if (startDateStr === todayStr && endDateStr === todayStr) {
			return 'today';
		}

		// Hier
		const yesterdayStr = now.subtract(1, 'day').format('YYYY-MM-DD');
		if (startDateStr === yesterdayStr && endDateStr === yesterdayStr) {
			return 'yesterday';
		}

		// Cette semaine
		const weekStartStr = now.startOf('isoWeek').format('YYYY-MM-DD');
		const weekEndStr = now.format('YYYY-MM-DD');
		if (startDateStr === weekStartStr && endDateStr === weekEndStr) {
			return 'week';
		}

		// Ce mois
		const monthStartStr = now.startOf('month').format('YYYY-MM-DD');
		const monthEndStr = now.format('YYYY-MM-DD');
		if (startDateStr === monthStartStr && endDateStr === monthEndStr) {
			return 'month';
		}

		return null; // Aucun preset ne correspond
	}

	function handlePresetClick(preset: string) {
		if (preset === 'custom') {
			activePreset = 'custom';
			// Pour le mode personnalisé, initialiser avec les dates actuelles si vides
			if (!startDate || !endDate) {
				const now = dayjs().tz('Europe/Paris');
				startDate = now.format('YYYY-MM-DD');
				endDate = now.format('YYYY-MM-DD');
				// Synchroniser avec le DateRangePicker
				const startVal = stringToDateValue(startDate);
				const endVal = stringToDateValue(endDate);
				if (startVal && endVal) {
					dateRangeValue = { start: startVal, end: endVal };
				}
			}
			return;
		}

		// Utiliser la timezone Europe/Paris pour être cohérent avec l'API
		const now = dayjs().tz('Europe/Paris');
		let startDateStr: string;
		let endDateStr: string;

		switch (preset) {
			case 'today':
				startDateStr = endDateStr = now.format('YYYY-MM-DD');
				break;
			case 'yesterday':
				startDateStr = endDateStr = now.subtract(1, 'day').format('YYYY-MM-DD');
				break;
			case 'week':
				startDateStr = now.startOf('isoWeek').format('YYYY-MM-DD');
				endDateStr = now.format('YYYY-MM-DD');
				break;
			case 'month':
				startDateStr = now.startOf('month').format('YYYY-MM-DD');
				endDateStr = now.format('YYYY-MM-DD');
				break;
			default:
				startDateStr = endDateStr = now.format('YYYY-MM-DD');
		}

		activePreset = preset;
		startDate = startDateStr;
		endDate = endDateStr;

		// Synchroniser avec le DateRangePicker
		const startVal = stringToDateValue(startDateStr);
		const endVal = stringToDateValue(endDateStr);
		if (startVal && endVal) {
			dateRangeValue = { start: startVal, end: endVal };
		}

		console.log(`📅 Filtrage des ventes: ${startDateStr} à ${endDateStr} (preset: ${preset})`);
		updateData(startDateStr, endDateStr);
	}

	async function updateData(startDateStr: string, endDateStr: string) {
		console.log(`🔄 Mise à jour des données: ${startDateStr} à ${endDateStr}`);

		try {
			// Mettre à jour les données des ventes
			await ventesStore.fetchDetailed(startDateStr, endDateStr);

			console.log(
				`📊 Données récupérées: ${ventesStore.detailed?.count || 0} ventes, total: ${ventesStore.detailed?.totalPayout || 0}€`
			);

			// Mettre à jour les données des visiteurs
			const startDate = dayjs(startDateStr);
			const endDate = dayjs(endDateStr);

			const dateRange = {
				start: {
					year: startDate.year(),
					month: startDate.month() + 1, // dayjs months are 0-indexed, but our API expects 1-indexed
					day: startDate.date()
				},
				end: {
					year: endDate.year(),
					month: endDate.month() + 1,
					day: endDate.date()
				}
			};

			await visitorsStore.fetchAllData(dateRange);
		} catch (error) {
			console.error('❌ Erreur lors de la mise à jour des données:', error);
		}
	}

	// Surveillance des changements dans le store des ventes
	$effect(() => {
		if (ventesStore.detailed) {
			console.log('📊 Store des ventes mis à jour:', {
				count: ventesStore.detailed.count,
				totalPayout: ventesStore.detailed.totalPayout,
				resultsLength: ventesStore.detailed.results?.length || 0,
				firstResult: ventesStore.detailed.results?.[0],
				isLoading: ventesStore.isLoading.detailed,
				error: ventesStore.errors.detailed
			});
		}
	});

	// Chargement initial
	$effect(() => {
		console.log('🚀 Initialisation du composant tableStats');
		handlePresetClick('today');
	});

	function formatNumber(value: string | number | undefined | null): string {
		if (value === undefined || value === null || value === '-') return '-';
		const num = typeof value === 'string' ? parseFloat(value) : value;
		if (isNaN(num)) return '-';
		if (num === 0) return '-';
		if (Number.isInteger(num)) return num.toString();
		return num.toFixed(2);
	}

	// Données simplifiées pour les ventes groupées par source
	const ventesData = $derived(() => {
		if (!ventesStore.detailed?.results) {
			console.log('⚠️ Aucune donnée de ventes disponible');
			return [];
		}

		console.log(`📈 Traitement de ${ventesStore.detailed.results.length} ventes`);

		// Grouper les ventes par source
		const groupedBySource = new Map<string, { count: number; payout: number }>();

		ventesStore.detailed.results.forEach((vente) => {
			// Utiliser la vraie valeur de source de la BDD, ou 'Inconnu' si vide/null
			const source = vente.source?.trim() || 'Inconnu';
			const current = groupedBySource.get(source) || { count: 0, payout: 0 };
			const payoutValue = parsePayoutToNumber(vente.payout);

			groupedBySource.set(source, {
				count: current.count + 1,
				payout: current.payout + payoutValue
			});
		});

		// Convertir en format tableau et trier par total décroissant, puis par nombre de ventes
		const result = Array.from(groupedBySource.entries())
			.map(([source, data]) => ({
				source,
				ventes: data.count,
				total: data.payout
			}))
			.sort((a, b) => {
				// Trier d'abord par total (décroissant)
				if (b.total !== a.total) {
					return b.total - a.total;
				}
				// En cas d'égalité, trier par nombre de ventes (décroissant)
				return b.ventes - a.ventes;
			});

		console.log(`📊 Données groupées par source:`, result);
		return result;
	});

	// Calcul des totaux
	const totals = $derived(() => {
		const totalVentes = ventesData().reduce((sum: number, item: any) => sum + item.ventes, 0);
		const totalPayout = ventesData().reduce((sum: number, item: any) => sum + item.total, 0);
		return [totalVentes, (totalPayout * USDtoEUR).toFixed(2) + ' €']; // [Ventes, Total en €]
	});
</script>

<div class="overflow-x-auto my-3 text-sm bg-base-100 border border-base-200 rounded-lg w-full">
	<!-- Sélecteur de dates -->
	<div class="flex md:flex-row flex-col items-center gap-2 md:mb-0 mb-2">
		<select
			class="select select-neutral w-[200px] bg-base-300 m-2 outline-0 cursor-pointer hover:bg-base-200"
			bind:value={activePreset}
			onchange={() => handlePresetClick(activePreset)}
		>
			{#each presetItems as item}
				<option value={item.value}>{item.label}</option>
			{/each}
		</select>

		<!-- DateRangePicker toujours visible -->
		<DateRangePicker
			bind:value={dateRangeValue}
			placeholder="Sélectionner une plage de dates"
			class="w-[320px]"
			onchange={() => {
				if (dateRangeValue && dateRangeValue.start && dateRangeValue.end) {
					startDate = dateValueToString(dateRangeValue.start);
					endDate = dateValueToString(dateRangeValue.end);

					// Vérifier si la plage correspond à un preset existant
					const matchingPreset = findMatchingPreset(startDate, endDate);
					activePreset = matchingPreset || 'custom';

					console.log(
						`📅 Plage de dates sélectionnée: ${startDate} à ${endDate} (preset: ${activePreset})`
					);
					updateData(startDate, endDate);
				}
			}}
		/>
	</div>

	<table class="w-full border-collapse overflow-hidden font-medium text-center">
		<thead>
			<tr class="bg-base-200 h-12 rounded-t-lg text-neutral-content/80 font-medium text-center">
				{#each headers as header}
					<th class="p-2 first:text-left font-semibold text-center">{header}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each ventesData() as item}
				<tr class="bg-base-100 text-neutral-content/80">
					<td class="p-2 h-12 first:rounded-bl-lg last:rounded-br-lg first:text-left"
						>{item.source}</td
					>
					<td class="p-2 h-12">{formatNumber(item.ventes)}</td>
					<td class="p-2 h-12 font-semibold text-white"
						>{parsePayoutToNumber(item.total * USDtoEUR).toFixed(2)} €</td
					>
				</tr>
			{/each}
			<!-- Ligne de total -->
			{#if ventesData().length > 0}
				<tr class="bg-base-200 font-bold">
					<td class="p-2 h-12 first:text-left">Total</td>
					{#each totals() as total}
						<td class="p-2 h-12">{total}</td>
					{/each}
				</tr>
			{/if}
		</tbody>
	</table>
</div>

<style>
</style>
