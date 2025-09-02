<script lang="ts">
	import { CheckCircle, XCircle, Clock, Zap } from 'lucide-svelte';

	interface Props {
		open: boolean;
		result: {
			success: boolean;
			job_id?: string;
			total_accounts?: number;
			estimated_duration_minutes?: number;
			message?: string;
		} | null;
		onClose: () => void;
	}

	let { open = $bindable(), result, onClose }: Props = $props();

	function handleClose() {
		open = false;
		onClose();
	}

	function formatDuration(minutes: number): string {
		if (minutes < 60) {
			return `${minutes} minute${minutes > 1 ? 's' : ''}`;
		}
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
	}
</script>

{#if open && result}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
			<div class="flex items-center gap-3 mb-4">
				{#if result.success}
					<CheckCircle class="w-8 h-8 text-success" />
					<h3 class="text-lg font-semibold text-success">Warmup démarré avec succès</h3>
				{:else}
					<XCircle class="w-8 h-8 text-error" />
					<h3 class="text-lg font-semibold text-error">Erreur lors du warmup</h3>
				{/if}
			</div>

			<div class="space-y-3">
				{#if result.success}
					{#if result.job_id}
						<div class="flex items-center gap-2 text-sm">
							<Zap class="w-4 h-4 text-yellow-500" />
							<span class="text-neutral-content/80">Job ID:</span>
							<code class="bg-base-200 px-2 py-1 rounded text-xs font-mono">
								{result.job_id}
							</code>
						</div>
					{/if}

					{#if result.total_accounts}
						<div class="flex items-center gap-2 text-sm">
							<span class="text-neutral-content/80">Comptes sélectionnés:</span>
							<span class="font-semibold text-info">{result.total_accounts}</span>
						</div>
					{/if}

					{#if result.estimated_duration_minutes}
						<div class="flex items-center gap-2 text-sm">
							<Clock class="w-4 h-4 text-info" />
							<span class="text-neutral-content/80">Durée estimée:</span>
							<span class="font-semibold text-info">
								{formatDuration(result.estimated_duration_minutes)}
							</span>
						</div>
					{/if}

					<div class="bg-success/10 border border-success/20 rounded-lg p-3 mt-4">
						<p class="text-sm text-success/90">
							Le processus de warmup a été lancé en arrière-plan. Vous pouvez continuer à utiliser
							l'application pendant que les comptes sont traités.
						</p>
					</div>
				{:else}
					<div class="bg-error/10 border border-error/20 rounded-lg p-3">
						<p class="text-sm text-error/90">
							{result.message || 'Une erreur inconnue est survenue lors du démarrage du warmup.'}
						</p>
					</div>
				{/if}
			</div>

			<div class="flex justify-end mt-6">
				<button
					onclick={handleClose}
					class="px-4 py-2 rounded-lg font-medium transition-colors bg-white text-black cursor-pointer"
				>
					Fermer
				</button>
			</div>
		</div>
	</div>
{/if}
