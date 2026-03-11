<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth.svelte';
	import { Eye, EyeOff, LogIn } from 'lucide-svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');
	let showPassword = $state(false);

	// Redirect if already authenticated
	$effect(() => {
		if (auth.initialized && auth.isAuthenticated) {
			goto('/admin/modules');
		}
	});

	async function handleLogin(e: Event) {
		e.preventDefault();
		if (!email || !password) {
			error = 'Veuillez remplir tous les champs.';
			return;
		}
		loading = true;
		error = '';
		try {
			await auth.login(email, password);
			goto('/admin/modules');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur de connexion';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Connexion — Mirokaï Admin</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center px-4"
	style="background: linear-gradient(135deg, #0F0B24 0%, #1A1337 50%, #1D3AA2 100%)"
>
	<!-- Decorative background circles -->
	<div
		class="absolute inset-0 overflow-hidden pointer-events-none"
		aria-hidden="true"
	>
		<div
			class="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-10"
			style="background: radial-gradient(circle, #3995FF, transparent)"
		></div>
		<div
			class="absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-10"
			style="background: radial-gradient(circle, #1D3AA2, transparent)"
		></div>
	</div>

	<div class="relative w-full max-w-sm">
		<!-- Card -->
		<div
			class="rounded-2xl border p-8"
			style="background-color: #1a1540; border-color: #3995ff22; box-shadow: 0 25px 50px rgba(0,0,0,0.5)"
		>
			<!-- Header -->
			<div class="mb-8 text-center">
				<div
					class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold"
					style="background: linear-gradient(135deg, #1D3AA2, #3995FF)"
				>
					M
				</div>
				<h1 class="text-2xl font-bold tracking-widest text-white">MIROKAÏ</h1>
				<p class="mt-1 text-sm" style="color: #3995ff88">Administration</p>
			</div>

			<!-- Form -->
			<form onsubmit={handleLogin} class="flex flex-col gap-4">
				<!-- Error -->
				{#if error}
					<div
						class="rounded-lg border px-4 py-3 text-sm"
						style="background-color: #ff444420; border-color: #ff444440; color: #ff7777"
					>
						{error}
					</div>
				{/if}

				<!-- Email -->
				<div class="flex flex-col gap-1.5">
					<label for="email" class="text-sm font-medium" style="color: #94a3b8">
						Adresse e-mail
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="admin@mirokai.fr"
						autocomplete="email"
						disabled={loading}
						class="w-full rounded-lg border px-4 py-2.5 text-sm text-white outline-none transition-all"
						style="background-color: #221c4a; border-color: #3995ff33;"
						onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
						onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
					/>
				</div>

				<!-- Password -->
				<div class="flex flex-col gap-1.5">
					<label for="password" class="text-sm font-medium" style="color: #94a3b8">
						Mot de passe
					</label>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="••••••••"
							autocomplete="current-password"
							disabled={loading}
							class="w-full rounded-lg border px-4 py-2.5 pr-10 text-sm text-white outline-none transition-all"
							style="background-color: #221c4a; border-color: #3995ff33;"
							onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
							onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3 top-1/2 -translate-y-1/2"
							style="color: #3995ff88"
						>
							{#if showPassword}
								<EyeOff size={16} />
							{:else}
								<Eye size={16} />
							{/if}
						</button>
					</div>
				</div>

				<!-- Submit -->
				<button
					type="submit"
					disabled={loading}
					class="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200"
					style="background-color: #FFBD14; color: #0F0B24; opacity: {loading ? '0.7' : '1'}; cursor: {loading ? 'not-allowed' : 'pointer'};"
					onmouseover={(e) => {
						if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#ffd14f';
					}}
					onfocus={(e) => {
						if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#ffd14f';
					}}
					onmouseout={(e) => {
						(e.currentTarget as HTMLElement).style.backgroundColor = '#FFBD14';
					}}
					onblur={(e) => {
						(e.currentTarget as HTMLElement).style.backgroundColor = '#FFBD14';
					}}
				>
					{#if loading}
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></div>
						Connexion en cours...
					{:else}
						<LogIn size={16} />
						Se connecter
					{/if}
				</button>
			</form>
		</div>
	</div>
</div>
