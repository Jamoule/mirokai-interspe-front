<script lang="ts">
	import type { AgeGroup } from '$lib/visitor.svelte';

	let { onselect }: { onselect: (group: AgeGroup) => void } = $props();

	const options: { emoji: string; label: string; sublabel: string; group: AgeGroup }[] = [
		{ emoji: '🧒', label: 'Enfant', sublabel: '5 à 10 ans', group: '5-7' },
		{ emoji: '🧑', label: 'Ado', sublabel: '11 à 13 ans', group: '11-13' },
		{ emoji: '🧑‍💼', label: 'Adulte', sublabel: '14 ans et +', group: '14+' }
	];
</script>

<div
	class="fixed inset-0 z-40 flex items-center justify-center"
	style="background: rgba(15,11,36,0.92); backdrop-filter: blur(8px);"
>
	<div class="flex flex-col items-center gap-6 px-6 text-center">
		<h1
			class="text-3xl font-bold tracking-wide mb-4"
			style="font-family: var(--font-title, 'AcuminVariableConcept', system-ui, sans-serif);"
		>
			Qui es-tu ?
		</h1>

		<div class="flex flex-col gap-4 md:flex-row md:gap-6">
			{#each options as opt}
				<button
					onclick={() => onselect(opt.group)}
					class="flex flex-col items-center gap-3 rounded-2xl border px-8 py-6 transition-all duration-200 hover:scale-105"
					style="
						background: #1a1540;
						border-color: #3995ff44;
					"
					onmouseenter={(e) => {
						(e.currentTarget as HTMLButtonElement).style.borderColor = '#3995FF';
					}}
					onmouseleave={(e) => {
						(e.currentTarget as HTMLButtonElement).style.borderColor = '#3995ff44';
					}}
				>
					<span class="text-5xl">{opt.emoji}</span>
					<span
						class="text-xl font-semibold"
						style="font-family: var(--font-title, 'AcuminVariableConcept', system-ui, sans-serif);"
					>
						{opt.label}
					</span>
					<span class="text-sm text-white/60">{opt.sublabel}</span>
				</button>
			{/each}
		</div>
	</div>
</div>
