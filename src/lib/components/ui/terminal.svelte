<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Terminal, X, Square, RotateCcw } from 'lucide-svelte';

	interface TerminalLog {
		id: string;
		timestamp: Date;
		type: 'info' | 'success' | 'error' | 'warning' | 'request' | 'response';
		message: string;
		data?: any;
	}

	interface Props {
		open: boolean;
		title?: string;
		onClose: () => void;
		onStop?: () => void;
		onRefresh?: () => void;
		isOperationRunning?: boolean;
	}

	let {
		open = $bindable(),
		title = 'Terminal',
		onClose,
		onStop,
		onRefresh,
		isOperationRunning = false
	}: Props = $props();

	// État du terminal
	let logs = $state<TerminalLog[]>([]);
	let terminalContainer: HTMLDivElement;
	let autoScroll = $state(true);

	// États du filtrage
	type LogFilter = 'all' | 'info' | 'warning' | 'error' | 'success';
	let currentFilter = $state<LogFilter>('all');

	// Logs filtrés basés sur le filtre actuel
	let filteredLogs = $derived(() => {
		if (currentFilter === 'all') {
			return logs;
		}
		return logs.filter((log) => log.type === currentFilter);
	});

	// Compteurs pour chaque type de log
	let logCounts = $derived(() => {
		const counts = {
			all: logs.length,
			info: 0,
			warning: 0,
			error: 0,
			success: 0
		};

		logs.forEach((log) => {
			// Seulement compter les types de logs que nous filtrons
			if (
				log.type === 'info' ||
				log.type === 'warning' ||
				log.type === 'error' ||
				log.type === 'success'
			) {
				counts[log.type]++;
			}
		});

		return counts;
	});

	// Fonction pour changer le filtre
	function setFilter(filter: LogFilter) {
		currentFilter = filter;
	}

	// Fonction pour ajouter un log
	export function addLog(type: TerminalLog['type'], message: string, data?: any) {
		const newLog: TerminalLog = {
			id: crypto.randomUUID(),
			timestamp: new Date(),
			type,
			message,
			data
		};

		logs = [...logs, newLog];

		// Auto-scroll vers le bas
		if (autoScroll && terminalContainer) {
			setTimeout(() => {
				terminalContainer.scrollTop = terminalContainer.scrollHeight;
			}, 10);
		}
	}

	// Fonction pour vider tous les logs
	export function clearLogs() {
		logs = [];
		currentFilter = 'all'; // Réinitialiser le filtre
	}

	// Fonction pour formater le timestamp
	function formatTimestamp(date: Date): string {
		return date.toLocaleTimeString('fr-FR', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	// Fonction pour formater les données JSON
	function formatJSON(data: any): string {
		if (!data) return '';
		try {
			return JSON.stringify(data, null, 2);
		} catch {
			return String(data);
		}
	}

	// Fonction pour obtenir la couleur selon le type de log
	function getLogColor(type: TerminalLog['type']): string {
		switch (type) {
			case 'info':
				return 'text-bleu-400';
			case 'success':
				return 'text-vert-400';
			case 'error':
				return 'text-rouge-400';
			case 'warning':
				return 'text-jaune-400';
			case 'request':
				return 'text-violet-400';
			case 'response':
				return 'text-bleu-400';
			default:
				return 'text-gray-300';
		}
	}

	// Fonction pour obtenir le préfixe selon le type
	function getLogPrefix(type: TerminalLog['type']): string {
		switch (type) {
			case 'info':
				return '[INFO]';
			case 'success':
				return '[SUCCESS]';
			case 'error':
				return '[ERROR]';
			case 'warning':
				return '[WARN]';
			case 'request':
				return '[REQ]';
			case 'response':
				return '[RES]';
			default:
				return '[LOG]';
		}
	}

	// Auto-scroll quand de nouveaux logs arrivent ou quand le filtre change
	$effect(() => {
		if (filteredLogs().length > 0 && autoScroll && terminalContainer) {
			setTimeout(() => {
				terminalContainer.scrollTop = terminalContainer.scrollHeight;
			}, 10);
		}
	});

	function handleStop() {
		if (onStop) {
			addLog('warning', 'Operation stop requested by user');
			onStop();
		}
	}

	function handleRefresh() {
		if (onRefresh) {
			addLog('info', 'Refreshing logs...');
			onRefresh();
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="min-w-[40%] max-h-[85vh] p-0 flex flex-col overflow-hidden">
		<!-- Header du terminal -->
		<Dialog.Header class="flex-shrink-0 border-b border-base-200 bg-base-300 p-3">
			<div class="flex items-center justify-between w-full">
				<div class="flex items-center gap-2">
					<Terminal class="h-5 w-5 text-vert-300" />
					<span class="text-white font-medium">{title}</span>
					{#if isOperationRunning}
						<div class="flex items-center gap-1 text-vert-400 text-sm">
							<div class="w-2 h-2 bg-vert-400 rounded-full animate-pulse"></div>
							Running
						</div>
					{/if}
				</div>

				<div class="flex items-center gap-2">
					<!-- Bouton Refresh -->
					{#if onRefresh}
						<Button
							variant="outline"
							size="sm"
							onclick={handleRefresh}
							class="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
						>
							<RotateCcw class="h-4 w-4" />
						</Button>
					{/if}

					<!-- Bouton Stop -->
					{#if onStop}
						<Button size="sm" onclick={handleStop} class="h-8 px-3 bg-error/20 text-error/90   ">
							<Square class="h-4 w-4" />
						</Button>
					{/if}
				</div>
			</div>

			<!-- Filtres de logs -->
			<div class="flex items-center gap-2 mt-3 pt-3 border-t border-base-200">
				<span class="text-gray-400 text-sm font-medium">Filtres:</span>
				<div class="flex items-center gap-1">
					<!-- Filtre Tous -->
					<button
						onclick={() => setFilter('all')}
						class="px-2 py-1 text-xs rounded transition-colors {currentFilter === 'all'
							? 'bg-bleu-500 text-white'
							: 'bg-base-200 text-gray-300 hover:bg-base-100'}"
					>
						Tous
						<span class="ml-1 px-1 py-0.5 bg-black/20 rounded text-xs">{logCounts().all}</span>
					</button>

					<!-- Filtre Info -->
					<button
						onclick={() => setFilter('info')}
						class="px-2 py-1 text-xs rounded transition-colors {currentFilter === 'info'
							? 'bg-bleu-500 text-white'
							: 'bg-base-200 text-gray-300 hover:bg-base-100'}"
					>
						Info
						<span class="ml-1 px-1 py-0.5 bg-black/20 rounded text-xs">{logCounts().info}</span>
					</button>

					<!-- Filtre Warning -->
					<button
						onclick={() => setFilter('warning')}
						class="px-2 py-1 text-xs rounded transition-colors {currentFilter === 'warning'
							? 'bg-jaune-400 text-white'
							: 'bg-base-200 text-gray-300 hover:bg-base-100'}"
					>
						Warning
						<span class="ml-1 px-1 py-0.5 bg-black/20 rounded text-xs">{logCounts().warning}</span>
					</button>

					<!-- Filtre Error -->
					<button
						onclick={() => setFilter('error')}
						class="px-2 py-1 text-xs rounded transition-colors {currentFilter === 'error'
							? 'bg-rouge-400 text-white'
							: 'bg-base-200 text-gray-300 hover:bg-base-100'}"
					>
						Error
						<span class="ml-1 px-1 py-0.5 bg-black/20 rounded text-xs">{logCounts().error}</span>
					</button>

					<!-- Filtre Success -->
					<button
						onclick={() => setFilter('success')}
						class="px-2 py-1 text-xs rounded transition-colors {currentFilter === 'success'
							? 'bg-vert-400 text-white'
							: 'bg-base-200 text-gray-300 hover:bg-base-100'}"
					>
						Success
						<span class="ml-1 px-1 py-0.5 bg-black/20 rounded text-xs">{logCounts().success}</span>
					</button>
				</div>
			</div>
		</Dialog.Header>

		<!-- Contenu du terminal -->
		<div
			bind:this={terminalContainer}
			class="flex-1 overflow-y-auto p-4 font-mono text-sm text-gray-300 scrollbar-hidden"
		>
			{#if logs.length === 0}
				<div class="text-gray-500 italic">Terminal prêt. Attente de logs...</div>
			{:else if filteredLogs().length === 0}
				<div class="text-gray-500 italic">Aucun log correspondant au filtre "{currentFilter}".</div>
			{:else}
				{#each filteredLogs() as log (log.id)}
					<div class="mb-2 leading-relaxed">
						<span class="text-gray-500 text-xs">[{formatTimestamp(log.timestamp)}]</span>
						<span class="{getLogColor(log.type)} font-semibold ml-2">{getLogPrefix(log.type)}</span>
						<span class="ml-2">{log.message}</span>

						{#if log.data}
							<pre
								class="mt-1 ml-8 text-xs bg-base-300 p-2 rounded border-l-2 border-base-200 overflow-x-auto"><code
									>{formatJSON(log.data)}</code
								></pre>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<!-- Footer avec informations -->
		<Dialog.Footer class="flex-shrink-0 border-t border-base-200 bg-base-300 p-2">
			<div class="flex justify-end items-center text-xs text-gray-400 w-full">
				<span>
					{#if currentFilter === 'all'}
						Total: {logs.length} log(s)
					{:else}
						Filtre "{currentFilter}": {filteredLogs().length} / {logs.length} log(s)
					{/if}
				</span>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	.scrollbar-hidden {
		/* Firefox */
		scrollbar-width: none;
	}

	/* Webkit browsers */
	.scrollbar-hidden::-webkit-scrollbar {
		display: none;
	}
</style>
