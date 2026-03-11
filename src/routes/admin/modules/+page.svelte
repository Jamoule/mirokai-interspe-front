<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { api, type Module } from '$lib/api';
	import { Plus, Pencil, Trash2, Eye, ToggleLeft, ToggleRight, X, Upload } from 'lucide-svelte';

	let modules = $state<Module[]>([]);
	let sortedModules = $derived([...modules].sort((a, b) => a.number - b.number));
	let loading = $state(true);
	let showModal = $state(false);
	let editingModule = $state<Module | null>(null);
	let submitting = $state(false);
	let deleteConfirm = $state<string | null>(null);
	let uploadingMedia = $state(false);

	// Form state
	let form = $state({
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

	onMount(loadModules);

	async function loadModules() {
		loading = true;
		try {
			modules = await api.getModules();
		} catch (err) {
			toast.error('Erreur lors du chargement des modules');
		} finally {
			loading = false;
		}
	}

	function openCreate() {
		editingModule = null;
		form = {
			number: (Math.max(0, ...modules.map((m) => m.number)) + 1),
			name: '',
			description: '',
			qr_code: '',
			media_type: 'image',
			media_url: '',
			has_quiz: false,
			is_active: true,
			suggested_order: modules.length + 1,
			position_x: 0,
			position_y: 0
		};
		showModal = true;
	}

	function openEdit(module: Module) {
		editingModule = module;
		form = {
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
		showModal = true;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!form.name || !form.qr_code) {
			toast.error('Nom et QR Code sont requis');
			return;
		}
		submitting = true;
		try {
			if (editingModule) {
				const updated = await api.updateModule(editingModule.id, form);
				modules = modules.map((m) => (m.id === updated.id ? updated : m));
				toast.success('Module mis à jour');
			} else {
				const created = await api.createModule(form);
				modules = [...modules, created];
				toast.success('Module créé');
			}
			showModal = false;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur');
		} finally {
			submitting = false;
		}
	}

	async function handleToggle(module: Module) {
		try {
			const updated = await api.toggleModule(module.id, !module.is_active);
			modules = modules.map((m) => (m.id === updated.id ? updated : m));
			toast.success(`Module ${updated.is_active ? 'activé' : 'désactivé'}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur');
		}
	}

	async function handleDelete(id: string) {
		try {
			await api.deleteModule(id);
			modules = modules.filter((m) => m.id !== id);
			deleteConfirm = null;
			toast.success('Module supprimé');
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
			form.media_url = result.url;
			toast.success('Fichier uploadé');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur upload');
		} finally {
			uploadingMedia = false;
			input.value = '';
		}
	}
</script>

<svelte:head>
	<title>Modules — Mirokaï Admin</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-white">Modules</h1>
			<p class="mt-1 text-sm" style="color: #94a3b8">
				{modules.length} module{modules.length > 1 ? 's' : ''} au total
			</p>
		</div>
		<button
			onclick={openCreate}
			class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
			style="background-color: #FFBD14; color: #0F0B24"
		>
			<Plus size={16} />
			Nouveau module
		</button>
	</div>

	<!-- Table -->
	<div class="rounded-xl border overflow-hidden" style="background-color: #1a1540; border-color: #3995ff22;">
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"
					style="border-color: #3995FF; border-top-color: transparent"
				></div>
			</div>
		{:else if modules.length === 0}
			<div class="flex flex-col items-center justify-center py-20 gap-3">
				<div class="text-4xl opacity-20">⬡</div>
				<p style="color: #94a3b8">Aucun module créé</p>
				<button
					onclick={openCreate}
					class="text-sm"
					style="color: #3995FF"
				>
					Créer le premier module →
				</button>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr style="border-bottom: 1px solid #3995ff22;">
							<th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">N°</th>
							<th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">Nom</th>
							<th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">QR Code</th>
							<th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">Type</th>
							<th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">Quiz</th>
							<th class="px-4 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">Actif</th>
							<th class="px-4 py-3 text-right text-xs font-medium uppercase" style="color: #94a3b8">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each sortedModules as module}
							<tr
								style="border-bottom: 1px solid #3995ff11; transition: background-color 0.15s"
								onmouseover={(e) =>
									((e.currentTarget as HTMLElement).style.backgroundColor = '#3995ff08')}
								onmouseout={(e) =>
									((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
							>
								<td class="px-4 py-3 font-mono font-bold text-white">{module.number}</td>
								<td class="px-4 py-3 text-white font-medium">{module.name}</td>
								<td class="px-4 py-3 font-mono text-xs" style="color: #3995ff88">{module.qr_code}</td>
								<td class="px-4 py-3">
									<span
										class="rounded px-2 py-0.5 text-xs"
										style="background-color: #3995ff20; color: #3995FF"
									>
										{module.media_type || '—'}
									</span>
								</td>
								<td class="px-4 py-3">
									{#if module.has_quiz}
										<span
											class="rounded px-2 py-0.5 text-xs font-medium"
											style="background-color: #FFBD1420; color: #FFBD14"
										>
											Quiz
										</span>
									{:else}
										<span style="color: #94a3b860" class="text-xs">—</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<button
										onclick={() => handleToggle(module)}
										class="transition-colors"
									>
										{#if module.is_active}
											<ToggleRight size={24} style="color: #4ade80" />
										{:else}
											<ToggleLeft size={24} style="color: #94a3b8" />
										{/if}
									</button>
								</td>
								<td class="px-4 py-3">
									<div class="flex items-center justify-end gap-1">
										<a
											href="/admin/modules/{module.id}"
											class="rounded-lg p-2 transition-colors"
											style="color: #94a3b8"
											title="Voir les questions"
											onmouseover={(e) => {
												(e.currentTarget as HTMLElement).style.backgroundColor = '#3995ff20';
												(e.currentTarget as HTMLElement).style.color = '#3995FF';
											}}
											onmouseout={(e) => {
												(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
												(e.currentTarget as HTMLElement).style.color = '#94a3b8';
											}}
										>
											<Eye size={16} />
										</a>
										<button
											onclick={() => openEdit(module)}
											class="rounded-lg p-2 transition-colors"
											style="color: #94a3b8"
											title="Modifier"
											onmouseover={(e) => {
												(e.currentTarget as HTMLElement).style.backgroundColor = '#3995ff20';
												(e.currentTarget as HTMLElement).style.color = '#3995FF';
											}}
											onmouseout={(e) => {
												(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
												(e.currentTarget as HTMLElement).style.color = '#94a3b8';
											}}
										>
											<Pencil size={16} />
										</button>
										<button
											onclick={() => (deleteConfirm = module.id)}
											class="rounded-lg p-2 transition-colors"
											style="color: #94a3b8"
											title="Supprimer"
											onmouseover={(e) => {
												(e.currentTarget as HTMLElement).style.backgroundColor = '#ff444420';
												(e.currentTarget as HTMLElement).style.color = '#ff7777';
											}}
											onmouseout={(e) => {
												(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
												(e.currentTarget as HTMLElement).style.color = '#94a3b8';
											}}
										>
											<Trash2 size={16} />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- Create/Edit Modal -->
{#if showModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		style="background-color: rgba(0,0,0,0.7); backdrop-filter: blur(4px)"
		onclick={(e) => { if (e.target === e.currentTarget) showModal = false; }}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="w-full max-w-2xl rounded-2xl border max-h-[90vh] overflow-y-auto"
			style="background-color: #1a1540; border-color: #3995ff33;"
		>
			<!-- Modal header -->
			<div
				class="flex items-center justify-between border-b px-6 py-4"
				style="border-color: #3995ff22"
			>
				<h2 class="text-lg font-semibold text-white">
					{editingModule ? 'Modifier le module' : 'Nouveau module'}
				</h2>
				<button
					onclick={() => (showModal = false)}
					class="rounded-lg p-1.5 transition-colors"
					style="color: #94a3b8"
				>
					<X size={18} />
				</button>
			</div>

			<!-- Form -->
			<form onsubmit={handleSubmit} class="flex flex-col gap-5 p-6">
				<div class="grid grid-cols-2 gap-4">
					<!-- Number -->
					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium" style="color: #94a3b8">Numéro *</label>
						<input
							type="number"
							bind:value={form.number}
							min="1"
							required
							class="rounded-lg border px-3 py-2 text-sm text-white outline-none"
							style="background-color: #221c4a; border-color: #3995ff33;"
							onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
							onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
						/>
					</div>

					<!-- QR Code -->
					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium" style="color: #94a3b8">QR Code *</label>
						<input
							type="text"
							bind:value={form.qr_code}
							placeholder="MOD-001"
							required
							class="rounded-lg border px-3 py-2 text-sm text-white outline-none font-mono"
							style="background-color: #221c4a; border-color: #3995ff33;"
							onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
							onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
						/>
					</div>
				</div>

				<!-- Name -->
				<div class="flex flex-col gap-1.5">
					<label class="text-sm font-medium" style="color: #94a3b8">Nom *</label>
					<input
						type="text"
						bind:value={form.name}
						placeholder="La Forêt"
						required
						class="rounded-lg border px-3 py-2 text-sm text-white outline-none"
						style="background-color: #221c4a; border-color: #3995ff33;"
						onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
						onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
					/>
				</div>

				<!-- Description -->
				<div class="flex flex-col gap-1.5">
					<label class="text-sm font-medium" style="color: #94a3b8">Description</label>
					<textarea
						bind:value={form.description}
						placeholder="Description du module..."
						rows={3}
						class="rounded-lg border px-3 py-2 text-sm text-white outline-none resize-none"
						style="background-color: #221c4a; border-color: #3995ff33;"
						onfocus={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#3995FF')}
						onblur={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#3995ff33')}
					></textarea>
				</div>

				<!-- Media type + URL -->
				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium" style="color: #94a3b8">Type de média</label>
						<select
							bind:value={form.media_type}
							class="rounded-lg border px-3 py-2 text-sm text-white outline-none"
							style="background-color: #221c4a; border-color: #3995ff33;"
						>
							<option value="image">Image</option>
							<option value="video">Vidéo</option>
							<option value="audio">Audio</option>
						</select>
					</div>

					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium" style="color: #94a3b8">Ordre suggéré</label>
						<input
							type="number"
							bind:value={form.suggested_order}
							min="1"
							class="rounded-lg border px-3 py-2 text-sm text-white outline-none"
							style="background-color: #221c4a; border-color: #3995ff33;"
							onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
							onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
						/>
					</div>
				</div>

				<!-- Media URL + Upload -->
				<div class="flex flex-col gap-1.5">
					<label class="text-sm font-medium" style="color: #94a3b8">URL du média</label>
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={form.media_url}
							placeholder="/uploads/modules/..."
							class="flex-1 rounded-lg border px-3 py-2 text-sm text-white outline-none"
							style="background-color: #221c4a; border-color: #3995ff33;"
							onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
							onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
						/>
						<label
							class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap"
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

				<!-- Checkboxes -->
				<div class="flex gap-6">
					<label class="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							bind:checked={form.has_quiz}
							class="h-4 w-4 rounded accent-yellow-400"
						/>
						<span class="text-sm text-white">A un quiz</span>
					</label>
					<label class="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							bind:checked={form.is_active}
							class="h-4 w-4 rounded"
						/>
						<span class="text-sm text-white">Actif</span>
					</label>
				</div>

				<!-- Actions -->
				<div class="flex justify-end gap-3 border-t pt-4" style="border-color: #3995ff22">
					<button
						type="button"
						onclick={() => (showModal = false)}
						class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
						style="border-color: #3995ff33; color: #94a3b8"
					>
						Annuler
					</button>
					<button
						type="submit"
						disabled={submitting}
						class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
						style="background-color: #FFBD14; color: #0F0B24; opacity: {submitting ? '0.7' : '1'}"
					>
						{#if submitting}
							<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
						{/if}
						{editingModule ? 'Enregistrer' : 'Créer'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete confirmation modal -->
{#if deleteConfirm}
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
			<h3 class="text-lg font-semibold text-white">Supprimer le module ?</h3>
			<p class="mt-2 text-sm" style="color: #94a3b8">
				Cette action est irréversible. Le module et toutes ses questions seront supprimés.
			</p>
			<div class="mt-5 flex justify-end gap-3">
				<button
					onclick={() => (deleteConfirm = null)}
					class="rounded-lg border px-4 py-2 text-sm font-medium"
					style="border-color: #3995ff33; color: #94a3b8"
				>
					Annuler
				</button>
				<button
					onclick={() => handleDelete(deleteConfirm!)}
					class="rounded-lg px-4 py-2 text-sm font-semibold"
					style="background-color: #ff4444; color: white"
				>
					Supprimer
				</button>
			</div>
		</div>
	</div>
{/if}
