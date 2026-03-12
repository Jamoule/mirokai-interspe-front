<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { visitorApi, resolveMediaUrl } from '$lib/visitor-api';
	import type { Module } from '$lib/api';
	import { X } from 'lucide-svelte';

	let {
		completedIds,
		currentModuleId = '',
		onClose
	}: {
		completedIds: string[];
		currentModuleId?: string;
		onClose: () => void;
	} = $props();

	let modules = $state<Module[]>([]);
	let planImageUrl = $state('');
	let loading = $state(true);

	// Pan & zoom state
	let scale = $state(1);
	let tx = $state(0);
	let ty = $state(0);
	let isAnimating = $state(false);

	const MIN_SCALE = 1;
	const MAX_SCALE = 4;

	let activePointers = new Map<number, { x: number; y: number }>();
	let lastPinchDist = 0;
	let containerEl = $state<HTMLDivElement | null>(null);

	// Double-tap detection
	let lastTapTime = 0;

	// Zoom indicator
	let showZoomBadge = $state(false);
	let zoomBadgeTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(async () => {
		try {
			const [mods, settings] = await Promise.all([
				visitorApi.getModules(),
				visitorApi.getSettings().catch(() => null)
			]);
			modules = mods;
			planImageUrl = resolveMediaUrl(settings?.plan_image_url);
		} catch {
			modules = [];
		}
		loading = false;
	});

	function navigate(qr_code: string) {
		goto('/module/' + qr_code);
		onClose();
	}

	// Converts pixel coordinates (1000×700 reference) to percentages
	function px(x: number, ref: number) {
		return `${(x / ref) * 100}%`;
	}

	function clamp(val: number, min: number, max: number) {
		return Math.min(max, Math.max(min, val));
	}

	function clampTranslation(newTx: number, newTy: number, newScale: number) {
		if (!containerEl) return { tx: newTx, ty: newTy };
		const W = containerEl.clientWidth;
		const H = containerEl.clientHeight;
		return {
			tx: clamp(newTx, W * (1 - newScale), 0),
			ty: clamp(newTy, H * (1 - newScale), 0)
		};
	}

	function resetView() {
		isAnimating = true;
		scale = 1;
		tx = 0;
		ty = 0;
		setTimeout(() => (isAnimating = false), 250);
	}

	function showZoom() {
		if (scale <= 1) {
			showZoomBadge = false;
			return;
		}
		showZoomBadge = true;
		if (zoomBadgeTimer) clearTimeout(zoomBadgeTimer);
		zoomBadgeTimer = setTimeout(() => (showZoomBadge = false), 1500);
	}

	function getPinchDist(a: { x: number; y: number }, b: { x: number; y: number }) {
		return Math.hypot(a.x - b.x, a.y - b.y);
	}

	function handlePointerDown(e: PointerEvent) {
		// Double-tap detection (only for single pointer)
		if (activePointers.size === 0) {
			const now = Date.now();
			if (now - lastTapTime < 300) {
				resetView();
				lastTapTime = 0;
				return;
			}
			lastTapTime = now;
		}

		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (activePointers.size === 2) {
			const [a, b] = [...activePointers.values()];
			lastPinchDist = getPinchDist(a, b);
		}
	}

	function handlePointerMove(e: PointerEvent) {
		if (!activePointers.has(e.pointerId)) return;

		const prev = activePointers.get(e.pointerId)!;
		activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (activePointers.size === 1) {
			// Pan
			const dx = e.clientX - prev.x;
			const dy = e.clientY - prev.y;
			const clamped = clampTranslation(tx + dx, ty + dy, scale);
			tx = clamped.tx;
			ty = clamped.ty;
		} else if (activePointers.size === 2) {
			// Pinch-to-zoom
			const [a, b] = [...activePointers.values()];
			const dist = getPinchDist(a, b);
			if (lastPinchDist === 0) {
				lastPinchDist = dist;
				return;
			}

			const newScale = clamp(scale * (dist / lastPinchDist), MIN_SCALE, MAX_SCALE);
			lastPinchDist = dist;

			if (!containerEl) return;
			const rect = containerEl.getBoundingClientRect();
			const cx = (a.x + b.x) / 2 - rect.left;
			const cy = (a.y + b.y) / 2 - rect.top;

			const newTx = cx - (cx - tx) * (newScale / scale);
			const newTy = cy - (cy - ty) * (newScale / scale);

			scale = newScale;
			const clamped = clampTranslation(newTx, newTy, newScale);
			tx = clamped.tx;
			ty = clamped.ty;

			showZoom();
		}
	}

	function handlePointerUp(e: PointerEvent) {
		activePointers.delete(e.pointerId);
		if (activePointers.size < 2) {
			lastPinchDist = 0;
		}
	}
</script>

<!-- Backdrop -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center"
	style="background: rgba(15,11,36,0.85); backdrop-filter: blur(4px);"
>
	<!-- Close -->
	<button
		onclick={onClose}
		class="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full transition-colors"
		style="background: rgba(255,255,255,0.15); color: white;"
		aria-label="Fermer"
	>
		<X size={20} />
	</button>

	{#if loading}
		<div class="w-10 h-10 rounded-full border-4 border-[#3995FF] border-t-transparent animate-spin"></div>
	{:else}
		<!--
			Plan container: fills viewport while keeping 1000:700 ratio.
			Markers use % derived from (position_x / 1000) and (position_y / 700)
			so they align perfectly with the admin editor reference space.
		-->
		<div
			bind:this={containerEl}
			class="relative overflow-hidden rounded-xl shadow-2xl"
			style="
				width: min(calc(100dvw - 2rem), calc((100dvh - 2rem) * 1000 / 700));
				aspect-ratio: 1000 / 700;
				touch-action: none;
				cursor: {scale > 1 ? 'grab' : 'default'};
			"
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerUp}
		>
			<!-- Transformable layer (image + markers) -->
			<div
				class="absolute inset-0 w-full h-full"
				style="
					transform: translate({tx}px, {ty}px) scale({scale});
					transform-origin: 0 0;
					will-change: transform;
					{isAnimating ? 'transition: transform 0.25s ease;' : ''}
				"
			>
				<!-- Background image -->
				{#if planImageUrl}
					<img
						src={planImageUrl}
						alt="Plan du parcours"
						draggable="false"
						class="absolute inset-0 w-full h-full"
						style="object-fit: cover; pointer-events: none; user-select: none;"
					/>
					<div class="absolute inset-0" style="background: rgba(15,11,36,0.35);"></div>
				{:else}
					<div class="absolute inset-0" style="background: #1a1540;"></div>
				{/if}

				<!-- Module markers -->
				{#each modules.filter((m) => m.is_active) as mod (mod.id)}
					{@const done = completedIds.includes(mod.id)}
					{@const isCurrent = mod.id === currentModuleId}
					<div
						class="absolute -translate-x-1/2 -translate-y-1/2 group"
						style="left: {px(mod.position_x, 1000)}; top: {px(mod.position_y, 700)}; z-index: {isCurrent ? 3 : 2}; width: 40px; height: 40px;"
					>
						{#if isCurrent}
							<div class="absolute inset-[-6px] rounded-full border-[2.5px] border-[#3995FF] animate-ping opacity-75"></div>
							<div class="absolute inset-[-6px] rounded-full border-[2.5px] border-[#3995FF]"></div>
						{/if}
						<button
							onclick={() => navigate(mod.qr_code)}
							class="w-full h-full flex items-center justify-center rounded-full font-bold shadow-lg transition-transform group-hover:scale-125 group-active:scale-95 cursor-pointer"
							style="
								background: {isCurrent ? '#3995FF' : done ? '#22c55e' : '#FFBD14'};
								color: {isCurrent || done ? 'white' : '#0F0B24'};
								border: 2.5px solid {isCurrent ? 'white' : 'rgba(255,255,255,0.6)'};
								box-shadow: 0 4px 14px rgba(0,0,0,0.5);
								font-size: 14px;
							"
							title={mod.name}
						>
							{mod.number}
						</button>
						<div
							class="absolute left-1/2 -translate-x-1/2 mt-1 rounded px-2 py-0.5 text-xs font-medium text-center whitespace-nowrap pointer-events-none {isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity"
							style="background: rgba(15,11,36,0.9); color: white; max-width: 120px; overflow: hidden; text-overflow: ellipsis;"
						>
							{mod.name}
						</div>
					</div>
				{/each}
			</div>

			<!-- Zoom badge -->
			{#if showZoomBadge}
				<div
					class="absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold pointer-events-none"
					style="background: rgba(15,11,36,0.75); color: white; z-index: 10;"
				>
					×{scale.toFixed(1)}
				</div>
			{/if}
		</div>
	{/if}
</div>
