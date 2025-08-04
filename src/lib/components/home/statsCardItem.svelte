<script lang="ts">
	let { title, value, max, color }: { title: string; value: number; max: number; color: string } =
		$props();

	// Calcul du pourcentage
	let percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));

	// Calcul de la circonférence du cercle (2πr avec r=40)
	const circumference = 2 * Math.PI * 40;

	// Calcul de l'offset pour le stroke-dasharray
	let strokeDashoffset = $derived(circumference * (1 - percentage / 100));

	// Calcul de l'opacité basée sur le pourcentage
	let opacity = $derived(0.1 + (0.9 * percentage) / 100);

	// Génération d'un ID unique pour le dégradé
	const gradientId = `progressGradient-${Math.random().toString(36).substring(2, 11)}`;
</script>

<div class="w-full p-4 bg-base-100 rounded-xl flex flex-col items-center gap-1">
	<!-- Progress bar circulaire avec dégradé d'opacité -->
	<div class="relative w-24 h-24">
		<svg class="w-full h-full" viewBox="0 0 100 100">
			<!-- Définition du dégradé -->
			<defs>
				<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="100%" style="stop-color: {color}; stop-opacity: 1" />
					<stop offset="100%" style="stop-color: {color}; stop-opacity: 1" />
				</linearGradient>
			</defs>

			<!-- Cercle de fond -->
			<circle stroke="#2c2b31" stroke-width="12" fill="transparent" r="40" cx="50" cy="50" />

			<!-- Cercle de progression avec dégradé -->
			<circle
				stroke="url(#{gradientId})"
				stroke-width="12"
				stroke-dasharray={circumference}
				stroke-dashoffset={strokeDashoffset}
				stroke-linecap="round"
				fill="transparent"
				r="40"
				cx="50"
				cy="50"
				transform="rotate(-90 50 50)"
				style="transition: stroke-dashoffset 0.3s ease-in-out;"
			/>
		</svg>

		<!-- Texte au centre -->
		<div class="absolute top-0 left-0 w-full h-full flex items-center justify-center">
			<span class="text-lg font-bold" style="color: {color}">{Math.round(percentage)}%</span>
		</div>
	</div>

	<div class="text-sm font-bold">
		{value.toFixed()}/{max}
	</div>
	<h3 class="text-xs font-bold text-neutral-content">{title}</h3>
</div>
