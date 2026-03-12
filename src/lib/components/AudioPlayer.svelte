<script lang="ts">
	import { Play, Pause } from 'lucide-svelte';
	import type { TranscriptSegment } from '$lib/api';

	let {
		src,
		autoplay = true,
		onEnded,
		segments = [],
		onPlayingChange
	}: {
		src: string;
		autoplay?: boolean;
		onEnded?: () => void;
		segments?: TranscriptSegment[];
		onPlayingChange?: (playing: boolean) => void;
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
				.then(() => { playing = true; onPlayingChange?.(true); })
				.catch(() => { playing = false; onPlayingChange?.(false); });
		}
	});

	function toggle() {
		if (!media) return;
		if (playing) {
			media.pause();
			playing = false;
			onPlayingChange?.(false);
		} else {
			media
				.play()
				.then(() => { playing = true; onPlayingChange?.(true); })
				.catch(() => { playing = false; onPlayingChange?.(false); });
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
	playsinline
	webkit-playsinline
	onended={() => { playing = false; onPlayingChange?.(false); onEnded?.(); }}
	ontimeupdate={() => { currentTime = media?.currentTime ?? 0; }}
	style="position: absolute; width: 0; height: 0; opacity: 0; pointer-events: none;"
></video>

{#if playing && scrollMode && segments.length > 0}
	<!-- Mode scroll : timestamps absents, navigation manuelle entre répliques -->
	{@const seg = segments[scrollIdx]}
	<div class="fixed bottom-28 left-0 right-0 z-25 flex flex-col items-center gap-3 px-5 pointer-events-none">
		<!-- Navigation -->
		<div class="flex items-center gap-3 pointer-events-auto">
			<button
				onclick={prevSegment}
				disabled={scrollIdx === 0}
				class="flex size-8 items-center justify-center rounded-full text-white/60 disabled:opacity-20 transition-opacity"
				style="background: rgba(17, 35, 97, 0.6);"
				aria-label="Réplique précédente"
			>
				‹
			</button>
			<span class="font-body text-sm text-white/40">{scrollIdx + 1} / {segments.length}</span>
			<button
				onclick={nextSegment}
				disabled={scrollIdx === segments.length - 1}
				class="flex size-8 items-center justify-center rounded-full text-white/60 disabled:opacity-20 transition-opacity"
				style="background: rgba(17, 35, 97, 0.6);"
				aria-label="Réplique suivante"
			>
				›
			</button>
		</div>
		<!-- Réplique -->
		<div class="w-[320px] rounded-[21px] p-4" style="background: rgba(17, 35, 97, 0.8);">
			<p class="font-body text-xl leading-[30px] text-white">{seg.text}</p>
		</div>
	</div>
{:else if playing && currentSegment}
	<!-- Mode sync : affichage calé sur les timestamps -->
	<div class="fixed bottom-28 left-1/2 -translate-x-1/2 z-25 pointer-events-none px-5">
		<div class="w-[320px] rounded-[21px] p-4" style="background: rgba(17, 35, 97, 0.8);">
			<p class="font-body text-xl leading-[30px] text-white">{currentSegment.text}</p>
		</div>
	</div>
{/if}

<!-- Bouton lecture -->
<div class="fixed bottom-8 left-5 z-25">
	<button
		onclick={toggle}
		class="flex size-[52px] items-center justify-center rounded-lg border border-[#dad1d6] bg-purple shadow-lg transition-transform hover:scale-110 active:scale-95"
		aria-label={playing ? 'Pause' : 'Lecture'}
	>
		{#if playing}
			<Pause size={24} color="white" />
		{:else}
			<Play size={24} color="white" />
		{/if}
	</button>
</div>
