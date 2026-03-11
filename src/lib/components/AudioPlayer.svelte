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

	let currentSegment = $derived(
		segments.find((s) => currentTime >= s.start && currentTime < s.end) ?? null
	);

	$effect(() => {
		if (!media || !src) return;

		media.load();
		playing = false;
		currentTime = 0;

		if (autoplay) {
			media
				.play()
				.then(() => {
					playing = true;
				})
				.catch(() => {
					playing = false;
				});
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
				.then(() => {
					playing = true;
				})
				.catch(() => {
					playing = false;
				});
		}
	}
</script>

<!-- video élément caché : supporte les MP4 et déclenche ended de façon fiable -->
<video
	bind:this={media}
	{src}
	onended={() => {
		playing = false;
		onEnded?.();
	}}
	ontimeupdate={() => {
		currentTime = media?.currentTime ?? 0;
	}}
	style="position: absolute; width: 0; height: 0; opacity: 0; pointer-events: none;"
></video>

<!-- Sous-titres -->
{#if currentSegment}
	<div class="fixed bottom-28 left-1/2 -translate-x-1/2 z-25 w-[min(90vw,34rem)] text-center pointer-events-none">
		<div
			class="rounded-2xl px-5 py-3"
			style="background: rgba(15,11,36,0.82); backdrop-filter: blur(6px);"
		>
			<div
				class="text-xs font-semibold mb-1"
				style="color: {currentSegment.speaker === 'Voix 1' ? '#3995FF' : '#FFBD14'};"
			>
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
