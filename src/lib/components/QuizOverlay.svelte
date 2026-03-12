<script lang="ts">
	import { onMount } from 'svelte';
	import { visitorApi } from '$lib/visitor-api';
	import type { Question } from '$lib/api';
	import type { AgeGroup } from '$lib/visitor.svelte';

	let {
		moduleId,
		ageGroup,
		onComplete
	}: {
		moduleId: string;
		ageGroup: AgeGroup;
		onComplete: () => void;
	} = $props();

	let questions = $state<Question[]>([]);
	let loading = $state(true);
	let currentIdx = $state(0);
	// selected answer id while waiting for backend response
	let selected = $state<string | null>(null);
	let validating = $state(false);
	// result from backend: null = pending, true/false = result
	let lastCorrect = $state<boolean | null>(null);
	let secretWord = $state<string | null>(null);
	let showSecret = $state(false);
	// collected secret words across all questions this session
	let collectedWords = $state<string[]>([]);

	let currentQuestion = $derived(questions[currentIdx]);

	onMount(async () => {
		try {
			questions = await visitorApi.getQuestions(moduleId, ageGroup);
		} catch {
			questions = [];
		}
		loading = false;
		if (questions.length === 0) onComplete();
	});

	async function selectAnswer(answerId: string) {
		if (selected !== null || validating) return;
		selected = answerId;
		validating = true;

		try {
			const result = await visitorApi.validateAnswer(currentQuestion.id, answerId);
			lastCorrect = result.correct;

			if (result.correct && result.secret_word) {
				secretWord = result.secret_word;
				collectedWords = [...collectedWords, result.secret_word];
				showSecret = true;
				setTimeout(() => {
					showSecret = false;
					advance();
				}, 2500);
			} else {
				setTimeout(() => advance(), 1500);
			}
		} catch {
			// fallback: use local is_correct if backend unreachable
			const answer = currentQuestion.answers.find((a) => a.id === answerId);
			lastCorrect = !!answer?.is_correct;
			setTimeout(() => advance(), 1500);
		} finally {
			validating = false;
		}
	}

	function advance() {
		selected = null;
		lastCorrect = null;
		secretWord = null;
		if (currentIdx + 1 < questions.length) {
			currentIdx++;
		} else {
			onComplete();
		}
	}
</script>

{#if loading}
	<div class="flex flex-1 items-center justify-center">
		<div class="h-10 w-10 animate-spin rounded-full border-4 border-[#3995FF] border-t-transparent"></div>
	</div>
{:else if currentQuestion}
	<!-- Progression + question -->
	<div class="flex-shrink-0 px-6 pt-4 pb-4 text-center">
		<span class="text-xs text-white/40">{currentIdx + 1} / {questions.length}</span>
		<h2 class="font-title mt-1 text-xl font-semibold leading-snug text-white">
			{currentQuestion.question_text}
		</h2>
	</div>

	<!-- Récompense (mot secret) -->
	{#if showSecret && secretWord}
		<div class="flex-shrink-0 flex justify-center px-6 pb-3">
			<div
				class="rounded-xl px-8 py-3 text-center shadow-lg"
				style="background: #FFBD14; color: #0F0B24;"
			>
				<div class="font-body text-xs font-semibold uppercase tracking-widest opacity-60">Mot secret</div>
				<div class="font-title mt-0.5 text-2xl font-bold tracking-widest">{secretWord}</div>
			</div>
		</div>
	{/if}

	<!-- Réponses 2×2 -->
	<div class="flex-1 grid grid-cols-2 gap-3 px-4 pb-6 content-start">
		{#each [...currentQuestion.answers].sort((a, b) => a.display_order - b.display_order) as answer}
			{@const isSelected = selected === answer.id}
			{@const answerCorrect = answer.is_correct === 1}
			{@const showResult = selected !== null && lastCorrect !== null}
			<button
				onclick={() => selectAnswer(answer.id)}
				disabled={selected !== null}
				class="font-body flex min-h-20 items-center justify-center rounded-2xl border p-4 text-sm text-center text-white transition-all duration-200 disabled:cursor-default"
				style="
					background: {isSelected && answerCorrect
						? 'rgba(34,197,94,0.2)'
						: isSelected && !answerCorrect
							? 'rgba(239,68,68,0.2)'
							: showResult && answerCorrect
								? 'rgba(34,197,94,0.1)'
								: '#1a1540'};
					border-color: {isSelected && answerCorrect
						? '#22c55e'
						: isSelected && !answerCorrect
							? '#ef4444'
							: showResult && answerCorrect
								? '#22c55e88'
								: '#3995ff44'};
				"
			>
				{#if validating && isSelected}
					<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></div>
				{:else}
					{answer.answer_text}
				{/if}
			</button>
		{/each}
	</div>

	<!-- Mots collectés -->
	{#if collectedWords.length > 0}
		<div class="flex-shrink-0 flex flex-wrap justify-center gap-2 px-4 pb-4">
			{#each collectedWords as word}
				<span
					class="font-body rounded-full px-3 py-1 text-xs font-bold tracking-widest"
					style="background: #FFBD14; color: #0F0B24;"
				>
					{word}
				</span>
			{/each}
		</div>
	{/if}
{/if}
