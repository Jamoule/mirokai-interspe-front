<script lang="ts">
	import { fade } from 'svelte/transition';

	let { imageUrls }: { imageUrls: string[] } = $props();
</script>

{#if imageUrls && imageUrls.length > 0}
	<div
		class="fixed inset-0 z-10"
		transition:fade={{ duration: 600 }}
	>
		<div
			class="absolute inset-0 bg-cover bg-center bg-no-repeat"
			style="background-image: url('{imageUrls[0]}')"
		></div>
		<div class="absolute inset-0 bg-[#0F0B24]/45"></div>
	</div>
{/if}
