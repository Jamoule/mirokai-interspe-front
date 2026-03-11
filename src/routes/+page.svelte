<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { visitor } from '$lib/visitor.svelte';
	import Character from '$lib/components/Character.svelte';
	import AgeSelectionOverlay from '$lib/components/AgeSelectionOverlay.svelte';
	import type { AgeGroup } from '$lib/visitor.svelte';

	let { data } = $props();
	let modules = $derived(data.modules ?? []);
	let settings = $derived(data.settings ?? null);

	let overlayVisible = $state(false);

	onMount(() => {
		visitor.init();
		overlayVisible = !visitor.hasAge;
	});

	function handleAgeSelect(group: AgeGroup) {
		visitor.setAge(group);
		overlayVisible = false;
	}
</script>

<div class="relative h-dvh w-full overflow-hidden">
	{#if settings?.plan_image_url}
		<div
			class="absolute inset-0 bg-cover bg-center bg-no-repeat"
			style="background-image: url('{settings.plan_image_url}')"
		></div>
		<div class="absolute inset-0 bg-[#0F0B24]/30"></div>
	{:else}
		<div class="absolute inset-0 bg-[var(--color-surface)]"></div>
	{/if}

	<Character />

	{#each modules.filter((m) => m.is_active) as mod (mod.id)}
		{@const done = visitor.hasCompleted(mod.id)}
		<button
			onclick={() => goto('/module/' + mod.qr_code)}
			class="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full font-bold shadow-lg transition-transform hover:scale-125 active:scale-95"
			style="
				left: {(mod.position_x / 1000) * 100}%;
				top: {(mod.position_y / 700) * 100}%;
				width: 40px;
				height: 40px;
				background: {done ? '#22c55e' : '#FFBD14'};
				color: {done ? 'white' : '#0F0B24'};
				border: 2.5px solid rgba(255,255,255,0.6);
				font-size: 14px;
			"
			title={mod.name}
		>
			{done ? '✓' : mod.number}
		</button>
	{/each}

	{#if overlayVisible}
		<AgeSelectionOverlay onselect={handleAgeSelect} />
	{/if}
</div>
