<script lang="ts">
	import {
		LayoutDashboard,
		Instagram,
		SquareChevronRight,
		Settings,
		Users,
		BarChart3,
		MessageSquare,
		Rocket
	} from '@lucide/svelte';
	import { page } from '$app/stores';

	// Configuration des éléments de navigation avec catégories
	const navCategories = [
		{
			category: 'DATING',
			items: [
				{
					label: 'Tableau de bord',
					href: '/',
					icon: LayoutDashboard
				},
				{
					label: 'Launchers',
					href: '/launchers',
					icon: Rocket
				},
				{
					label: 'Applications',
					href: '/applications',
					icon: SquareChevronRight
				},
				{
					label: 'Instagram',
					href: '/instagram',
					icon: Instagram
				}
			]
		}
	];

	function isActive(href: string) {
		return $page.url.pathname === href;
	}
</script>

<div class="px-4">
	<div class="py-2 text-white w-54">
		<!-- <div class="flex items-center w-full my-4 space-x-2">
			<img alt="Logo Beast" src="logo3.webp" class="w-9" />
			<h1 class="text-3xl font-bold tracking-wider logo">beast.</h1>
		</div> -->
	</div>

	{#each navCategories as category}
		<div class="pt-4 pb-2 text-xs text-neutral-content/80 font-medium first:pt-0">
			{category.category}
		</div>
		<nav class="flex flex-col space-y-1 font-medium text-[15px]">
			{#each category.items as item}
				<a
					href={item.href}
					class="flex space-x-2 items-center rounded-lg py-1.5 px-4 transition-colors duration-200
                       {isActive(item.href)
						? 'bg-[#2e2e2e] text-white'
						: 'text-[#afafaf] hover:bg-[#2e2e2e] hover:text-[#cfcfcf]'}"
				>
					<svelte:component this={item.icon} class="w-4.5" />
					<div>{item.label}</div>
				</a>
			{/each}
		</nav>
	{/each}
</div>
