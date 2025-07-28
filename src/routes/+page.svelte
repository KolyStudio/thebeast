<script>
	import DetailedStats from '$lib/components/home/detailedChart.svelte';
	import Encours from '$lib/components/home/statsCard.svelte';
	import TableStats from '$lib/components/home/tableStats.svelte';
	import VisitorsChart from '$lib/components/home/visitorsChart.svelte';
	import DetailedVisitors from '$lib/components/home/detailedVisitors.svelte';
</script>

<section class="flex gap-3">
	<Encours />
	<DetailedStats />
</section>

<section class="flex gap-3">
	<TableStats />
</section>

<section class="flex gap-3">
	<div class="w-1/2 flex gap-3">
		<VisitorsChart />
	</div>
	<div class="w-1/2 grid gap-3">
		<div>
			<DetailedVisitors />
		</div>
	</div>
</section>
