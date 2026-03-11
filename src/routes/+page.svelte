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

	{#each modules.filter((m) => m.is_active) as mod}
		<button
			onclick={() => goto('/module/' + mod.qr_code)}
			class="absolute flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 -translate-x-1/2 -translate-y-1/2"
			style="left: {mod.position_x}%; top: {mod.position_y}%; background: {visitor.hasCompleted(mod.id) ? '#22c55e' : '#3995FF'};"
			title={mod.name}
		>
			{#if visitor.hasCompleted(mod.id)}
				<span class="text-white text-sm font-bold">✓</span>
			{:else}
				<span class="text-white text-sm font-bold">{mod.number}</span>
			{/if}
		</button>
	{/each}

	{#if overlayVisible}
		<AgeSelectionOverlay onselect={handleAgeSelect} />
	{/if}
</div>
