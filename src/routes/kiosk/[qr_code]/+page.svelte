<script lang="ts">
	import { onMount } from 'svelte';
	import { visitor } from '$lib/visitor.svelte';
	import Character from '$lib/components/Character.svelte';
	import ModuleBackground from '$lib/components/ModuleBackground.svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import AgeSelectionOverlay from '$lib/components/AgeSelectionOverlay.svelte';
	import QuizOverlay from '$lib/components/QuizOverlay.svelte';
	import { resolveMediaUrl } from '$lib/visitor-api';
	import type { AgeGroup } from '$lib/visitor.svelte';

	let { data } = $props();
	let { module } = $derived(data);

	type KioskPhase = 'age' | 'audio' | 'quiz' | 'complete';
	let phase = $state<KioskPhase>('age');
	let countdown = $state(5);
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

	function handleAgeSelect(group: AgeGroup) {
		visitor.setAge(group);
		phase = 'audio';
	}

	function handleAudioEnded() {
		if (module.has_quiz) {
			phase = 'quiz';
		} else {
			phase = 'complete';
			startCountdown();
		}
	}

	function handleQuizComplete() {
		phase = 'complete';
		startCountdown();
	}

	function startCountdown() {
		countdown = 5;
		countdownInterval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				reset();
			}
		}, 1000);
	}

	function reset() {
		if (countdownInterval) {
			clearInterval(countdownInterval);
			countdownInterval = null;
		}
		visitor.clearAge();
		phase = 'age';
	}

	onMount(() => {
		return () => {
			if (countdownInterval) clearInterval(countdownInterval);
		};
	});
</script>

<div class="relative h-dvh w-full overflow-hidden">
	{#key module.id}
		<ModuleBackground imageUrls={module.image_urls} />
	{/key}

	<Character />

	{#if phase === 'audio' && module.media_url && visitor.hasAge}
		<AudioPlayer src={resolveMediaUrl(module.media_url)} autoplay={true} onEnded={handleAudioEnded} />
	{/if}

	{#if phase === 'age'}
		<AgeSelectionOverlay onselect={handleAgeSelect} />
	{/if}

	{#if phase === 'quiz' && visitor.ageGroup}
		<QuizOverlay
			moduleId={module.id}
			ageGroup={visitor.ageGroup}
			onComplete={handleQuizComplete}
		/>
	{/if}

	{#if phase === 'complete'}
		<div
			class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 text-center"
			style="background: rgba(15,11,36,0.95);"
		>
			<div class="text-6xl">⭐</div>
			<h2
				class="text-3xl font-bold text-white"
				style="font-family: var(--font-title, 'AcuminVariableConcept', system-ui, sans-serif);"
			>
				Merci !
			</h2>
			<p class="text-white/60">Prochaine visite dans {countdown}s…</p>
			<button
				onclick={reset}
				class="mt-2 rounded-full bg-[#FFBD14] px-8 py-3 font-semibold text-[#0F0B24] transition-transform hover:scale-105 active:scale-95"
				style="font-family: var(--font-title, 'AcuminVariableConcept', system-ui, sans-serif);"
			>
				Recommencer
			</button>
		</div>
	{/if}
</div>
