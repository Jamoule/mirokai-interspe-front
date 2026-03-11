<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { api, type Module } from '$lib/api';
	import { Save, Upload } from 'lucide-svelte';

	const CONTAINER_W = 1000;
	const CONTAINER_H = 700;
	const BASE = 'http://localhost:5000';

	function resolveUrl(url: string | null | undefined): string {
		if (!url) return '';
		if (url.startsWith('http://') || url.startsWith('https://')) return url;
		return BASE + (url.startsWith('/') ? '' : '/') + url;
	}

	let modules = $state<Module[]>([]);
	let positions = $state<Record<string, { x: number; y: number }>>({});
	let planImageUrl = $state('');
	let loading = $state(true);
	let saving = $state(false);
	let uploadingPlan = $state(false);

	onMount(async () => {
		try {
			const [settings, mods] = await Promise.all([api.getSettings(), api.getModules()]);
			planImageUrl = settings.plan_image_url ?? '';
			modules = mods;
			for (const m of mods) {
				positions[m.id] = { x: m.position_x ?? 0, y: m.position_y ?? 0 };
			}
		} catch (err) {
			toast.error('Erreur lors du chargement');
		} finally {
			loading = false;
		}
	});

	// --- Drag & drop ---
	let containerEl: HTMLDivElement | undefined = $state();
	let dragging: { id: string; offsetX: number; offsetY: number } | null = $state(null);

	function onMarkerPointerDown(e: PointerEvent, moduleId: string) {
		e.preventDefault();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		const rect = containerEl!.getBoundingClientRect();
		const pos = positions[moduleId];
		dragging = {
			id: moduleId,
			offsetX: e.clientX - rect.left - pos.x,
			offsetY: e.clientY - rect.top - pos.y
		};
	}

	function onContainerPointerMove(e: PointerEvent) {
		if (!dragging || !containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		const x = Math.max(0, Math.min(CONTAINER_W, e.clientX - rect.left - dragging.offsetX));
		const y = Math.max(0, Math.min(CONTAINER_H, e.clientY - rect.top - dragging.offsetY));
		positions[dragging.id] = { x, y };
	}

	function onContainerPointerUp() {
		dragging = null;
	}

	// --- Save positions ---
	async function handleSave() {
		saving = true;
		try {
			const payload = modules.map((m) => ({
				id: m.id,
				position_x: positions[m.id]?.x ?? 0,
				position_y: positions[m.id]?.y ?? 0
			}));
			await api.updatePositions(payload);
			toast.success('Positions sauvegardées');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur de sauvegarde');
		} finally {
			saving = false;
		}
	}

	// --- Upload plan image ---
	async function handlePlanUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploadingPlan = true;
		try {
			const result = await api.upload(file, 'plans');
			await api.updateSettings({ plan_image_url: result.url });
			planImageUrl = result.url;
			toast.success('Image du plan mise à jour');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur upload');
		} finally {
			uploadingPlan = false;
			input.value = '';
		}
	}
</script>

<svelte:head>
	<title>Plan d'exposition — Mirokaï Admin</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-white">Plan d'exposition</h1>
			<p class="mt-1 text-sm" style="color: #94a3b8">
				Positionnez les modules en les faisant glisser sur le plan
			</p>
		</div>
		<div class="flex items-center gap-3">
			<!-- Upload image du plan -->
			<label
				class="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
				style="border-color: #3995ff33; color: #3995FF; background-color: #3995ff10;"
			>
				{#if uploadingPlan}
					<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
					Upload...
				{:else}
					<Upload size={15} />
					Changer l'image du plan
				{/if}
				<input
					type="file"
					accept="image/*"
					class="hidden"
					onchange={handlePlanUpload}
					disabled={uploadingPlan}
				/>
			</label>

			<!-- Save -->
			<button
				onclick={handleSave}
				disabled={saving || loading}
				class="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all"
				style="background-color: #FFBD14; color: #0F0B24; opacity: {saving ? '0.7' : '1'}"
				onmouseover={(e) => { if (!saving) (e.currentTarget as HTMLElement).style.backgroundColor = '#ffd14f'; }}
				onmouseout={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FFBD14'; }}
			>
				{#if saving}
					<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
					Sauvegarde...
				{:else}
					<Save size={15} />
					Sauvegarder le plan
				{/if}
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="h-8 w-8 animate-spin rounded-full border-4" style="border-color: #3995FF; border-top-color: transparent"></div>
		</div>
	{:else}
		<!-- Plan canvas wrapper (scrollable if viewport too small) -->
		<div
			class="rounded-xl border overflow-auto"
			style="background-color: #1a1540; border-color: #3995ff22;"
		>
			<!-- Fixed-size canvas -->
			<div
				bind:this={containerEl}
				class="relative select-none"
				style="width: {CONTAINER_W}px; height: {CONTAINER_H}px; cursor: {dragging ? 'grabbing' : 'default'};"
				onpointermove={onContainerPointerMove}
				onpointerup={onContainerPointerUp}
				onpointerleave={onContainerPointerUp}
			>
				<!-- Background image -->
				{#if planImageUrl}
					<img
						src={resolveUrl(planImageUrl)}
						alt="Plan du parcours"
						class="absolute inset-0 h-full w-full"
						style="object-fit: contain; object-position: center; pointer-events: none;"
						draggable="false"
					/>
				{:else}
					<div class="absolute inset-0 flex items-center justify-center">
						<div class="text-center" style="color: #94a3b840">
							<div class="text-6xl mb-3">🗺️</div>
							<p class="text-sm">Aucune image de plan — utilisez le bouton "Changer l'image du plan"</p>
						</div>
					</div>
				{/if}

				<!-- Grid overlay (subtle) -->
				<div
					class="absolute inset-0 pointer-events-none"
					style="background-image: radial-gradient(circle, #3995ff18 1px, transparent 1px); background-size: 40px 40px;"
				></div>

				<!-- Module markers -->
				{#each modules as mod (mod.id)}
					{@const pos = positions[mod.id] ?? { x: 0, y: 0 }}
					{@const isDragging = dragging?.id === mod.id}
					<div
						class="absolute flex flex-col items-center"
						style="
							left: {pos.x}px;
							top: {pos.y}px;
							transform: translate(-50%, -50%);
							cursor: grab;
							z-index: {isDragging ? 10 : 1};
							touch-action: none;
						"
						onpointerdown={(e) => onMarkerPointerDown(e, mod.id)}
					>
						<!-- Circle badge -->
						<div
							class="flex items-center justify-center rounded-full text-sm font-bold shadow-lg transition-transform"
							style="
								width: 36px;
								height: 36px;
								background: {isDragging ? '#ffd14f' : '#FFBD14'};
								color: #0F0B24;
								border: 2px solid {isDragging ? 'white' : 'rgba(255,255,255,0.4)'};
								transform: scale({isDragging ? 1.15 : 1});
								box-shadow: 0 4px 12px rgba(0,0,0,0.4);
							"
						>
							{mod.number}
						</div>
						<!-- Label -->
						<div
							class="mt-1 max-w-[100px] truncate rounded px-1.5 py-0.5 text-center text-xs font-medium"
							style="background: rgba(15,11,36,0.82); backdrop-filter: blur(4px); color: white;"
						>
							{mod.name}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Legend -->
		{#if modules.length > 0}
			<div
				class="rounded-xl border p-4"
				style="background-color: #1a1540; border-color: #3995ff22;"
			>
				<p class="mb-3 text-xs font-semibold uppercase tracking-wider" style="color: #94a3b8">
					Modules ({modules.length})
				</p>
				<div class="flex flex-wrap gap-2">
					{#each modules as mod (mod.id)}
						{@const pos = positions[mod.id] ?? { x: 0, y: 0 }}
						<div
							class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
							style="background-color: #221c4a; color: #94a3b8;"
						>
							<span
								class="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
								style="background-color: #FFBD14; color: #0F0B24;"
							>
								{mod.number}
							</span>
							<span class="text-white">{mod.name}</span>
							<span style="color: #94a3b860">
								{Math.round(pos.x)}, {Math.round(pos.y)}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
