<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { api, type Module, type Question, type QuestionInput } from '$lib/api';
	import {
		ArrowLeft,
		Plus,
		Pencil,
		Trash2,
		X,
		ChevronRight,
		Check,
		HelpCircle,
		Upload
	} from 'lucide-svelte';

	const moduleId = $derived($page.params.id as string);

	let module = $state<Module | null>(null);
	let questions = $state<Question[]>([]);
	let loading = $state(true);
	let activeAgeGroup = $state('5-7');
	const AGE_GROUPS = ['5-7', '8-10', '11-13', '14+'];

	// Module edit
	let editingModuleInline = $state(false);
	let moduleForm = $state({
		number: 1,
		name: '',
		description: '',
		qr_code: '',
		media_type: 'image',
		media_url: '',
		has_quiz: false,
		is_active: true,
		suggested_order: 1,
		position_x: 0,
		position_y: 0
	});
	let savingModule = $state(false);

	// Question modal
	let showQuestionModal = $state(false);
	let editingQuestion = $state<Question | null>(null);
	let questionForm = $state({
		age_group: '5-7',
		question_text: '',
		secret_word: '',
		display_order: 1,
		answers: [
			{ answer_text: '', is_correct: true, display_order: 1 },
			{ answer_text: '', is_correct: false, display_order: 2 },
			{ answer_text: '', is_correct: false, display_order: 3 },
			{ answer_text: '', is_correct: false, display_order: 4 }
		]
	});
	let submittingQuestion = $state(false);
	let deleteQuestionConfirm = $state<string | null>(null);
	let uploadingMedia = $state(false);

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const [mod, qs] = await Promise.all([
				api.getModule(moduleId),
				api.getQuestionsAll(moduleId)
			]);
			module = mod;
			questions = qs;
			resetModuleForm();
		} catch (err) {
			toast.error('Erreur lors du chargement');
			goto('/admin/modules');
		} finally {
			loading = false;
		}
	}

	function resetModuleForm() {
		if (!module) return;
		moduleForm = {
			number: module.number,
			name: module.name,
			description: module.description ?? '',
			qr_code: module.qr_code,
			media_type: module.media_type ?? 'image',
			media_url: module.media_url ?? '',
			has_quiz: module.has_quiz,
			is_active: module.is_active,
			suggested_order: module.suggested_order,
			position_x: module.position_x ?? 0,
			position_y: module.position_y ?? 0
		};
	}

	async function saveModule(e: Event) {
		e.preventDefault();
		savingModule = true;
		try {
			const updated = await api.updateModule(moduleId, moduleForm);
			module = updated;
			editingModuleInline = false;
			toast.success('Module mis à jour');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur');
		} finally {
			savingModule = false;
		}
	}

	const filteredQuestions = $derived(
		questions.filter((q) => q.age_group === activeAgeGroup).sort((a, b) => a.display_order - b.display_order)
	);

	function openCreateQuestion() {
		editingQuestion = null;
		questionForm = {
			age_group: activeAgeGroup,
			question_text: '',
			secret_word: '',
			display_order: filteredQuestions.length + 1,
			answers: [
				{ answer_text: '', is_correct: true, display_order: 1 },
				{ answer_text: '', is_correct: false, display_order: 2 },
				{ answer_text: '', is_correct: false, display_order: 3 },
				{ answer_text: '', is_correct: false, display_order: 4 }
			]
		};
		showQuestionModal = true;
	}

	function openEditQuestion(q: Question) {
		editingQuestion = q;
		// Pad answers to 4
		const answers = [...q.answers].sort((a, b) => a.display_order - b.display_order).map((a) => ({
			answer_text: a.answer_text,
			is_correct: !!a.is_correct,
			display_order: a.display_order
		}));
		while (answers.length < 4) {
			answers.push({ answer_text: '', is_correct: false, display_order: answers.length + 1 });
		}
		questionForm = {
			age_group: q.age_group,
			question_text: q.question_text,
			secret_word: q.secret_word ?? '',
			display_order: q.display_order,
			answers
		};
		showQuestionModal = true;
	}

	function setCorrectAnswer(index: number) {
		questionForm.answers = questionForm.answers.map((a, i) => ({
			...a,
			is_correct: i === index
		}));
	}

	async function handleQuestionSubmit(e: Event) {
		e.preventDefault();
		if (!questionForm.question_text) {
			toast.error('La question est requise');
			return;
		}
		// Only send non-empty answers
		const answers = questionForm.answers.filter((a) => a.answer_text.trim());
		if (answers.length === 0) {
			toast.error('Au moins une réponse est requise');
			return;
		}

		submittingQuestion = true;
		try {
			const data: QuestionInput = {
				module_id: moduleId,
				age_group: questionForm.age_group,
				question_text: questionForm.question_text,
				secret_word: questionForm.secret_word || undefined,
				display_order: questionForm.display_order,
				answers: answers.map((a, i) => ({
					answer_text: a.answer_text,
					is_correct: a.is_correct,
					display_order: i + 1
				}))
			};

			if (editingQuestion) {
				const updated = await api.updateQuestion(editingQuestion.id, data);
				questions = questions.map((q) => (q.id === updated.id ? updated : q));
				toast.success('Question mise à jour');
			} else {
				const created = await api.createQuestion(data);
				questions = [...questions, created];
				toast.success('Question créée');
			}
			showQuestionModal = false;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur');
		} finally {
			submittingQuestion = false;
		}
	}

	async function deleteQuestion(id: string) {
		try {
			await api.deleteQuestion(id);
			questions = questions.filter((q) => q.id !== id);
			deleteQuestionConfirm = null;
			toast.success('Question supprimée');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur');
		}
	}

	async function handleMediaUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploadingMedia = true;
		try {
			const result = await api.upload(file, 'modules');
			moduleForm.media_url = result.url;
			toast.success('Fichier uploadé');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur upload');
		} finally {
			uploadingMedia = false;
			input.value = '';
		}
	}

	const questionCountByGroup = $derived(
		AGE_GROUPS.reduce(
			(acc, g) => {
				acc[g] = questions.filter((q) => q.age_group === g).length;
				return acc;
			},
			{} as Record<string, number>
		)
	);
</script>

<svelte:head>
	<title>{module?.name ?? 'Module'} — Mirokaï Admin</title>
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center py-20">
		<div
			class="h-8 w-8 animate-spin rounded-full border-4"
			style="border-color: #3995FF; border-top-color: transparent"
		></div>
	</div>
{:else if module}
	<div class="flex flex-col gap-6">
		<!-- Breadcrumb -->
		<div class="flex items-center gap-2">
			<a
				href="/admin/modules"
				class="flex items-center gap-1.5 text-sm transition-colors"
				style="color: #94a3b8"
			>
				<ArrowLeft size={16} />
				Modules
			</a>
			<ChevronRight size={14} style="color: #3995ff44" />
			<span class="text-sm text-white">{module.name}</span>
		</div>

		<!-- Module info card -->
		<div
			class="rounded-xl border overflow-hidden"
			style="background-color: #1a1540; border-color: #3995ff22;"
		>
			<div
				class="flex items-center justify-between border-b px-6 py-4"
				style="border-color: #3995ff22"
			>
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold"
						style="background: linear-gradient(135deg, #1D3AA2, #3995FF)"
					>
						{module.number}
					</div>
					<div>
						<h1 class="text-lg font-bold text-white">{module.name}</h1>
						<div class="text-xs font-mono" style="color: #3995ff88">{module.qr_code}</div>
					</div>
					<span
						class="ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium"
						style="background-color: {module.is_active ? '#16a34a20' : '#94a3b820'}; color: {module.is_active ? '#4ade80' : '#94a3b8'}"
					>
						{module.is_active ? 'Actif' : 'Inactif'}
					</span>
				</div>
				<button
					onclick={() => {
						editingModuleInline = !editingModuleInline;
						if (!editingModuleInline) resetModuleForm();
					}}
					class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
					style="border-color: #3995ff33; color: {editingModuleInline ? '#ff7777' : '#3995FF'}"
				>
					{#if editingModuleInline}
						<X size={15} /> Annuler
					{:else}
						<Pencil size={15} /> Modifier
					{/if}
				</button>
			</div>

			{#if editingModuleInline}
				<!-- Inline edit form -->
				<form onsubmit={saveModule} class="p-6">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="flex flex-col gap-1.5">
							<label class="text-xs font-medium uppercase" style="color: #94a3b8">Numéro</label>
							<input
								type="number"
								bind:value={moduleForm.number}
								min="1"
								class="rounded-lg border px-3 py-2 text-sm text-white outline-none"
								style="background-color: #221c4a; border-color: #3995ff33;"
								onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
								onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
							/>
						</div>
						<div class="flex flex-col gap-1.5">
							<label class="text-xs font-medium uppercase" style="color: #94a3b8">QR Code</label>
							<input
								type="text"
								bind:value={moduleForm.qr_code}
								class="rounded-lg border px-3 py-2 text-sm text-white outline-none font-mono"
								style="background-color: #221c4a; border-color: #3995ff33;"
								onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
								onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
							/>
						</div>
						<div class="flex flex-col gap-1.5 md:col-span-2">
							<label class="text-xs font-medium uppercase" style="color: #94a3b8">Nom</label>
							<input
								type="text"
								bind:value={moduleForm.name}
								class="rounded-lg border px-3 py-2 text-sm text-white outline-none"
								style="background-color: #221c4a; border-color: #3995ff33;"
								onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
								onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
							/>
						</div>
						<div class="flex flex-col gap-1.5 md:col-span-2">
							<label class="text-xs font-medium uppercase" style="color: #94a3b8">Description</label>
							<textarea
								bind:value={moduleForm.description}
								rows={2}
								class="rounded-lg border px-3 py-2 text-sm text-white outline-none resize-none"
								style="background-color: #221c4a; border-color: #3995ff33;"
								onfocus={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#3995FF')}
								onblur={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#3995ff33')}
							></textarea>
						</div>
						<div class="flex flex-col gap-1.5">
							<label class="text-xs font-medium uppercase" style="color: #94a3b8">Type de média</label>
							<select
								bind:value={moduleForm.media_type}
								class="rounded-lg border px-3 py-2 text-sm text-white outline-none"
								style="background-color: #221c4a; border-color: #3995ff33;"
							>
								<option value="image">Image</option>
								<option value="video">Vidéo</option>
								<option value="audio">Audio</option>
							</select>
						</div>
						<div class="flex flex-col gap-1.5">
							<label class="text-xs font-medium uppercase" style="color: #94a3b8">Ordre suggéré</label>
							<input
								type="number"
								bind:value={moduleForm.suggested_order}
								min="1"
								class="rounded-lg border px-3 py-2 text-sm text-white outline-none"
								style="background-color: #221c4a; border-color: #3995ff33;"
								onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
								onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
							/>
						</div>
						<div class="flex flex-col gap-1.5 md:col-span-2">
							<label class="text-xs font-medium uppercase" style="color: #94a3b8">URL du média</label>
							<div class="flex gap-2">
								<input
									type="text"
									bind:value={moduleForm.media_url}
									placeholder="/uploads/modules/..."
									class="flex-1 rounded-lg border px-3 py-2 text-sm text-white outline-none"
									style="background-color: #221c4a; border-color: #3995ff33;"
									onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
									onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
								/>
								<label
									class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
									style="border-color: #3995ff33; color: #3995FF; background-color: #3995ff10"
								>
									{#if uploadingMedia}
										<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
									{:else}
										<Upload size={15} />
									{/if}
									Upload
									<input
										type="file"
										accept="image/*,video/*,audio/*"
										class="hidden"
										onchange={handleMediaUpload}
										disabled={uploadingMedia}
									/>
								</label>
							</div>
						</div>
						<div class="flex gap-6 md:col-span-2">
							<label class="flex cursor-pointer items-center gap-2">
								<input type="checkbox" bind:checked={moduleForm.has_quiz} class="h-4 w-4 rounded" />
								<span class="text-sm text-white">A un quiz</span>
							</label>
							<label class="flex cursor-pointer items-center gap-2">
								<input type="checkbox" bind:checked={moduleForm.is_active} class="h-4 w-4 rounded" />
								<span class="text-sm text-white">Actif</span>
							</label>
						</div>
					</div>
					<div class="mt-5 flex justify-end gap-3">
						<button
							type="button"
							onclick={() => { editingModuleInline = false; resetModuleForm(); }}
							class="rounded-lg border px-4 py-2 text-sm font-medium"
							style="border-color: #3995ff33; color: #94a3b8"
						>
							Annuler
						</button>
						<button
							type="submit"
							disabled={savingModule}
							class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
							style="background-color: #FFBD14; color: #0F0B24; opacity: {savingModule ? '0.7' : '1'}"
						>
							{#if savingModule}
								<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
							{/if}
							Enregistrer
						</button>
					</div>
				</form>
			{:else}
				<!-- Read-only view -->
				<div class="grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
					<div>
						<div class="text-xs font-medium uppercase" style="color: #94a3b8">Type de média</div>
						<div class="mt-1 text-sm text-white">{module.media_type || '—'}</div>
					</div>
					<div>
						<div class="text-xs font-medium uppercase" style="color: #94a3b8">Ordre</div>
						<div class="mt-1 text-sm text-white">{module.suggested_order}</div>
					</div>
					<div>
						<div class="text-xs font-medium uppercase" style="color: #94a3b8">Quiz</div>
						<div class="mt-1 text-sm text-white">{module.has_quiz ? 'Oui' : 'Non'}</div>
					</div>
					<div>
						<div class="text-xs font-medium uppercase" style="color: #94a3b8">Questions</div>
						<div class="mt-1 text-sm text-white">{questions.length}</div>
					</div>
					{#if module.media_url}
						<div class="col-span-2 md:col-span-4">
							<div class="text-xs font-medium uppercase" style="color: #94a3b8">URL média</div>
							<div class="mt-1 font-mono text-xs" style="color: #3995ff88">{module.media_url}</div>
						</div>
					{/if}
					{#if module.description}
						<div class="col-span-2 md:col-span-4">
							<div class="text-xs font-medium uppercase" style="color: #94a3b8">Description</div>
							<div class="mt-1 text-sm" style="color: #cbd5e1">{module.description}</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Questions section -->
		<div
			class="rounded-xl border overflow-hidden"
			style="background-color: #1a1540; border-color: #3995ff22;"
		>
			<div
				class="flex items-center justify-between border-b px-6 py-4"
				style="border-color: #3995ff22"
			>
				<h2 class="text-base font-semibold text-white">Questions</h2>
				<button
					onclick={openCreateQuestion}
					class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
					style="background-color: #FFBD14; color: #0F0B24"
				>
					<Plus size={15} />
					Nouvelle question
				</button>
			</div>

			<!-- Age group tabs -->
			<div
				class="flex border-b px-4"
				style="border-color: #3995ff22; background-color: #221c4a40"
			>
				{#each AGE_GROUPS as group}
					<button
						onclick={() => (activeAgeGroup = group)}
						class="relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
						style="color: {activeAgeGroup === group ? 'white' : '#94a3b8'};
							border-bottom: 2px solid {activeAgeGroup === group ? '#3995FF' : 'transparent'};"
					>
						{group} ans
						{#if questionCountByGroup[group] > 0}
							<span
								class="rounded-full px-1.5 py-0.5 text-xs"
								style="background-color: {activeAgeGroup === group ? '#3995ff30' : '#3995ff15'}; color: #3995FF; min-width: 20px; text-align: center;"
							>
								{questionCountByGroup[group]}
							</span>
						{/if}
					</button>
				{/each}
			</div>

			<!-- Questions list -->
			<div class="p-4">
				{#if filteredQuestions.length === 0}
					<div class="flex flex-col items-center gap-2 py-12">
						<HelpCircle size={32} style="color: #3995ff33" />
						<p class="text-sm" style="color: #94a3b8">
							Aucune question pour le groupe {activeAgeGroup} ans
						</p>
						<button
							onclick={openCreateQuestion}
							class="mt-2 text-sm"
							style="color: #3995FF"
						>
							Ajouter une question →
						</button>
					</div>
				{:else}
					<div class="flex flex-col gap-3">
						{#each filteredQuestions as q}
							<div
								class="rounded-xl border p-4 transition-all"
								style="background-color: #221c4a; border-color: #3995ff22;"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2">
											<span
												class="text-xs font-mono px-1.5 py-0.5 rounded"
												style="background-color: #3995ff20; color: #3995ff88"
											>
												#{q.display_order}
											</span>
											<p class="text-sm font-medium text-white">{q.question_text}</p>
										</div>
										{#if q.secret_word}
											<div class="mt-1 flex items-center gap-1">
												<span class="text-xs" style="color: #94a3b8">Mot secret :</span>
												<span class="text-xs font-mono font-bold" style="color: #FFBD14"
													>{q.secret_word}</span
												>
											</div>
										{/if}

										<!-- Answers -->
										{#if q.answers?.length}
											<div class="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
												{#each q.answers.sort((a, b) => a.display_order - b.display_order) as answer}
													<div
														class="flex items-center gap-2 rounded-lg px-3 py-1.5"
														style="background-color: {answer.is_correct ? '#16a34a20' : '#3995ff10'}; border: 1px solid {answer.is_correct ? '#16a34a40' : '#3995ff15'};"
													>
														<div
															class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-xs"
															style="background-color: {answer.is_correct ? '#4ade80' : '#94a3b8'}; color: {answer.is_correct ? '#0F0B24' : '#1a1540'}"
														>
															{#if answer.is_correct}
																<Check size={10} />
															{:else}
																{answer.display_order}
															{/if}
														</div>
														<span class="text-xs" style="color: {answer.is_correct ? '#4ade80' : '#cbd5e1'}"
															>{answer.answer_text}</span
														>
													</div>
												{/each}
											</div>
										{/if}
									</div>

									<div class="flex flex-shrink-0 items-center gap-1">
										<button
											onclick={() => openEditQuestion(q)}
											class="rounded-lg p-1.5 transition-colors"
											style="color: #94a3b8"
											onmouseover={(e) => {
												(e.currentTarget as HTMLElement).style.backgroundColor = '#3995ff20';
												(e.currentTarget as HTMLElement).style.color = '#3995FF';
											}}
											onmouseout={(e) => {
												(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
												(e.currentTarget as HTMLElement).style.color = '#94a3b8';
											}}
										>
											<Pencil size={14} />
										</button>
										<button
											onclick={() => (deleteQuestionConfirm = q.id)}
											class="rounded-lg p-1.5 transition-colors"
											style="color: #94a3b8"
											onmouseover={(e) => {
												(e.currentTarget as HTMLElement).style.backgroundColor = '#ff444420';
												(e.currentTarget as HTMLElement).style.color = '#ff7777';
											}}
											onmouseout={(e) => {
												(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
												(e.currentTarget as HTMLElement).style.color = '#94a3b8';
											}}
										>
											<Trash2 size={14} />
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Question Modal -->
{#if showQuestionModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		style="background-color: rgba(0,0,0,0.7); backdrop-filter: blur(4px)"
		onclick={(e) => { if (e.target === e.currentTarget) showQuestionModal = false; }}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="w-full max-w-2xl rounded-2xl border max-h-[90vh] overflow-y-auto"
			style="background-color: #1a1540; border-color: #3995ff33;"
		>
			<div
				class="flex items-center justify-between border-b px-6 py-4"
				style="border-color: #3995ff22"
			>
				<h2 class="text-lg font-semibold text-white">
					{editingQuestion ? 'Modifier la question' : 'Nouvelle question'}
				</h2>
				<button
					onclick={() => (showQuestionModal = false)}
					class="rounded-lg p-1.5 transition-colors"
					style="color: #94a3b8"
				>
					<X size={18} />
				</button>
			</div>

			<form onsubmit={handleQuestionSubmit} class="flex flex-col gap-5 p-6">
				<div class="grid grid-cols-2 gap-4">
					<!-- Age group -->
					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium" style="color: #94a3b8">Groupe d'âge *</label>
						<select
							bind:value={questionForm.age_group}
							class="rounded-lg border px-3 py-2 text-sm text-white outline-none"
							style="background-color: #221c4a; border-color: #3995ff33;"
						>
							{#each AGE_GROUPS as group}
								<option value={group}>{group} ans</option>
							{/each}
						</select>
					</div>

					<!-- Display order -->
					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium" style="color: #94a3b8">Ordre d'affichage</label>
						<input
							type="number"
							bind:value={questionForm.display_order}
							min="1"
							class="rounded-lg border px-3 py-2 text-sm text-white outline-none"
							style="background-color: #221c4a; border-color: #3995ff33;"
							onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
							onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
						/>
					</div>
				</div>

				<!-- Question text -->
				<div class="flex flex-col gap-1.5">
					<label class="text-sm font-medium" style="color: #94a3b8">Question *</label>
					<textarea
						bind:value={questionForm.question_text}
						placeholder="Quelle est la couleur du ciel ?"
						rows={2}
						required
						class="rounded-lg border px-3 py-2 text-sm text-white outline-none resize-none"
						style="background-color: #221c4a; border-color: #3995ff33;"
						onfocus={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#3995FF')}
						onblur={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#3995ff33')}
					></textarea>
				</div>

				<!-- Secret word -->
				<div class="flex flex-col gap-1.5">
					<label class="text-sm font-medium" style="color: #94a3b8">
						Mot secret
						<span class="ml-1 text-xs font-normal" style="color: #94a3b880">(optionnel)</span>
					</label>
					<input
						type="text"
						bind:value={questionForm.secret_word}
						placeholder="AZUR"
						class="rounded-lg border px-3 py-2 text-sm text-white outline-none font-mono tracking-widest uppercase"
						style="background-color: #221c4a; border-color: #3995ff33;"
						onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#FFBD14')}
						onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
					/>
				</div>

				<!-- Answers -->
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium" style="color: #94a3b8">
						Réponses
						<span class="ml-1 text-xs font-normal" style="color: #94a3b880">(sélectionner la bonne réponse)</span>
					</label>
					{#each questionForm.answers as answer, i}
						<div class="flex items-center gap-3">
							<button
								type="button"
								onclick={() => setCorrectAnswer(i)}
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all"
								style="border-color: {answer.is_correct ? '#4ade80' : '#3995ff44'}; background-color: {answer.is_correct ? '#4ade80' : 'transparent'};"
								title="Marquer comme bonne réponse"
							>
								{#if answer.is_correct}
									<Check size={12} style="color: #0F0B24" />
								{/if}
							</button>
							<input
								type="text"
								bind:value={questionForm.answers[i].answer_text}
								placeholder="Réponse {i + 1}"
								class="flex-1 rounded-lg border px-3 py-2 text-sm text-white outline-none"
								style="background-color: #221c4a; border-color: {answer.is_correct ? '#4ade8044' : '#3995ff33'};"
								onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = answer.is_correct ? '#4ade80' : '#3995FF')}
								onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = answer.is_correct ? '#4ade8044' : '#3995ff33')}
							/>
						</div>
					{/each}
				</div>

				<div class="flex justify-end gap-3 border-t pt-4" style="border-color: #3995ff22">
					<button
						type="button"
						onclick={() => (showQuestionModal = false)}
						class="rounded-lg border px-4 py-2 text-sm font-medium"
						style="border-color: #3995ff33; color: #94a3b8"
					>
						Annuler
					</button>
					<button
						type="submit"
						disabled={submittingQuestion}
						class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
						style="background-color: #FFBD14; color: #0F0B24; opacity: {submittingQuestion ? '0.7' : '1'}"
					>
						{#if submittingQuestion}
							<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
						{/if}
						{editingQuestion ? 'Enregistrer' : 'Créer'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete question confirmation -->
{#if deleteQuestionConfirm}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		style="background-color: rgba(0,0,0,0.7); backdrop-filter: blur(4px)"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="w-full max-w-sm rounded-2xl border p-6"
			style="background-color: #1a1540; border-color: #ff444433"
		>
			<h3 class="text-lg font-semibold text-white">Supprimer la question ?</h3>
			<p class="mt-2 text-sm" style="color: #94a3b8">
				Cette action est irréversible.
			</p>
			<div class="mt-5 flex justify-end gap-3">
				<button
					onclick={() => (deleteQuestionConfirm = null)}
					class="rounded-lg border px-4 py-2 text-sm font-medium"
					style="border-color: #3995ff33; color: #94a3b8"
				>
					Annuler
				</button>
				<button
					onclick={() => deleteQuestion(deleteQuestionConfirm!)}
					class="rounded-lg px-4 py-2 text-sm font-semibold"
					style="background-color: #ff4444; color: white"
				>
					Supprimer
				</button>
			</div>
		</div>
	</div>
{/if}
