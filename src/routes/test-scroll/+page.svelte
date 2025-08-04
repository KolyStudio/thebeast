<script>
	// Page de test pour vérifier le défilement mobile
</script>

<svelte:head>
	<title>Test de défilement - Beast</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
	<div class="bg-base-100 rounded-2xl p-6">
		<h1 class="text-3xl font-bold mb-4">Test de défilement mobile</h1>
		<p class="text-base-content/70 mb-6">
			Cette page teste le comportement de défilement sur mobile après les corrections apportées au layout.
		</p>
		
		<div class="alert alert-info mb-6">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
			</svg>
			<span>Testez le défilement en faisant glisser votre doigt vers le haut et vers le bas sur mobile.</span>
		</div>
	</div>

	<!-- Contenu long pour tester le défilement -->
	{#each Array(20) as _, i}
		<div class="bg-base-100 rounded-2xl p-6">
			<h2 class="text-xl font-semibold mb-3">Section {i + 1}</h2>
			<p class="text-base-content/70 mb-4">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
				Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
			</p>
			<p class="text-base-content/70 mb-4">
				Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
				Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
			</p>
			<div class="flex flex-wrap gap-2">
				<div class="badge badge-primary">Tag {i + 1}</div>
				<div class="badge badge-secondary">Mobile</div>
				<div class="badge badge-accent">Scroll Test</div>
			</div>
		</div>
	{/each}

	<div class="bg-success/20 rounded-2xl p-6 text-center">
		<h2 class="text-2xl font-bold text-success mb-3">🎉 Fin de la page</h2>
		<p class="text-success/80">
			Si vous pouvez voir cette section, le défilement fonctionne correctement !
		</p>
		<button class="btn btn-success mt-4" onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
			Retour en haut
		</button>
	</div>
</div>
