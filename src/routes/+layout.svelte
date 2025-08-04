<script>
	let { children } = $props();
	import '../app.css';
	import '@fontsource/saira-semi-condensed';
	import '@fontsource-variable/inter';
	import Sidebar from '$lib/components/global/sidebar.svelte';
</script>

<svelte:head>
	<title>Beast.</title>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

<div class="flex h-screen overflow-hidden">
	<!-- Menu latéral -->
	<div class="hidden md:flex"><Sidebar /></div>

	<!-- Zone de contenu principal -->
	<div class="flex-1 rounded-xl shadow p-3 overflow-y-auto">
		{@render children()}
	</div>
</div>
