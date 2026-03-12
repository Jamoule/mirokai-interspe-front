<script lang="ts">
	let {
		onsubmit,
		onskip
	}: {
		onsubmit: (email: string) => void;
		onskip: () => void;
	} = $props();

	let email = $state('');
	let error = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		const trimmed = email.trim();
		if (!trimmed) {
			error = 'Veuillez entrer votre e-mail';
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
			error = 'Adresse e-mail invalide';
			return;
		}
		error = '';
		onsubmit(trimmed);
	}
</script>

<div
	class="fixed inset-0 z-50 flex flex-col items-center"
	style="background: linear-gradient(245.55deg, var(--color-primary) 12.65%, #a03379 104.49%)"
>
<div class="flex h-full w-full max-w-[480px] flex-col items-center justify-between px-6 py-6">
	<!-- Logo -->
	<div class="mt-8 flex flex-col items-center">
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

	<!-- Title & description -->
	<div class="flex w-full flex-1 flex-col justify-center gap-6">
		<h1 class="font-title text-[64px] leading-[60px] font-semibold uppercase text-white">
			Bienvenue dans l'aventure Mirokai
		</h1>
		<p class="font-body text-xl leading-[30px] text-white">
			Votre aventure va bientôt commencer.
			Laissez votre e-mail pour recevoir les informations utiles
			et prolonger l'expérience après la visite.
		</p>
	</div>

	<!-- Form -->
	<form onsubmit={handleSubmit} class="flex w-full flex-col gap-6 pb-6">
		<div class="flex flex-col gap-1">
			<input
				type="email"
				bind:value={email}
				placeholder="E-mail"
				autocomplete="email"
				class="font-body h-[53px] w-full rounded-full border border-[#dad1d6] bg-transparent px-8 py-4 text-lg text-white placeholder-[#dad1d6] outline-none transition-colors focus:border-white"
			/>
			{#if error}
				<span class="px-8 text-sm text-red-300">{error}</span>
			{/if}
		</div>

		<button
			type="submit"
			class="font-body h-[53px] w-full rounded-full border border-[#dad1d6] bg-purple text-lg text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
		>
			Lancer l'aventure
		</button>

		<button
			type="button"
			onclick={onskip}
			class="font-body text-base text-white/60 underline underline-offset-2 transition-colors hover:text-white/80"
		>
			Passer cette étape
		</button>
	</form>
</div>
</div>
