<script>
	import DetailedStats from '$lib/components/home/detailedChart.svelte';
	import Encours from '$lib/components/home/statsCard.svelte';
	import TableStats from '$lib/components/home/tableStats.svelte';
	import VisitorsChart from '$lib/components/home/visitorsChart.svelte';
	import DetailedVisitors from '$lib/components/home/detailedVisitors.svelte';
</script>

<section class="md:flex gap-3">
	<Encours />

	<DetailedStats />
</section>

<section class="flex gap-3">
	<TableStats />
</section>

<section class="flex flex-col md:flex-row gap-3">
	<div class="md:w-1/2 w-full flex gap-3">
		<VisitorsChart />
	</div>
	<div class="md:w-1/2 w-full grid gap-3">
		<div>
			<DetailedVisitors />
		</div>
	</div>
</section>
