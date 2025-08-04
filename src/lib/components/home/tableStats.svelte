<script lang="ts">
	import { statsStore } from '$lib/api/stats.svelte';
	import { visitorsStore } from '$lib/api/visitors.svelte';
	import dayjs from 'dayjs';
	import 'dayjs/locale/fr';
	import isoWeek from 'dayjs/plugin/isoWeek';
	import timezone from 'dayjs/plugin/timezone';
	import utc from 'dayjs/plugin/utc';

	dayjs.extend(isoWeek);
	dayjs.extend(timezone);
	dayjs.extend(utc);
	dayjs.locale('fr');

	let activePreset = $state('today');
	let startDate = $state('');
	let endDate = $state('');

	const presetItems = [
		{ label: "Aujourd'hui", value: 'today' },
		{ label: 'Hier', value: 'yesterday' },
		{ label: 'Cette semaine', value: 'week' },
		{ label: 'Ce mois', value: 'month' },
		{ label: 'Personnalisé', value: 'custom' }
	];

	// En-têtes du tableau
	const headers = [
		'S1',
		'Clics',
		'Inscrits',
		'Essais',
		'Essais (€)',
		'Bills',
		'Bills (€)',
		'Upsells (€)',
		'Rebill (€)',
		'Impayés',
		'Total'
	];

	function handlePresetClick(preset: string) {
		if (preset === 'custom') {
			activePreset = 'custom';
			return;
		}

		const now = dayjs();
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

		updateData(dayjs(startDateStr), dayjs(endDateStr));
	}

	async function updateData(start: dayjs.Dayjs, end: dayjs.Dayjs) {
		// Mettre à jour les données des stats
		await statsStore.fetchDetailed(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));

		// Mettre à jour les données des visiteurs
		const dateRange = {
			start: {
				year: start.year(),
				month: start.month() + 1, // dayjs months are 0-indexed, but our API expects 1-indexed
				day: start.date()
			},
			end: {
				year: end.year(),
				month: end.month() + 1,
				day: end.date()
			}
		};

		await visitorsStore.fetchAllData(dateRange);
	}

	// Chargement initial
	$effect(() => {
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

	function formatCurrency(value: string | number | undefined | null): string {
		const formatted = formatNumber(value);
		return formatted === '-' ? '-' : `${formatted} €`;
	}

	function sumColumn(index: number) {
		if (!statsStore.detailed?.results) {
			return 0;
		}
		const sum = statsStore.detailed.results.reduce(
			(sum: number, row: any) => sum + (parseFloat(row[index]) || 0),
			0
		);
		return sum;
	}

	const sortedResults = $derived(
		mergeRowsByS1([...(statsStore.detailed?.results || [])])
			.filter((row) => {
				const clicks = row[2] === '-' ? 0 : parseFloat(row[2] || '0');
				const inscrits = row[3] === '-' ? 0 : parseFloat(row[3] || '0');
				const total = row[16] === '-' ? 0 : parseFloat(row[16] || '0');
				return clicks !== 0 || inscrits !== 0 || total !== 0;
			})
			.sort((a, b) => {
				const totalA = a[16] === '-' ? 0 : parseFloat(a[16] || '0');
				const totalB = b[16] === '-' ? 0 : parseFloat(b[16] || '0');
				if (totalB !== totalA) {
					return totalB - totalA;
				}
				// En cas d'égalité des totaux, trier par nombre d'inscrits
				const inscritsA = a[3] === '-' ? 0 : parseFloat(a[3] || '0');
				const inscritsB = b[3] === '-' ? 0 : parseFloat(b[3] || '0');
				return inscritsB - inscritsA;
			})
	);

	function mergeRowsByS1(rows: string[][]) {
		const mergedRows = new Map<string, string[]>();

		for (const row of rows) {
			const s1 = row[0];
			if (!mergedRows.has(s1)) {
				mergedRows.set(s1, [...row]);
			} else {
				const existingRow = mergedRows.get(s1)!;
				// Additionner les valeurs numériques
				for (let i = 2; i < row.length; i++) {
					const existingValue = existingRow[i] === '-' ? 0 : parseFloat(existingRow[i] || '0');
					const newValue = row[i] === '-' ? 0 : parseFloat(row[i] || '0');
					const sum = existingValue + newValue;
					existingRow[i] = sum === 0 ? '-' : sum.toString();
				}
			}
		}

		return Array.from(mergedRows.values());
	}

	// Calcul des totaux - doit correspondre exactement aux colonnes affichées
	const totals = $derived.by(() => {
		if (!statsStore.detailed?.results) {
			return Array(headers.length - 1).fill('-');
		}

		const results = [];
		// Ordre des colonnes dans le tableau :
		// Clics (index 2), Inscrits (3), Essais (4), Essais € (9), Bills (5), Bills € (13), Upsells € (10), Rebill € (14), Impayés (8), Total € (16)
		const columnIndices = [2, 3, 4, 9, 5, 13, 10, 14, 8, 16];
		const currencyColumns = [9, 13, 10, 14, 16]; // Colonnes monétaires

		for (const columnIndex of columnIndices) {
			const sum = sumColumn(columnIndex);
			if (currencyColumns.includes(columnIndex)) {
				results.push(formatCurrency(sum));
			} else {
				results.push(formatNumber(sum));
			}
		}
		return results;
	});
</script>

<div class="overflow-x-auto my-3 text-sm bg-base-100 rounded-lg w-full">
	<!-- Sélecteur de dates -->
	<div class="flex items-center gap-2 cursor-pointer">
		<select
			class="select select-neutral w-[200px] bg-base-300 m-2 outline-0 cursor-pointer hover:bg-base-200"
			bind:value={activePreset}
			onchange={() => handlePresetClick(activePreset)}
		>
			{#each presetItems as item}
				<option value={item.value}>{item.label}</option>
			{/each}
		</select>

		{#if activePreset != 'custom'}
			<div class="flex gap-2">
				<input
					type="date"
					class="input input-bordered bg-base-300 hover:bg-base-200"
					bind:value={startDate}
					onchange={() => updateData(dayjs(startDate), dayjs(endDate))}
				/>
				<input
					type="date"
					class="input input-bordered bg-base-300 hover:bg-base-200"
					bind:value={endDate}
					onchange={() => updateData(dayjs(startDate), dayjs(endDate))}
				/>
			</div>
		{/if}
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
			{#each sortedResults as row, index}
				<tr class="bg-base-100 text-neutral-content/80">
					<td class="p-2 h-12 first:rounded-bl-lg last:rounded-br-lg first:text-left">{row[0]}</td>
					<td class="p-2 h-12">{formatNumber(row[2])}</td>
					<td class="p-2 h-12">{formatNumber(row[3])}</td>
					<td class="p-2 h-12">{formatNumber(row[4])}</td>
					<td class="p-2 h-12">{formatCurrency(row[9])}</td>
					<td class="p-2 h-12">{formatNumber(row[5])}</td>
					<td class="p-2 h-12">{formatCurrency(row[13])}</td>
					<td class="p-2 h-12">{formatCurrency(row[10])}</td>
					<td class="p-2 h-12">{formatCurrency(row[14])}</td>
					<td class="p-2 h-12">{formatNumber(row[8])}</td>
					<td class="p-2 h-12 font-semibold text-white">{formatCurrency(row[16])}</td>
				</tr>
			{/each}
			<!-- Ligne de total -->
			{#if sortedResults.length > 0}
				<tr class="bg-base-200 font-bold">
					<td class="p-2 h-12 first:text-left">Total</td>
					{#each totals as total}
						<td class="p-2 h-12">{total}</td>
					{/each}
				</tr>
			{/if}
		</tbody>
	</table>
</div>

<style>
</style>
