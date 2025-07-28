<script lang="ts" module>
	import { cn, type WithoutChild } from '$lib/utils.js';
	import { type VariantProps, tv } from 'tailwind-variants';
	import { Accordion as AccordionPrimitive } from 'bits-ui';

	export const accordionTriggerVariants = tv({
		base: 'cursor-pointer focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md  text-left text-sm font-medium outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
		variants: {
			variant: {
				default: 'hover:underline py-1',
				statistiques: ''
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export type AccordionTriggerVariant = VariantProps<typeof accordionTriggerVariants>['variant'];

	export type AccordionTriggerProps = WithoutChild<AccordionPrimitive.TriggerProps> & {
		level?: AccordionPrimitive.HeaderProps['level'];
		variant?: AccordionTriggerVariant;
	};
</script>

<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	let {
		ref = $bindable(null),
		class: className,
		level = 3,
		variant = 'default',
		children,
		...restProps
	}: AccordionTriggerProps = $props();
</script>

<AccordionPrimitive.Header {level} class="flex">
	<AccordionPrimitive.Trigger
		data-slot="accordion-trigger"
		bind:ref
		class={cn(accordionTriggerVariants({ variant }), className)}
		{...restProps}
	>
		{@render children?.()}
		<!-- <ChevronDownIcon
			class="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200"
		/> -->
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
