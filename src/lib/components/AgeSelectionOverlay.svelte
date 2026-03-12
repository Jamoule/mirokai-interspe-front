<script lang="ts">
	import type { AgeGroup } from '$lib/visitor.svelte';

	let { onselect }: { onselect: (group: AgeGroup) => void } = $props();

	const options: { label: string; group: AgeGroup }[] = [
		{ label: '3–4 ans', group: '3-4' },
		{ label: '5–7 ans', group: '5-7' },
		{ label: '8–10 ans', group: '8-10' },
		{ label: 'Autre', group: '14+' }
	];

	let selected = $state<AgeGroup | null>(null);

	function handleContinue() {
		if (selected) onselect(selected);
	}
</script>

<div
	class="fixed inset-0 z-40 flex flex-col items-center justify-between px-6 py-6"
	style="background: linear-gradient(245.55deg, var(--color-primary) 12.65%, #a03379 104.49%)"
>
	<!-- Logo -->
	<div class="mt-8 flex flex-col items-center">
		<div class="flex h-[69px] w-[168px] flex-col items-center justify-between">
			<img
				src="/images/logo-icon.svg"
				alt=""
				class="h-[30px] w-[26px]"
				draggable="false"
			/>
			<img
				src="/images/logo-text.svg"
				alt="Enchanted Tools"
				class="h-[33px] w-[113px]"
				draggable="false"
			/>
		</div>
	</div>

	<!-- Title & description -->
	<div class="flex w-full flex-1 flex-col justify-center gap-6">
		<h1 class="font-title text-[64px] leading-[60px] font-semibold uppercase text-white">
			Pour qui commence l'aventure ?
		</h1>
		<p class="font-body text-xl leading-[30px] text-white">
			Cela permettra à Mirokai d'adapter l'expérience.
		</p>
	</div>

	<!-- Selection options + button -->
	<div class="flex w-full max-w-[342px] flex-1 flex-col items-center gap-6">
		{#each options as opt}
			<button
				onclick={() => (selected = opt.group)}
				class="font-body flex h-[53px] w-full items-center gap-4 rounded-full border px-8 py-4 text-lg text-white transition-colors"
				class:border-white={selected === opt.group}
				class:border-[#dad1d6]={selected !== opt.group}
			>
				<!-- Checkbox -->
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect
						x="3.5" y="3.5" width="17" height="17" rx="3.5"
						stroke={selected === opt.group ? 'white' : '#dad1d6'}
					/>
					{#if selected === opt.group}
						<path d="M8 12.5L10.5 15L16 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
					{/if}
				</svg>
				{opt.label}
			</button>
		{/each}

		<button
			onclick={handleContinue}
			disabled={!selected}
			class="font-body h-[53px] w-full rounded-full border border-[#dad1d6] bg-purple text-lg text-white transition-opacity disabled:opacity-40"
		>
			Continuer
		</button>
	</div>
</div>
