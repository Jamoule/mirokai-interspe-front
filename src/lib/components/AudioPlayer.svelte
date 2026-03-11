<script lang="ts">
	import { Play, Pause } from 'lucide-svelte';

	let { src, autoplay = true }: { src: string; autoplay?: boolean } = $props();

	let audio: HTMLAudioElement | undefined = $state();
	let playing = $state(false);

	$effect(() => {
		if (!audio || !src) return;

		audio.load();
		playing = false;

		if (autoplay) {
			audio
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
		if (!audio) return;
		if (playing) {
			audio.pause();
			playing = false;
		} else {
			audio
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

<audio bind:this={audio} {src} onended={() => (playing = false)}></audio>

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
