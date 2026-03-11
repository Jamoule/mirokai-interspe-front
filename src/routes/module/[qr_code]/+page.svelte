<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { visitor } from '$lib/visitor.svelte';
	import Character from '$lib/components/Character.svelte';
	import PlanBubble from '$lib/components/PlanBubble.svelte';
	import ModuleBackground from '$lib/components/ModuleBackground.svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import AgeSelectionOverlay from '$lib/components/AgeSelectionOverlay.svelte';
	import QuizOverlay from '$lib/components/QuizOverlay.svelte';
	import PlanModal from '$lib/components/PlanModal.svelte';
	import type { AgeGroup } from '$lib/visitor.svelte';

	let { data } = $props();
	let { module } = $derived(data);

	type VisitorPhase = 'audio' | 'quiz' | 'complete';
	let visitorPhase = $state<VisitorPhase>('audio');
	let overlayVisible = $state(false);
	let audioReady = $state(false);
	let showPlan = $state(false);

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

	function handleAudioEnded() {
		visitorPhase = module.has_quiz ? 'quiz' : 'complete';
		if (visitorPhase === 'complete') {
			visitor.markComplete(module.id);
		}
	}

	function handleQuizComplete() {
		visitor.markComplete(module.id);
		visitorPhase = 'complete';
	}

	function replay() {
		visitorPhase = 'audio';
	}
</script>

<div class="relative h-dvh w-full overflow-hidden">
	{#key module.id}
		<ModuleBackground imageUrls={module.image_urls} />
	{/key}

	<Character />

	{#if audioReady && module.media_url && visitorPhase === 'audio'}
		<AudioPlayer src={module.media_url} autoplay={true} onEnded={handleAudioEnded} />
	{/if}

	<PlanBubble onclick={() => (showPlan = true)} />

	{#if overlayVisible}
		<AgeSelectionOverlay onselect={handleAgeSelect} />
	{/if}

	{#if visitorPhase === 'quiz' && visitor.ageGroup}
		<QuizOverlay moduleId={module.id} ageGroup={visitor.ageGroup} onComplete={handleQuizComplete} />
	{/if}

	{#if visitorPhase === 'complete'}
		<div
			class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 text-center"
			style="background: rgba(15,11,36,0.95);"
		>
			<div class="text-6xl">🎉</div>
			<h2
				class="text-3xl font-bold text-white"
				style="font-family: var(--font-title, 'AcuminVariableConcept', system-ui, sans-serif);"
			>
				Module terminé !
			</h2>
			<p class="text-white/70">{module.name}</p>
			<div class="flex flex-col gap-3 mt-2 w-full max-w-xs">
				<button
					onclick={() => goto('/')}
					class="rounded-full bg-[#FFBD14] px-8 py-3 font-semibold text-[#0F0B24] transition-transform hover:scale-105 active:scale-95"
					style="font-family: var(--font-title, 'AcuminVariableConcept', system-ui, sans-serif);"
				>
					Retour au plan
				</button>
				<button
					onclick={replay}
					class="rounded-full border border-white/30 px-8 py-3 text-white transition-transform hover:scale-105 active:scale-95"
				>
					Rejouer
				</button>
			</div>
		</div>
	{/if}

	{#if showPlan}
		<PlanModal completedIds={visitor.completedModules} onClose={() => (showPlan = false)} />
	{/if}
</div>
