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
	let isCorrect = $state<boolean | null>(null);
	let showSecret = $state(false);
	let finished = $state(false);

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
		isCorrect = correct;
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
		isCorrect = null;
		if (currentIdx + 1 < questions.length) {
			currentIdx++;
		} else {
			finished = true;
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
	style="background: rgba(15,11,36,0.95); backdrop-filter: blur(8px);"
>
	{#if loading}
		<div class="w-10 h-10 rounded-full border-4 border-[#3995FF] border-t-transparent animate-spin"></div>
	{:else if finished}
		<div class="flex flex-col items-center gap-6 text-center max-w-md">
			<div class="text-6xl">⭐</div>
			<h2
				class="text-3xl font-bold text-white"
				style="font-family: var(--font-title, 'AcuminVariableConcept', system-ui, sans-serif);"
			>
				Bravo !
			</h2>
			<p class="text-white/70">Tu as terminé toutes les questions.</p>
			<button
				onclick={onComplete}
				class="mt-2 rounded-full bg-[#FFBD14] px-8 py-3 font-semibold text-[#0F0B24] transition-transform hover:scale-105 active:scale-95"
				style="font-family: var(--font-title, 'AcuminVariableConcept', system-ui, sans-serif);"
			>
				Continuer
			</button>
		</div>
	{:else if currentQuestion}
		<div class="flex flex-col gap-6 w-full max-w-lg">
			<div class="text-center">
				<span class="text-white/50 text-sm">{currentIdx + 1} / {questions.length}</span>
				<h2
					class="mt-2 text-xl font-semibold text-white"
					style="font-family: var(--font-title, 'AcuminVariableConcept', system-ui, sans-serif);"
				>
					{currentQuestion.question_text}
				</h2>
			</div>

			{#if showSecret && currentQuestion.secret_word}
				<div
					class="mx-auto rounded-xl px-6 py-3 text-center"
					style="background: #FFBD14; color: #0F0B24; font-family: var(--font-title, 'AcuminVariableConcept', system-ui, sans-serif);"
				>
					<div class="text-sm font-semibold opacity-70">Mot secret</div>
					<div class="text-2xl font-bold">{currentQuestion.secret_word}</div>
				</div>
			{/if}

			<div class="flex flex-col gap-3">
				{#each [...currentQuestion.answers].sort((a, b) => a.display_order - b.display_order) as answer}
					{@const isSelected = selected === answer.id}
					{@const answerCorrect = answer.is_correct === 1}
					<button
						onclick={() => selectAnswer(answer.id, answerCorrect)}
						disabled={selected !== null}
						class="w-full rounded-xl border px-5 py-4 text-left text-white transition-all duration-200 disabled:cursor-default"
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
		</div>
	{/if}
</div>
