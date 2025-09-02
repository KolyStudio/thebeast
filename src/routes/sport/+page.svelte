<script lang="ts">
	import { Activity, TrendingUp, Calendar, Target, Clock, Scale } from 'lucide-svelte';
	import WeightTracker from '$lib/components/sport/WeightTracker.svelte';
</script>

<!-- Contenu principal -->

<!-- Widget de suivi des pesées -->
<section class="mb-8">
	<WeightTracker />
</section>

<!-- Objectifs -->
<section>
	<h2 class="text-xl font-semibold text-base-content mb-4 flex items-center gap-2">
		<Target class="w-5 h-5" />
		Objectifs du mois
	</h2>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div class="bg-base-200 rounded-xl p-4">
			<div class="flex items-center justify-between mb-2">
				<span class="text-base-content font-medium">Séances d'entraînement</span>
				<span class="text-sm text-base-content/70">15/20</span>
			</div>
			<div class="w-full bg-base-300 rounded-full h-2">
				<div class="bg-primary h-2 rounded-full" style="width: 75%"></div>
			</div>
			<p class="text-xs text-base-content/70 mt-1">75% de l'objectif atteint</p>
		</div>

		<div class="bg-base-200 rounded-xl p-4">
			<div class="flex items-center justify-between mb-2">
				<span class="text-base-content font-medium">Calories brûlées</span>
				<span class="text-sm text-base-content/70">8,500/10,000</span>
			</div>
			<div class="w-full bg-base-300 rounded-full h-2">
				<div class="bg-warning h-2 rounded-full" style="width: 85%"></div>
			</div>
			<p class="text-xs text-base-content/70 mt-1">85% de l'objectif atteint</p>
		</div>
	</div>
</section>
