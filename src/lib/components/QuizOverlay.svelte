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

<div class="fixed inset-0 z-50 flex flex-col" style="background: rgba(15,11,36,0.97);">
	{#if loading}
		<div class="flex flex-1 items-center justify-center">
			<div class="w-10 h-10 rounded-full border-4 border-[#3995FF] border-t-transparent animate-spin"></div>
		</div>
	{:else if currentQuestion}
		<!-- Personnage -->
		<div class="flex justify-center pt-6 flex-shrink-0">
			<svg viewBox="0 0 220 320" style="height: 150px; width: auto;" aria-hidden="true">
				<defs>
					<linearGradient id="qbodyGrad2" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stop-color="#1D3AA2" />
						<stop offset="100%" stop-color="#3995FF" />
					</linearGradient>
					<filter id="qglow2">
						<feGaussianBlur stdDeviation="8" result="blur" />
						<feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
					</filter>
				</defs>
				<ellipse cx="110" cy="290" rx="70" ry="18" fill="#3995FF" opacity="0.3" filter="url(#qglow2)" />
				<ellipse cx="110" cy="230" rx="65" ry="80" fill="url(#qbodyGrad2)" filter="url(#qglow2)" />
				<circle cx="110" cy="100" r="55" fill="url(#qbodyGrad2)" filter="url(#qglow2)" />
				<rect x="92" y="148" width="36" height="30" rx="10" fill="url(#qbodyGrad2)" />
			</svg>
		</div>

		<!-- Progression + question -->
		<div class="flex-shrink-0 px-6 pt-2 pb-4 text-center">
			<span class="text-white/40 text-xs">{currentIdx + 1} / {questions.length}</span>
			<h2
				class="mt-1 text-base font-semibold text-white leading-snug"
				style="font-family: var(--font-title, 'AcuminVariableConcept', system-ui, sans-serif);"
			>
				{currentQuestion.question_text}
			</h2>
		</div>

		<!-- Récompense (mot secret) -->
		{#if showSecret && secretWord}
			<div class="flex-shrink-0 flex justify-center px-6 pb-3">
				<div
					class="rounded-xl px-8 py-3 text-center shadow-lg"
					style="background: #FFBD14; color: #0F0B24; font-family: var(--font-title, 'AcuminVariableConcept', system-ui, sans-serif);"
				>
					<div class="text-xs font-semibold opacity-60 uppercase tracking-widest">Mot secret</div>
					<div class="text-2xl font-bold tracking-widest mt-0.5">{secretWord}</div>
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
					class="rounded-2xl border p-4 text-sm text-center text-white transition-all duration-200 disabled:cursor-default flex items-center justify-center min-h-20"
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
						<div class="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"></div>
					{:else}
						{answer.answer_text}
					{/if}
				</button>
			{/each}
		</div>

		<!-- Mots collectés -->
		{#if collectedWords.length > 0}
			<div class="flex-shrink-0 flex justify-center gap-2 px-4 pb-4 flex-wrap">
				{#each collectedWords as word}
					<span
						class="rounded-full px-3 py-1 text-xs font-bold tracking-widest"
						style="background: #FFBD14; color: #0F0B24;"
					>
						{word}
					</span>
				{/each}
			</div>
		{/if}
	{/if}
</div>
