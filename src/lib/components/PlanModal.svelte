<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { visitorApi } from '$lib/visitor-api';
	import type { Module, Settings } from '$lib/api';
	import { X } from 'lucide-svelte';

	let {
		completedIds,
		onClose
	}: {
		completedIds: string[];
		onClose: () => void;
	} = $props();

	let modules = $state<Module[]>([]);
	let settings = $state<Settings | null>(null);
	let loading = $state(true);

	onMount(async () => {
		try {
			[modules, settings] = await Promise.all([
				visitorApi.getModules(),
				visitorApi.getSettings().catch(() => null) as Promise<Settings | null>
			]);
		} catch {
			modules = [];
		}
		loading = false;
	});

	function navigate(qr_code: string) {
		goto('/module/' + qr_code);
		onClose();
	}
</script>

<div class="fixed inset-0 z-50">
	{#if settings?.plan_image_url}
		<div
			class="absolute inset-0 bg-cover bg-center bg-no-repeat"
			style="background-image: url('{settings.plan_image_url}')"
		></div>
		<div class="absolute inset-0 bg-[#0F0B24]/60"></div>
	{:else}
		<div class="absolute inset-0 bg-[#0F0B24]"></div>
	{/if}

	<button
		onclick={onClose}
		class="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
		aria-label="Fermer"
	>
		<X size={20} />
	</button>

	{#if loading}
		<div class="absolute inset-0 flex items-center justify-center">
			<div class="w-10 h-10 rounded-full border-4 border-[#3995FF] border-t-transparent animate-spin"></div>
		</div>
	{:else}
		<div class="relative h-full w-full">
			{#each modules.filter((m) => m.is_active) as mod}
				<button
					onclick={() => navigate(mod.qr_code)}
					class="absolute flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 -translate-x-1/2 -translate-y-1/2 group"
					style="left: {mod.position_x}%; top: {mod.position_y}%; background: {completedIds.includes(mod.id) ? '#22c55e' : '#3995FF'};"
					title={mod.name}
				>
					{#if completedIds.includes(mod.id)}
						<span class="text-white text-xs font-bold">✓</span>
					{:else}
						<span class="text-white text-xs font-bold">{mod.number}</span>
					{/if}
					<div
						class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
						style="background: rgba(15,11,36,0.9);"
					>
						{mod.name}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
