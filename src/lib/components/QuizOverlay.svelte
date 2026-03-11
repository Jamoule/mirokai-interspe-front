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
	let selected = $state<string | null>(null);
	let showSecret = $state(false);

	let currentQuestion = $derived(questions[currentIdx]);

	onMount(async () => {
		try {
			questions = await visitorApi.getQuestions(moduleId, ageGroup);
		} catch {
			questions = [];
		}
		loading = false;
		if (questions.length === 0) {
			onComplete();
		}
	});

	function selectAnswer(answerId: string, correct: boolean) {
		if (selected !== null) return;
		selected = answerId;
		if (correct && currentQuestion?.secret_word) {
			showSecret = true;
			setTimeout(() => {
				showSecret = false;
				advance();
			}, 2000);
		} else {
			setTimeout(() => {
				advance();
			}, 1500);
		}
	}

	function advance() {
		selected = null;
		if (currentIdx + 1 < questions.length) {
			currentIdx++;
		} else {
			onComplete();
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex flex-col"
	style="background: rgba(15,11,36,0.97);"
>
	{#if loading}
		<div class="flex flex-1 items-center justify-center">
			<div class="w-10 h-10 rounded-full border-4 border-[#3995FF] border-t-transparent animate-spin"></div>
		</div>
	{:else if currentQuestion}
		<!-- Personnage en haut -->
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

		<!-- Question -->
		<div class="flex-shrink-0 px-6 pt-2 pb-4 text-center">
			<span class="text-white/40 text-xs">{currentIdx + 1} / {questions.length}</span>
			<h2
				class="mt-1 text-base font-semibold text-white leading-snug"
				style="font-family: var(--font-title, 'AcuminVariableConcept', system-ui, sans-serif);"
			>
				{currentQuestion.question_text}
			</h2>
		</div>

		<!-- Mot secret -->
		{#if showSecret && currentQuestion.secret_word}
			<div class="flex-shrink-0 flex justify-center px-6 pb-3">
				<div
					class="rounded-xl px-6 py-2 text-center"
					style="background: #FFBD14; color: #0F0B24; font-family: var(--font-title, 'AcuminVariableConcept', system-ui, sans-serif);"
				>
					<div class="text-xs font-semibold opacity-70">Mot secret</div>
					<div class="text-xl font-bold">{currentQuestion.secret_word}</div>
				</div>
			</div>
		{/if}

		<!-- Réponses 2×2 -->
		<div class="flex-1 grid grid-cols-2 gap-3 px-4 pb-6 content-start">
			{#each [...currentQuestion.answers].sort((a, b) => a.display_order - b.display_order) as answer}
				{@const isSelected = selected === answer.id}
				{@const answerCorrect = answer.is_correct === 1}
				<button
					onclick={() => selectAnswer(answer.id, answerCorrect)}
					disabled={selected !== null}
					class="rounded-2xl border p-4 text-sm text-center text-white transition-all duration-200 disabled:cursor-default flex items-center justify-center min-h-20"
					style="
						background: {isSelected && answerCorrect
							? 'rgba(34,197,94,0.2)'
							: isSelected && !answerCorrect
								? 'rgba(239,68,68,0.2)'
								: '#1a1540'};
						border-color: {isSelected && answerCorrect
							? '#22c55e'
							: isSelected && !answerCorrect
								? '#ef4444'
								: selected !== null && answerCorrect
									? '#22c55e'
									: '#3995ff44'};
					"
				>
					{answer.answer_text}
				</button>
			{/each}
		</div>
	{/if}
</div>
