<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { visitor } from '$lib/visitor.svelte';
	import EmailCaptureOverlay from '$lib/components/EmailCaptureOverlay.svelte';
	import AgeSelectionOverlay from '$lib/components/AgeSelectionOverlay.svelte';
	import PlanModal from '$lib/components/PlanModal.svelte';
	import type { AgeGroup } from '$lib/visitor.svelte';

	let { data } = $props();
	let settings = $derived(data.settings ?? null);

	type PagePhase = 'intro' | 'hub';
	let phase = $state<PagePhase>('intro');
	const INTRO_DURATION_MS = 5000;
	const INTRO_BACKGROUND_URL = 'https://www.figma.com/api/mcp/asset/2c62beb6-cec2-47a7-a337-2ca4e499fa29';
	const INTRO_CHARACTER_URL = 'https://www.figma.com/api/mcp/asset/4fe1d640-e86d-4720-bf88-73b6dc997935';
	let introTimer: ReturnType<typeof setTimeout> | null = null;

	let showEmail = $state(false);
	let showAge = $state(false);
	let showPlan = $state(false);
	let forceAgeAfterEmail = $state(false);

	function clearIntroTimer() {
		if (introTimer) {
			clearTimeout(introTimer);
			introTimer = null;
		}
	}

	function startIntroIfReady() {
		if (phase !== 'intro' || showEmail || showAge || visitor.introDone || introTimer) {
			return;
		}

		introTimer = setTimeout(() => {
			visitor.markIntroDone();
			phase = 'hub';
			introTimer = null;
		}, INTRO_DURATION_MS);
	}

	onMount(() => {
		visitor.init();

		if (!visitor.hasEmail) {
			showEmail = true;
			forceAgeAfterEmail = true;
		} else if (!visitor.hasAge) {
			showAge = true;
		} else if (visitor.introDone) {
			phase = 'hub';
		}

		startIntroIfReady();
	});

	onDestroy(() => {
		clearIntroTimer();
	});

	function advanceAfterOnboarding() {
		if (visitor.introDone) {
			phase = 'hub';
			clearIntroTimer();
			return;
		}

		phase = 'intro';
		startIntroIfReady();
	}

	function handleEmailSubmit(email: string) {
		clearIntroTimer();
		visitor.setEmail(email);
		showEmail = false;
		if (forceAgeAfterEmail || !visitor.hasAge) {
			forceAgeAfterEmail = false;
			showAge = true;
		} else {
			advanceAfterOnboarding();
		}
	}

	function handleEmailSkip() {
		clearIntroTimer();
		visitor.skipEmail();
		showEmail = false;
		if (forceAgeAfterEmail || !visitor.hasAge) {
			forceAgeAfterEmail = false;
			showAge = true;
		} else {
			advanceAfterOnboarding();
		}
	}

	function handleAgeSelect(group: AgeGroup) {
		visitor.setAge(group);
		showAge = false;
		advanceAfterOnboarding();
	}
</script>

{#if phase === 'intro'}
	<div class="relative flex h-dvh w-full justify-center overflow-hidden bg-surface">
		<img
			src={INTRO_BACKGROUND_URL}
			alt=""
			class="pointer-events-none absolute inset-0 h-full w-full object-cover"
			draggable="false"
		/>
		<div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-black/10"></div>

		<div class="relative z-10 flex h-full w-full max-w-[390px] flex-col items-center">
			<div class="mt-[98px] flex flex-col items-center">
				<div class="flex h-[69px] w-[168px] flex-col items-center justify-between">
					<img
						src="/images/logo-icon.svg"
						alt=""
						class="h-[30px] w-[26px]"
						draggable="false"
					/>
					<img
						src="/images/logo-text.svg"
						alt="Enchanted Tools"
						class="h-[33px] w-[113px]"
						draggable="false"
					/>
				</div>
			</div>

			<div class="flex min-h-0 flex-1 items-end justify-center">
				<img
					src={INTRO_CHARACTER_URL}
					alt="Miroki"
					class="pointer-events-none h-[467px] w-[228px] object-contain"
					draggable="false"
				/>
			</div>

			<div class="mx-[19px] mb-[22px] rounded-[21px] bg-[#112361cc] p-4">
				<p class="font-body w-[320px] text-xl leading-[30px] text-white">
					Bien le bonjour à toi voyageur, je m'appelle Miroki.
				</p>
			</div>
		</div>
	</div>
{:else}
	<!-- Vue 4 — Hub principal -->
	<div
		class="relative flex h-dvh w-full items-center justify-center overflow-hidden"
		style="background: linear-gradient(180deg, rgba(102,102,102,0.06) 0%, rgba(0,0,0,0.06) 100%), linear-gradient(245.55deg, var(--color-primary) 12.65%, #a03379 104.49%)"
	>
		<!-- Background landscape -->
		<img
			src="/images/background-landscape.jpg"
			alt=""
			class="pointer-events-none absolute inset-0 h-full w-full object-cover"
			draggable="false"
		/>

		<!-- Inner wrapper -->
		<div class="relative z-10 flex h-full w-full max-w-[480px] flex-col items-center px-6">
			<!-- Header bar -->
			<header
				class="mt-14 flex w-full max-w-[342px] items-center justify-between rounded-full px-4 py-2"
				style="background: rgba(180, 180, 180, 0.43); box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);"
			>
				<span class="font-body flex-1 text-xl leading-[30px] font-bold text-purple">
					Prologue
				</span>
				<button
					onclick={() => (showPlan = true)}
					class="flex size-[52px] shrink-0 items-center justify-center rounded-lg border border-[#dad1d6] bg-purple"
					aria-label="Ouvrir le plan"
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path opacity="0.2" d="M15 6.75V20.25L9 17.25V3.75L15 6.75Z" fill="white"/>
						<path d="M21.4612 4.65844C21.3714 4.58843 21.2668 4.53981 21.1554 4.51626C21.0439 4.4927 20.9286 4.49484 20.8181 4.5225L15.0872 5.955L9.33563 3.07875C9.17537 2.99882 8.99181 2.97887 8.81812 3.0225L2.81812 4.5225C2.65587 4.56306 2.51183 4.65668 2.40889 4.7885C2.30595 4.92031 2.25003 5.08275 2.25 5.25V18.75C2.25002 18.864 2.27601 18.9764 2.32599 19.0788C2.37598 19.1813 2.44864 19.2709 2.53847 19.3411C2.62831 19.4112 2.73294 19.4599 2.84442 19.4836C2.95591 19.5072 3.07131 19.5051 3.18187 19.4775L8.91281 18.045L14.6644 20.9213C14.7688 20.9727 14.8836 20.9997 15 21C15.0613 21 15.1224 20.9924 15.1819 20.9775L21.1819 19.4775C21.3441 19.4369 21.4882 19.3433 21.5911 19.2115C21.694 19.0797 21.75 18.9172 21.75 18.75V5.25C21.75 5.13593 21.724 5.02336 21.674 4.92085C21.624 4.81834 21.5512 4.72859 21.4612 4.65844ZM9.75 4.96312L14.25 7.21312V19.0369L9.75 16.7869V4.96312ZM3.75 5.83594L8.25 4.71094V16.6641L3.75 17.7891V5.83594ZM20.25 18.1641L15.75 19.2891V7.33594L20.25 6.21094V18.1641Z" fill="white"/>
					</svg>
				</button>
			</header>

			<!-- Central content: character + speech bubble -->
			<div class="flex flex-1 flex-col items-center justify-center gap-6">
				<img
					src="/images/miroki-character.jpg"
					alt="Miroki"
					class="pointer-events-none h-[353px] w-[182px] object-contain"
					draggable="false"
				/>

				<div class="rounded-[21px] p-4" style="background: rgba(17, 35, 97, 0.8);">
					<p class="font-body w-[320px] text-xl leading-[30px] text-white">
						Bien le bonjour à toi voyageur, je m'appelle Miroki.
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showEmail}
	<EmailCaptureOverlay onsubmit={handleEmailSubmit} onskip={handleEmailSkip} />
{/if}

{#if showAge}
	<AgeSelectionOverlay onselect={handleAgeSelect} />
{/if}

{#if showPlan}
	<PlanModal completedIds={visitor.completedModules} onClose={() => (showPlan = false)} />
{/if}
