<script lang="ts">
	import { Map } from 'lucide-svelte';
</script>

<button
	class="fixed top-4 right-4 z-30 flex items-center gap-2 rounded-full bg-[#FFBD14] px-5 py-3 text-[#0F0B24] font-semibold transition-transform hover:scale-105 active:scale-95"
	onclick={() => {}}
	aria-label="Voir le plan"
>
	<Map size={18} />
	<span>Plan</span>
</button>
