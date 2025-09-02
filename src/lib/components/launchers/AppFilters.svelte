<script lang="ts">
	import { cn } from '$lib/utils';

	let { appFilters, onToggleApp } = $props<{
		appFilters: Record<string, boolean>;
		onToggleApp: (app: string, value: boolean) => void;
	}>();
</script>

<div class="flex items-center gap-2 p-1 rounded-xl">
	<button
		class={cn(
			'px-4 py-1.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer',
			appFilters.fruitz
				? 'bg-base-100  text-white shadow-sm'
				: 'bg-transparent text-muted-foreground hover:bg-base-200 hover:text-foreground'
		)}
		onclick={() => onToggleApp('fruitz', !appFilters.fruitz)}
	>
		<img src="/fruitz.png" alt="Fruitz" class="w-4 h-4" />
		Fruitz
	</button>
	<button
		class={cn(
			'px-4 py-1.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer',
			appFilters.happn
				? 'bg-base-100 text-white shadow-sm'
				: 'bg-transparent text-muted-foreground hover:bg-base-200 hover:text-foreground'
		)}
		onclick={() => onToggleApp('happn', !appFilters.happn)}
	>
		<img src="/happn.png" alt="Happn" class="w-4 h-4" />
		Happn
	</button>
	<button
		class={cn(
			'px-4 py-1.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer',
			appFilters.feels
				? 'bg-base-100 text-white shadow-sm'
				: 'bg-transparent text-muted-foreground hover:bg-base-200 hover:text-foreground'
		)}
		onclick={() => onToggleApp('feels', !appFilters.feels)}
	>
		<img src="/feels.png" alt="Feels" class="w-4 h-4" />
		Feels
	</button>
</div>
