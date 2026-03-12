<script lang="ts">
	import { onMount } from 'svelte';
	import { visitor } from '$lib/visitor.svelte';
	import AgeSelectionOverlay from '$lib/components/AgeSelectionOverlay.svelte';
	import PlanModal from '$lib/components/PlanModal.svelte';
	import type { AgeGroup } from '$lib/visitor.svelte';

	let { data } = $props();
	let settings = $derived(data.settings ?? null);

	let overlayVisible = $state(false);
	let showPlan = $state(false);

	onMount(() => {
		visitor.init();
		overlayVisible = !visitor.hasAge;
	});

	function handleAgeSelect(group: AgeGroup) {
		visitor.setAge(group);
		overlayVisible = false;
	}
</script>

<div
	class="relative flex h-dvh w-full flex-col items-center overflow-hidden"
	style="background: linear-gradient(245.55deg, var(--color-primary) 12.65%, #a03379 104.49%)"
>
	<!-- Background landscape -->
	<img
		src="/images/background-landscape.png"
		alt=""
		class="pointer-events-none absolute inset-0 h-full w-full object-cover"
		draggable="false"
	/>

	<!-- Header bar -->
	<header
		class="relative z-10 mx-6 mt-14 flex w-[calc(100%-3rem)] max-w-[342px] items-center justify-between rounded-full px-4 py-2"
		style="background: rgba(180, 180, 180, 0.43); box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);"
	>
		<span class="font-body text-xl leading-[30px] font-bold text-purple">
			Prologue
		</span>
		<button
			onclick={() => (showPlan = true)}
			class="flex size-[52px] items-center justify-center rounded-lg border border-[#dad1d6] bg-purple"
			aria-label="Ouvrir le plan"
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path opacity="0.2" d="M15 6.75V20.25L9 17.25V3.75L15 6.75Z" fill="white"/>
				<path d="M21.4612 4.65844C21.3714 4.58843 21.2668 4.53981 21.1554 4.51626C21.0439 4.4927 20.9286 4.49484 20.8181 4.5225L15.0872 5.955L9.33563 3.07875C9.17537 2.99882 8.99181 2.97887 8.81812 3.0225L2.81812 4.5225C2.65587 4.56306 2.51183 4.65668 2.40889 4.7885C2.30595 4.92031 2.25003 5.08275 2.25 5.25V18.75C2.25002 18.864 2.27601 18.9764 2.32599 19.0788C2.37598 19.1813 2.44864 19.2709 2.53847 19.3411C2.62831 19.4112 2.73294 19.4599 2.84442 19.4836C2.95591 19.5072 3.07131 19.5051 3.18187 19.4775L8.91281 18.045L14.6644 20.9213C14.7688 20.9727 14.8836 20.9997 15 21C15.0613 21 15.1224 20.9924 15.1819 20.9775L21.1819 19.4775C21.3441 19.4369 21.4882 19.3433 21.5911 19.2115C21.694 19.0797 21.75 18.9172 21.75 18.75V5.25C21.75 5.13593 21.724 5.02336 21.674 4.92085C21.624 4.81834 21.5512 4.72859 21.4612 4.65844ZM9.75 4.96312L14.25 7.21312V19.0369L9.75 16.7869V4.96312ZM3.75 5.83594L8.25 4.71094V16.6641L3.75 17.7891V5.83594ZM20.25 18.1641L15.75 19.2891V7.33594L20.25 6.21094V18.1641Z" fill="white"/>
			</svg>
		</button>
	</header>

	<!-- Central content: character + speech bubble -->
	<div class="relative z-10 flex flex-1 flex-col items-center justify-center gap-6">
		<img
			src="/images/miroki-character.png"
			alt="Miroki"
			class="pointer-events-none h-[353px] w-[182px] object-contain"
			draggable="false"
		/>

		<div class="rounded-[21px] p-4" style="background: rgba(17, 35, 97, 0.8);">
			<p class="font-body w-[320px] text-xl leading-[30px] text-white">
				Bien le bonjour à toi voyageur, je m'appelle Miroki.
			</p>
		</div>
	</div>

	{#if overlayVisible}
		<AgeSelectionOverlay onselect={handleAgeSelect} />
	{/if}

	{#if showPlan}
		<PlanModal completedIds={visitor.completedModules} onClose={() => (showPlan = false)} />
	{/if}
</div>
