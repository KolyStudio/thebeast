<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ListProxies from '$lib/components/instagram/listProxies.svelte';
	import { Shield } from '@lucide/svelte';

	let proxiesDialogOpen = $state(false);

	function openProxiesDialog() {
		proxiesDialogOpen = true;
	}

	function closeProxiesDialog() {
		proxiesDialogOpen = false;
	}
</script>

<svelte:head>
	<title>Test Proxies - Beast</title>
</svelte:head>

<div class="container mx-auto p-6">
	<div class="mb-6">
		<h1 class="text-2xl font-bold mb-2">Test de la gestion des proxies</h1>
		<p class="text-neutral-content">
			Cette page permet de tester le composant de gestion des proxies avec Supabase.
		</p>
	</div>

	<div class="flex gap-4">
		<Button onclick={openProxiesDialog} class="gap-2">
			<Shield class="h-4 w-4" />
			Ouvrir la gestion des proxies
		</Button>
	</div>

	<div class="mt-8 p-4 bg-base-200 rounded-lg">
		<h2 class="text-lg font-semibold mb-2">Instructions de test :</h2>
		<ul class="list-disc list-inside space-y-1 text-sm">
			<li>Cliquez sur "Ouvrir la gestion des proxies" pour voir la liste</li>
			<li>Testez l'ajout d'un nouveau proxy avec le bouton "Ajouter"</li>
			<li>Testez la modification d'un proxy existant</li>
			<li>Testez la suppression d'un proxy</li>
			<li>Vérifiez que les données sont bien synchronisées avec Supabase</li>
		</ul>
	</div>
</div>

<!-- Modal de gestion des proxies -->
<ListProxies bind:open={proxiesDialogOpen} onClose={closeProxiesDialog} />
