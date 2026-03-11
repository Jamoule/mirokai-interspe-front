<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api, type Module, type Question } from '$lib/api';
	import { Boxes, CheckCircle, HelpCircle, Settings, ArrowRight, Activity } from 'lucide-svelte';

	let modules = $state<Module[]>([]);
	let totalQuestions = $state(0);
	let loading = $state(true);

	onMount(async () => {
		try {
			modules = await api.getModules();
			// Fetch question counts per module
			let questionTotal = 0;
			await Promise.all(
				modules.map(async (m) => {
					try {
						const qs = await api.getQuestionsAll(m.id);
						questionTotal += qs.length;
					} catch {
						// ignore
					}
				})
			);
			totalQuestions = questionTotal;
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	});

	const activeModules = $derived(modules.filter((m) => m.is_active).length);
	const modulesWithQuiz = $derived(modules.filter((m) => m.has_quiz).length);
</script>

<svelte:head>
	<title>Tableau de bord — Mirokaï Admin</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-white">Tableau de bord</h1>
			<p class="mt-1 text-sm" style="color: #94a3b8">Vue d'ensemble du parcours Mirokaï</p>
		</div>
		<a
			href="/admin/modules"
			class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
			style="background-color: #FFBD14; color: #0F0B24"
		>
			Gérer les modules
			<ArrowRight size={16} />
		</a>
	</div>

	<!-- Stats cards -->
	{#if loading}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each [1, 2, 3, 4] as _}
				<div
					class="animate-pulse rounded-xl border p-6"
					style="background-color: #1a1540; border-color: #3995ff22; height: 120px;"
				></div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Total modules -->
			<div
				class="rounded-xl border p-6 transition-all"
				style="background-color: #1a1540; border-color: #3995ff22;"
			>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm" style="color: #94a3b8">Total modules</p>
						<p class="mt-2 text-3xl font-bold text-white">{modules.length}</p>
					</div>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-xl"
						style="background-color: #1D3AA230"
					>
						<Boxes size={22} style="color: #3995FF" />
					</div>
				</div>
			</div>

			<!-- Active modules -->
			<div
				class="rounded-xl border p-6 transition-all"
				style="background-color: #1a1540; border-color: #3995ff22;"
			>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm" style="color: #94a3b8">Modules actifs</p>
						<p class="mt-2 text-3xl font-bold text-white">{activeModules}</p>
					</div>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-xl"
						style="background-color: #16a34a20"
					>
						<CheckCircle size={22} style="color: #4ade80" />
					</div>
				</div>
			</div>

			<!-- Total questions -->
			<div
				class="rounded-xl border p-6 transition-all"
				style="background-color: #1a1540; border-color: #3995ff22;"
			>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm" style="color: #94a3b8">Total questions</p>
						<p class="mt-2 text-3xl font-bold text-white">{totalQuestions}</p>
					</div>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-xl"
						style="background-color: #FFBD1420"
					>
						<HelpCircle size={22} style="color: #FFBD14" />
					</div>
				</div>
			</div>

			<!-- Modules with quiz -->
			<div
				class="rounded-xl border p-6 transition-all"
				style="background-color: #1a1540; border-color: #3995ff22;"
			>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm" style="color: #94a3b8">Avec quiz</p>
						<p class="mt-2 text-3xl font-bold text-white">{modulesWithQuiz}</p>
					</div>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-xl"
						style="background-color: #3995ff20"
					>
						<Activity size={22} style="color: #3995FF" />
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Quick links -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		<a
			href="/admin/modules"
			class="group flex items-center gap-4 rounded-xl border p-5 transition-all"
			style="background-color: #1a1540; border-color: #3995ff22;"
			onmouseover={(e) =>
				((e.currentTarget as HTMLElement).style.borderColor = '#3995ff66')}
			onmouseout={(e) =>
				((e.currentTarget as HTMLElement).style.borderColor = '#3995ff22')}
		>
			<div
				class="flex h-10 w-10 items-center justify-center rounded-lg"
				style="background-color: #1D3AA240"
			>
				<Boxes size={20} style="color: #3995FF" />
			</div>
			<div class="flex-1">
				<div class="text-sm font-medium text-white">Modules</div>
				<div class="text-xs" style="color: #94a3b8">Gérer le contenu</div>
			</div>
			<ArrowRight size={16} style="color: #3995ff44" />
		</a>

		<a
			href="/admin/settings"
			class="group flex items-center gap-4 rounded-xl border p-5 transition-all"
			style="background-color: #1a1540; border-color: #3995ff22;"
			onmouseover={(e) =>
				((e.currentTarget as HTMLElement).style.borderColor = '#3995ff66')}
			onmouseout={(e) =>
				((e.currentTarget as HTMLElement).style.borderColor = '#3995ff22')}
		>
			<div
				class="flex h-10 w-10 items-center justify-center rounded-lg"
				style="background-color: #1D3AA240"
			>
				<Settings size={20} style="color: #3995FF" />
			</div>
			<div class="flex-1">
				<div class="text-sm font-medium text-white">Paramètres</div>
				<div class="text-xs" style="color: #94a3b8">Configuration du parcours</div>
			</div>
			<ArrowRight size={16} style="color: #3995ff44" />
		</a>

		<a
			href="/admin/admins"
			class="group flex items-center gap-4 rounded-xl border p-5 transition-all"
			style="background-color: #1a1540; border-color: #3995ff22;"
			onmouseover={(e) =>
				((e.currentTarget as HTMLElement).style.borderColor = '#3995ff66')}
			onmouseout={(e) =>
				((e.currentTarget as HTMLElement).style.borderColor = '#3995ff22')}
		>
			<div
				class="flex h-10 w-10 items-center justify-center rounded-lg"
				style="background-color: #1D3AA240"
			>
				<Settings size={20} style="color: #3995FF" />
			</div>
			<div class="flex-1">
				<div class="text-sm font-medium text-white">Administrateurs</div>
				<div class="text-xs" style="color: #94a3b8">Gérer les accès</div>
			</div>
			<ArrowRight size={16} style="color: #3995ff44" />
		</a>
	</div>

	<!-- Modules table preview -->
	{#if !loading && modules.length > 0}
		<div
			class="rounded-xl border overflow-hidden"
			style="background-color: #1a1540; border-color: #3995ff22;"
		>
			<div class="flex items-center justify-between border-b px-6 py-4" style="border-color: #3995ff22">
				<h2 class="text-base font-semibold text-white">Derniers modules</h2>
				<a href="/admin/modules" class="text-sm" style="color: #3995FF">Voir tout →</a>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr style="border-bottom: 1px solid #3995ff22;">
							<th class="px-6 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">#</th>
							<th class="px-6 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">Nom</th>
							<th class="px-6 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">QR Code</th>
							<th class="px-6 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">Statut</th>
						</tr>
					</thead>
					<tbody>
						{#each modules.slice(0, 5) as module}
							<tr
								style="border-bottom: 1px solid #3995ff11;"
								onmouseover={(e) =>
									((e.currentTarget as HTMLElement).style.backgroundColor = '#3995ff08')}
								onmouseout={(e) =>
									((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
							>
								<td class="px-6 py-3 font-mono text-white">{module.number}</td>
								<td class="px-6 py-3 text-white">{module.name}</td>
								<td class="px-6 py-3 font-mono text-xs" style="color: #3995ff88">{module.qr_code}</td>
								<td class="px-6 py-3">
									<span
										class="rounded-full px-2 py-0.5 text-xs font-medium"
										style="background-color: {module.is_active ? '#16a34a20' : '#94a3b820'}; color: {module.is_active ? '#4ade80' : '#94a3b8'}"
									>
										{module.is_active ? 'Actif' : 'Inactif'}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
