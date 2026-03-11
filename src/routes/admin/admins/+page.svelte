<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { api, type Admin } from '$lib/api';
	import { auth } from '$lib/auth.svelte';
	import { formatDate } from '$lib/utils';
	import { Plus, Pencil, Trash2, X, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-svelte';

	let admins = $state<Admin[]>([]);
	let loading = $state(true);
	let showModal = $state(false);
	let editingAdmin = $state<Admin | null>(null);
	let submitting = $state(false);
	let deleteConfirm = $state<string | null>(null);
	let showPassword = $state(false);

	let form = $state({
		email: '',
		display_name: '',
		password: '',
		is_active: true
	});

	onMount(loadAdmins);

	async function loadAdmins() {
		loading = true;
		try {
			admins = await api.getAdmins();
		} catch (err) {
			toast.error('Erreur lors du chargement des administrateurs');
		} finally {
			loading = false;
		}
	}

	function openCreate() {
		editingAdmin = null;
		form = { email: '', display_name: '', password: '', is_active: true };
		showPassword = false;
		showModal = true;
	}

	function openEdit(admin: Admin) {
		editingAdmin = admin;
		form = {
			email: admin.email,
			display_name: admin.display_name,
			password: '',
			is_active: admin.is_active
		};
		showPassword = false;
		showModal = true;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!editingAdmin && !form.password) {
			toast.error('Le mot de passe est requis pour un nouvel administrateur');
			return;
		}

		submitting = true;
		try {
			if (editingAdmin) {
				const updateData: { email?: string; display_name?: string; password?: string; is_active?: boolean } = {
					email: form.email,
					display_name: form.display_name,
					is_active: form.is_active
				};
				if (form.password) updateData.password = form.password;
				const updated = await api.updateAdmin(editingAdmin.id, updateData);
				admins = admins.map((a) => (a.id === updated.id ? updated : a));
				toast.success('Administrateur mis à jour');
			} else {
				const created = await api.createAdmin({
					email: form.email,
					display_name: form.display_name,
					password: form.password
				});
				admins = [...admins, created];
				toast.success('Administrateur créé');
			}
			showModal = false;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur');
		} finally {
			submitting = false;
		}
	}

	async function handleDelete(id: string) {
		try {
			await api.deleteAdmin(id);
			admins = admins.filter((a) => a.id !== id);
			deleteConfirm = null;
			toast.success('Administrateur supprimé');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur');
		}
	}

	const activeAdmins = $derived(admins.filter((a) => a.is_active));

	function canDelete(admin: Admin): boolean {
		// Cannot delete self
		if (admin.id === auth.admin?.id) return false;
		// Cannot delete last active admin
		if (admin.is_active && activeAdmins.length <= 1) return false;
		return true;
	}

	function canEdit(admin: Admin): boolean {
		return true; // Anyone can be edited
	}
</script>

<svelte:head>
	<title>Administrateurs — Mirokaï Admin</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-white">Administrateurs</h1>
			<p class="mt-1 text-sm" style="color: #94a3b8">
				{admins.length} administrateur{admins.length > 1 ? 's' : ''} —
				{activeAdmins.length} actif{activeAdmins.length > 1 ? 's' : ''}
			</p>
		</div>
		<button
			onclick={openCreate}
			class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
			style="background-color: #FFBD14; color: #0F0B24"
		>
			<Plus size={16} />
			Nouvel administrateur
		</button>
	</div>

	<!-- Table -->
	<div
		class="rounded-xl border overflow-hidden"
		style="background-color: #1a1540; border-color: #3995ff22;"
	>
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4"
					style="border-color: #3995FF; border-top-color: transparent"
				></div>
			</div>
		{:else if admins.length === 0}
			<div class="flex flex-col items-center justify-center py-20 gap-3">
				<p style="color: #94a3b8">Aucun administrateur</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr style="border-bottom: 1px solid #3995ff22;">
							<th class="px-5 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">
								Nom
							</th>
							<th class="px-5 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">
								Email
							</th>
							<th class="px-5 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">
								Statut
							</th>
							<th class="px-5 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">
								Dernière connexion
							</th>
							<th class="px-5 py-3 text-left text-xs font-medium uppercase" style="color: #94a3b8">
								Créé le
							</th>
							<th class="px-5 py-3 text-right text-xs font-medium uppercase" style="color: #94a3b8">
								Actions
							</th>
						</tr>
					</thead>
					<tbody>
						{#each admins as admin}
							<tr
								style="border-bottom: 1px solid #3995ff11; transition: background-color 0.15s"
								onmouseover={(e) =>
									((e.currentTarget as HTMLElement).style.backgroundColor = '#3995ff08')}
								onmouseout={(e) =>
									((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
							>
								<td class="px-5 py-3">
									<div class="flex items-center gap-3">
										<div
											class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
											style="background: linear-gradient(135deg, #1D3AA2, #3995FF); color: white"
										>
											{admin.display_name.charAt(0).toUpperCase()}
										</div>
										<div>
											<div class="font-medium text-white">{admin.display_name}</div>
											{#if admin.id === auth.admin?.id}
												<div class="text-xs" style="color: #3995ff88">Vous</div>
											{/if}
										</div>
									</div>
								</td>
								<td class="px-5 py-3 text-sm" style="color: #94a3b8">{admin.email}</td>
								<td class="px-5 py-3">
									{#if admin.is_active}
										<span
											class="flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 text-xs font-medium"
											style="background-color: #16a34a20; color: #4ade80"
										>
											<CheckCircle size={12} />
											Actif
										</span>
									{:else}
										<span
											class="flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 text-xs font-medium"
											style="background-color: #94a3b820; color: #94a3b8"
										>
											<XCircle size={12} />
											Inactif
										</span>
									{/if}
								</td>
								<td class="px-5 py-3 text-sm" style="color: #94a3b8">
									{formatDate(admin.last_login_at)}
								</td>
								<td class="px-5 py-3 text-sm" style="color: #94a3b8">
									{formatDate(admin.created_at)}
								</td>
								<td class="px-5 py-3">
									<div class="flex items-center justify-end gap-1">
										<button
											onclick={() => openEdit(admin)}
											class="rounded-lg p-2 transition-colors"
											style="color: #94a3b8"
											title="Modifier"
											onmouseover={(e) => {
												(e.currentTarget as HTMLElement).style.backgroundColor = '#3995ff20';
												(e.currentTarget as HTMLElement).style.color = '#3995FF';
											}}
											onmouseout={(e) => {
												(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
												(e.currentTarget as HTMLElement).style.color = '#94a3b8';
											}}
										>
											<Pencil size={15} />
										</button>
										<button
											onclick={() => canDelete(admin) && (deleteConfirm = admin.id)}
											disabled={!canDelete(admin)}
											class="rounded-lg p-2 transition-colors"
											style="color: {canDelete(admin) ? '#94a3b8' : '#3995ff20'}; cursor: {canDelete(admin) ? 'pointer' : 'not-allowed'}"
											title={!canDelete(admin)
												? admin.id === auth.admin?.id
													? 'Impossible de supprimer votre propre compte'
													: 'Dernier administrateur actif'
												: 'Supprimer'}
											onmouseover={(e) => {
												if (canDelete(admin)) {
													(e.currentTarget as HTMLElement).style.backgroundColor = '#ff444420';
													(e.currentTarget as HTMLElement).style.color = '#ff7777';
												}
											}}
											onmouseout={(e) => {
												(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
												(e.currentTarget as HTMLElement).style.color = canDelete(admin)
													? '#94a3b8'
													: '#3995ff20';
											}}
										>
											<Trash2 size={15} />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- Create/Edit Modal -->
{#if showModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		style="background-color: rgba(0,0,0,0.7); backdrop-filter: blur(4px)"
		onclick={(e) => {
			if (e.target === e.currentTarget) showModal = false;
		}}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="w-full max-w-md rounded-2xl border"
			style="background-color: #1a1540; border-color: #3995ff33;"
		>
			<div
				class="flex items-center justify-between border-b px-6 py-4"
				style="border-color: #3995ff22"
			>
				<h2 class="text-lg font-semibold text-white">
					{editingAdmin ? 'Modifier l\'administrateur' : 'Nouvel administrateur'}
				</h2>
				<button
					onclick={() => (showModal = false)}
					class="rounded-lg p-1.5 transition-colors"
					style="color: #94a3b8"
				>
					<X size={18} />
				</button>
			</div>

			<form onsubmit={handleSubmit} class="flex flex-col gap-4 p-6">
				<!-- Display name -->
				<div class="flex flex-col gap-1.5">
					<label class="text-sm font-medium" style="color: #94a3b8">Nom d'affichage *</label>
					<input
						type="text"
						bind:value={form.display_name}
						placeholder="Jean Dupont"
						required
						class="rounded-lg border px-3 py-2.5 text-sm text-white outline-none"
						style="background-color: #221c4a; border-color: #3995ff33;"
						onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
						onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
					/>
				</div>

				<!-- Email -->
				<div class="flex flex-col gap-1.5">
					<label class="text-sm font-medium" style="color: #94a3b8">Email *</label>
					<input
						type="email"
						bind:value={form.email}
						placeholder="admin@mirokai.fr"
						required
						class="rounded-lg border px-3 py-2.5 text-sm text-white outline-none"
						style="background-color: #221c4a; border-color: #3995ff33;"
						onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
						onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
					/>
				</div>

				<!-- Password -->
				<div class="flex flex-col gap-1.5">
					<label class="text-sm font-medium" style="color: #94a3b8">
						Mot de passe
						{#if editingAdmin}
							<span class="ml-1 text-xs font-normal" style="color: #94a3b880">(laisser vide pour ne pas changer)</span>
						{:else}
							*
						{/if}
					</label>
					<div class="relative">
						<input
							type={showPassword ? 'text' : 'password'}
							bind:value={form.password}
							placeholder={editingAdmin ? '••••••••' : 'Mot de passe'}
							required={!editingAdmin}
							autocomplete={editingAdmin ? 'new-password' : 'new-password'}
							class="w-full rounded-lg border px-3 py-2.5 pr-10 text-sm text-white outline-none"
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

				<!-- Active toggle (only for edit, not self) -->
				{#if editingAdmin && editingAdmin.id !== auth.admin?.id}
					<label class="flex cursor-pointer items-center gap-3">
						<div
							class="relative h-5 w-9 rounded-full transition-colors"
							style="background-color: {form.is_active ? '#3995FF' : '#3995ff33'}"
							onclick={() => (form.is_active = !form.is_active)}
							role="switch"
							aria-checked={form.is_active}
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && (form.is_active = !form.is_active)}
						>
							<div
								class="absolute top-0.5 h-4 w-4 rounded-full transition-all"
								style="background-color: white; left: {form.is_active ? '20px' : '2px'}"
							></div>
						</div>
						<span class="text-sm text-white">Compte actif</span>
					</label>
				{/if}

				<div class="flex justify-end gap-3 border-t pt-4" style="border-color: #3995ff22">
					<button
						type="button"
						onclick={() => (showModal = false)}
						class="rounded-lg border px-4 py-2 text-sm font-medium"
						style="border-color: #3995ff33; color: #94a3b8"
					>
						Annuler
					</button>
					<button
						type="submit"
						disabled={submitting}
						class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
						style="background-color: #FFBD14; color: #0F0B24; opacity: {submitting ? '0.7' : '1'}"
					>
						{#if submitting}
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
							></div>
						{/if}
						{editingAdmin ? 'Enregistrer' : 'Créer'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete confirmation -->
{#if deleteConfirm}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		style="background-color: rgba(0,0,0,0.7); backdrop-filter: blur(4px)"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="w-full max-w-sm rounded-2xl border p-6"
			style="background-color: #1a1540; border-color: #ff444433"
		>
			<h3 class="text-lg font-semibold text-white">Supprimer l'administrateur ?</h3>
			<p class="mt-2 text-sm" style="color: #94a3b8">
				Cette action est irréversible. L'administrateur ne pourra plus se connecter.
			</p>
			<div class="mt-5 flex justify-end gap-3">
				<button
					onclick={() => (deleteConfirm = null)}
					class="rounded-lg border px-4 py-2 text-sm font-medium"
					style="border-color: #3995ff33; color: #94a3b8"
				>
					Annuler
				</button>
				<button
					onclick={() => handleDelete(deleteConfirm!)}
					class="rounded-lg px-4 py-2 text-sm font-semibold"
					style="background-color: #ff4444; color: white"
				>
					Supprimer
				</button>
			</div>
		</div>
	</div>
{/if}
