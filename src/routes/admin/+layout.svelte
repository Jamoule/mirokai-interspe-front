<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth.svelte';
	import { Toaster } from 'svelte-sonner';
	import {
		LayoutDashboard,
		Boxes,
		Map,
		Settings,
		Users,
		LogOut,
		Menu,
		X,
		ChevronRight
	} from 'lucide-svelte';

	let { children } = $props();

	let initialized = $state(false);

	$effect(() => {
		if (!initialized) {
			initialized = true;
			auth.init();
		}
	});

	$effect(() => {
		if (auth.initialized && !auth.isAuthenticated) {
			goto('/admin/login');
		}
	});

	const navItems = [
		{ href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
		{ href: '/admin/modules', label: 'Modules', icon: Boxes },
		{ href: '/admin/plan', label: 'Plan d\'exposition', icon: Map },
		{ href: '/admin/settings', label: 'Paramètres', icon: Settings },
		{ href: '/admin/admins', label: 'Administrateurs', icon: Users }
	];

	let sidebarOpen = $state(true);

	function isActive(href: string, exact = false): boolean {
		if (exact) return $page.url.pathname === href;
		return $page.url.pathname.startsWith(href);
	}
</script>

<Toaster position="top-right" theme="dark" richColors />

{#if !auth.initialized}
	<div
		class="flex min-h-screen items-center justify-center"
		style="background: linear-gradient(135deg, #0F0B24 0%, #1D3AA2 100%)"
	>
		<div class="flex flex-col items-center gap-4">
			<div class="h-12 w-12 animate-spin rounded-full border-4 border-[#3995FF] border-t-transparent"></div>
			<span class="text-white/60">Chargement...</span>
		</div>
	</div>
{:else if auth.isAuthenticated}
	<div class="flex min-h-screen" style="background-color: #0F0B24">
		<!-- Sidebar -->
		<aside
			class="flex flex-col transition-all duration-300"
			style="width: {sidebarOpen ? '260px' : '70px'}; background-color: #1a1540; border-right: 1px solid #3995ff22; flex-shrink: 0;"
		>
			<!-- Logo -->
			<div
				class="flex items-center border-b px-4 py-5"
				style="border-color: #3995ff22; min-height: 70px;"
			>
				{#if sidebarOpen}
					<div class="flex items-center gap-3">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
							style="background: linear-gradient(135deg, #1D3AA2, #3995FF); color: white;"
						>
							M
						</div>
						<div>
							<div class="text-sm font-bold tracking-widest text-white">MIROKAÏ</div>
							<div class="text-xs" style="color: #3995ff88">Administration</div>
						</div>
					</div>
				{:else}
					<div
						class="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
						style="background: linear-gradient(135deg, #1D3AA2, #3995FF); color: white; margin: 0 auto;"
					>
						M
					</div>
				{/if}
			</div>

			<!-- Nav -->
			<nav class="flex flex-1 flex-col gap-1 p-3">
				{#each navItems as item}
					{@const active = isActive(item.href, item.exact)}
					{@const Icon = item.icon}
					<a
						href={item.href}
						class="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
						style="
							color: {active ? 'white' : '#94a3b8'};
							background-color: {active ? '#1D3AA230' : 'transparent'};
							border-left: 3px solid {active ? '#3995FF' : 'transparent'};
						"
						onmouseover={(e) => {
							if (!active) {
								(e.currentTarget as HTMLElement).style.backgroundColor = '#3995ff10';
								(e.currentTarget as HTMLElement).style.color = 'white';
							}
						}}
						onfocus={(e) => {
							if (!active) {
								(e.currentTarget as HTMLElement).style.backgroundColor = '#3995ff10';
								(e.currentTarget as HTMLElement).style.color = 'white';
							}
						}}
						onmouseout={(e) => {
							if (!active) {
								(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
								(e.currentTarget as HTMLElement).style.color = '#94a3b8';
							}
						}}
						onblur={(e) => {
							if (!active) {
								(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
								(e.currentTarget as HTMLElement).style.color = '#94a3b8';
							}
						}}
					>
						<Icon size={18} />
						{#if sidebarOpen}
							<span>{item.label}</span>
							{#if active}
								<ChevronRight size={14} class="ml-auto" style="color: #3995ff" />
							{/if}
						{/if}
					</a>
				{/each}
			</nav>

			<!-- User + Logout -->
			<div class="border-t p-3" style="border-color: #3995ff22">
				{#if sidebarOpen && auth.admin}
					<div class="mb-2 rounded-lg px-3 py-2" style="background-color: #221c4a">
						<div class="truncate text-sm font-medium text-white">{auth.admin.display_name}</div>
						<div class="truncate text-xs" style="color: #3995ff88">{auth.admin.email}</div>
					</div>
				{/if}
				<button
					onclick={() => auth.logout()}
					class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
					style="color: #94a3b8"
					onmouseover={(e) => {
						(e.currentTarget as HTMLElement).style.backgroundColor = '#ff444410';
						(e.currentTarget as HTMLElement).style.color = '#ff7777';
					}}
					onfocus={(e) => {
						(e.currentTarget as HTMLElement).style.backgroundColor = '#ff444410';
						(e.currentTarget as HTMLElement).style.color = '#ff7777';
					}}
					onmouseout={(e) => {
						(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
						(e.currentTarget as HTMLElement).style.color = '#94a3b8';
					}}
					onblur={(e) => {
						(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
						(e.currentTarget as HTMLElement).style.color = '#94a3b8';
					}}
				>
					<LogOut size={18} />
					{#if sidebarOpen}
						<span>Déconnexion</span>
					{/if}
				</button>
			</div>
		</aside>

		<!-- Main content -->
		<div class="flex min-w-0 flex-1 flex-col">
			<!-- Top bar -->
			<header
				class="flex items-center gap-4 border-b px-6 py-4"
				style="border-color: #3995ff22; background-color: #1a1540; min-height: 70px;"
			>
				<button
					onclick={() => (sidebarOpen = !sidebarOpen)}
					class="rounded-lg p-2 transition-colors"
					style="color: #94a3b8"
					onmouseover={(e) => {
						(e.currentTarget as HTMLElement).style.backgroundColor = '#3995ff20';
						(e.currentTarget as HTMLElement).style.color = 'white';
					}}
					onfocus={(e) => {
						(e.currentTarget as HTMLElement).style.backgroundColor = '#3995ff20';
						(e.currentTarget as HTMLElement).style.color = 'white';
					}}
					onmouseout={(e) => {
						(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
						(e.currentTarget as HTMLElement).style.color = '#94a3b8';
					}}
					onblur={(e) => {
						(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
						(e.currentTarget as HTMLElement).style.color = '#94a3b8';
					}}
				>
					{#if sidebarOpen}
						<X size={20} />
					{:else}
						<Menu size={20} />
					{/if}
				</button>

				<div class="flex-1">
					<div class="text-sm font-medium text-white">
						{navItems.find((n) => isActive(n.href, n.exact))?.label ?? 'Admin'}
					</div>
				</div>
			</header>

			<!-- Page content -->
			<main class="flex-1 overflow-auto p-6">
				{@render children()}
			</main>
		</div>
	</div>
{:else}
	<!-- Not authenticated: render children (login page) -->
	{@render children()}
{/if}
