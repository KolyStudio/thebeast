<script lang="ts">
	import {
		LayoutDashboard,
		Instagram,
		SquareChevronRight,
		Settings,
		Users,
		BarChart3,
		MessageSquare,
		TestTube
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
					label: 'Applications',
					href: '/applications',
					icon: SquareChevronRight
				},
				{
					label: 'Instagram',
					href: '/instagram',
					icon: Instagram
				},
				{
					label: 'Test Scroll',
					href: '/test-scroll',
					icon: TestTube
				}
			]
		}
	];

	function isActive(href: string) {
		return $page.url.pathname === href;
	}
</script>

<div class="px-4 bg-[#1c1b1f]">
	<div class="py-2 text-white w-54">
		<div class="flex items-center w-full my-4 space-x-2">
			<img alt="Logo Beast" src="logo3.webp" class="w-9" />
			<h1 class="text-3xl font-bold tracking-wider logo">beast.</h1>
		</div>
	</div>

	{#each navCategories as category}
		<div class="pt-4 pb-2 text-xs text-neutral-content font-medium first:pt-0">
			{category.category}
		</div>
		<nav class="flex flex-col space-y-1 font-medium text-[15px]">
			{#each category.items as item}
				<a
					href={item.href}
					class="flex space-x-2 items-center rounded-lg py-1.5 px-4 transition-colors duration-200
                       {isActive(item.href)
						? 'bg-[#252329] text-white'
						: 'text-neutral-content hover:bg-[#202020] hover:text-white'}"
				>
					<svelte:component this={item.icon} class="w-4.5" />
					<div>{item.label}</div>
				</a>
			{/each}
		</nav>
	{/each}
</div>
