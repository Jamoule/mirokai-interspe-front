<script lang="ts">
	import { onMount } from 'svelte';
	import { visitor } from '$lib/visitor.svelte';
	import Character from '$lib/components/Character.svelte';
	import PlanBubble from '$lib/components/PlanBubble.svelte';
	import ModuleBackground from '$lib/components/ModuleBackground.svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import AgeSelectionOverlay from '$lib/components/AgeSelectionOverlay.svelte';
	import type { AgeGroup } from '$lib/visitor.svelte';

	let { data } = $props();
	let { module } = $derived(data);

	let overlayVisible = $state(false);
	let audioReady = $state(false);

	onMount(() => {
		visitor.init();
		if (!visitor.hasAge) {
			overlayVisible = true;
		} else {
			audioReady = true;
		}
	});

	function handleAgeSelect(group: AgeGroup) {
		visitor.setAge(group);
		overlayVisible = false;
		audioReady = true;
	}
</script>

<div class="relative h-dvh w-full overflow-hidden">
	{#key module.id}
		<ModuleBackground imageUrls={module.image_urls} />
	{/key}

	<Character />

	{#if audioReady && module.media_url}
		<AudioPlayer src={module.media_url} autoplay={true} />
	{/if}

	<PlanBubble />

	{#if overlayVisible}
		<AgeSelectionOverlay onselect={handleAgeSelect} />
	{/if}
</div>
