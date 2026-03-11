<script lang="ts">
	import { Play, Pause } from 'lucide-svelte';
	import type { TranscriptSegment } from '$lib/api';

	let {
		src,
		autoplay = true,
		onEnded,
		segments = []
	}: {
		src: string;
		autoplay?: boolean;
		onEnded?: () => void;
		segments?: TranscriptSegment[];
	} = $props();

	let media: HTMLVideoElement | undefined = $state();
	let playing = $state(false);
	let currentTime = $state(0);

	// Mode scroll : les timestamps ne sont pas renseignés (start === end === 0)
	let scrollMode = $derived(segments.length > 0 && segments.every((s) => s.start === 0 && s.end === 0));

	// Mode sync : trouver le segment actif selon currentTime
	let currentSegment = $derived(
		!scrollMode ? (segments.find((s) => currentTime >= s.start && currentTime < s.end) ?? null) : null
	);

	// Mode scroll : index du segment affiché (avance au clic ou cyclique)
	let scrollIdx = $state(0);

	$effect(() => {
		if (!media || !src) return;
		media.load();
		playing = false;
		currentTime = 0;
		scrollIdx = 0;
		if (autoplay) {
			media
				.play()
				.then(() => { playing = true; })
				.catch(() => { playing = false; });
		}
	});

	function toggle() {
		if (!media) return;
		if (playing) {
			media.pause();
			playing = false;
		} else {
			media
				.play()
				.then(() => { playing = true; })
				.catch(() => { playing = false; });
		}
	}

	function nextSegment() {
		if (scrollIdx < segments.length - 1) scrollIdx++;
	}

	function prevSegment() {
		if (scrollIdx > 0) scrollIdx--;
	}

	const speakerColor = (speaker: string) => speaker === 'Voix 1' ? '#3995FF' : '#FFBD14';
</script>

<!-- video élément caché : supporte les MP4 et déclenche ended de façon fiable -->
<video
	bind:this={media}
	{src}
	onended={() => { playing = false; onEnded?.(); }}
	ontimeupdate={() => { currentTime = media?.currentTime ?? 0; }}
	style="position: absolute; width: 0; height: 0; opacity: 0; pointer-events: none;"
></video>

{#if scrollMode && segments.length > 0}
	<!-- Mode scroll : timestamps absents, navigation manuelle entre répliques -->
	{@const seg = segments[scrollIdx]}
	<div class="fixed bottom-28 left-0 right-0 z-25 flex flex-col items-center gap-2 px-4 pointer-events-none">
		<!-- Navigation -->
		<div class="flex items-center gap-3 pointer-events-auto">
			<button
				onclick={prevSegment}
				disabled={scrollIdx === 0}
				class="w-8 h-8 rounded-full flex items-center justify-center text-white/60 disabled:opacity-20 transition-opacity"
				style="background: rgba(15,11,36,0.6);"
				aria-label="Réplique précédente"
			>
				‹
			</button>
			<span class="text-white/40 text-xs">{scrollIdx + 1} / {segments.length}</span>
			<button
				onclick={nextSegment}
				disabled={scrollIdx === segments.length - 1}
				class="w-8 h-8 rounded-full flex items-center justify-center text-white/60 disabled:opacity-20 transition-opacity"
				style="background: rgba(15,11,36,0.6);"
				aria-label="Réplique suivante"
			>
				›
			</button>
		</div>
		<!-- Réplique -->
		<div
			class="w-[min(90vw,34rem)] rounded-2xl px-5 py-3 text-center"
			style="background: rgba(15,11,36,0.82); backdrop-filter: blur(6px);"
		>
			<div class="text-xs font-semibold mb-1" style="color: {speakerColor(seg.speaker)};">
				{seg.speaker}
			</div>
			<p class="text-white text-sm leading-relaxed">{seg.text}</p>
		</div>
	</div>
{:else if currentSegment}
	<!-- Mode sync : affichage calé sur les timestamps -->
	<div class="fixed bottom-28 left-1/2 -translate-x-1/2 z-25 w-[min(90vw,34rem)] text-center pointer-events-none">
		<div
			class="rounded-2xl px-5 py-3"
			style="background: rgba(15,11,36,0.82); backdrop-filter: blur(6px);"
		>
			<div class="text-xs font-semibold mb-1" style="color: {speakerColor(currentSegment.speaker)};">
				{currentSegment.speaker}
			</div>
			<p class="text-white text-sm leading-relaxed">{currentSegment.text}</p>
		</div>
	</div>
{/if}

<!-- Bouton lecture -->
<div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-25">
	<button
		onclick={toggle}
		class="flex items-center justify-center w-16 h-16 rounded-full bg-[#FFBD14] text-[#0F0B24] shadow-lg transition-transform hover:scale-110 active:scale-95"
		aria-label={playing ? 'Pause' : 'Lecture'}
	>
		{#if playing}
			<Pause size={28} />
		{:else}
			<Play size={28} />
		{/if}
	</button>
</div>
