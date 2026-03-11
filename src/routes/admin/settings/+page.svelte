<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { api, type Settings } from '$lib/api';
	import { Save, Upload, ExternalLink } from 'lucide-svelte';

	let settings = $state<Settings | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let uploadingPlan = $state(false);

	let form = $state({
		parcours_name: '',
		plan_image_url: '',
		welcome_message: '',
		completion_message: '',
		completion_email_template: '',
		completion_redirect_url: '',
		estimated_duration_min: 30
	});

	onMount(async () => {
		loading = true;
		try {
			settings = await api.getSettings();
			if (settings) {
				form = {
					parcours_name: settings.parcours_name ?? '',
					plan_image_url: settings.plan_image_url ?? '',
					welcome_message: settings.welcome_message ?? '',
					completion_message: settings.completion_message ?? '',
					completion_email_template: settings.completion_email_template ?? '',
					completion_redirect_url: settings.completion_redirect_url ?? '',
					estimated_duration_min: settings.estimated_duration_min ?? 30
				};
			}
		} catch (err) {
			// Settings may not exist yet
		} finally {
			loading = false;
		}
	});

	async function handleSave(e: Event) {
		e.preventDefault();
		saving = true;
		try {
			const data = {
				...form,
				completion_email_template: form.completion_email_template || null,
				completion_redirect_url: form.completion_redirect_url || null
			};
			settings = await api.updateSettings(data);
			toast.success('Paramètres enregistrés');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
		} finally {
			saving = false;
		}
	}

	async function handlePlanUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploadingPlan = true;
		try {
			const result = await api.upload(file, 'plan');
			form.plan_image_url = result.url;
			toast.success('Image uploadée');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur upload');
		} finally {
			uploadingPlan = false;
			input.value = '';
		}
	}
</script>

<svelte:head>
	<title>Paramètres — Mirokaï Admin</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-white">Paramètres</h1>
			<p class="mt-1 text-sm" style="color: #94a3b8">Configuration du parcours Mirokaï</p>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4"
				style="border-color: #3995FF; border-top-color: transparent"
			></div>
		</div>
	{:else}
		<form onsubmit={handleSave} class="flex flex-col gap-5">
			<!-- General settings -->
			<div
				class="rounded-xl border overflow-hidden"
				style="background-color: #1a1540; border-color: #3995ff22;"
			>
				<div
					class="border-b px-6 py-4"
					style="border-color: #3995ff22"
				>
					<h2 class="text-base font-semibold text-white">Informations générales</h2>
				</div>
				<div class="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
					<!-- Parcours name -->
					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium" style="color: #94a3b8">Nom du parcours</label>
						<input
							type="text"
							bind:value={form.parcours_name}
							placeholder="Parcours Mirokaï"
							class="rounded-lg border px-3 py-2.5 text-sm text-white outline-none"
							style="background-color: #221c4a; border-color: #3995ff33;"
							onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
							onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
						/>
					</div>

					<!-- Duration -->
					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium" style="color: #94a3b8">
							Durée estimée (minutes)
						</label>
						<input
							type="number"
							bind:value={form.estimated_duration_min}
							min="1"
							placeholder="30"
							class="rounded-lg border px-3 py-2.5 text-sm text-white outline-none"
							style="background-color: #221c4a; border-color: #3995ff33;"
							onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
							onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
						/>
					</div>

					<!-- Plan image -->
					<div class="flex flex-col gap-1.5 md:col-span-2">
						<label class="text-sm font-medium" style="color: #94a3b8">Image du plan</label>
						<div class="flex gap-2">
							<input
								type="text"
								bind:value={form.plan_image_url}
								placeholder="/uploads/plan.jpg"
								class="flex-1 rounded-lg border px-3 py-2.5 text-sm text-white outline-none"
								style="background-color: #221c4a; border-color: #3995ff33;"
								onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
								onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
							/>
							<label
								class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap"
								style="border-color: #3995ff33; color: #3995FF; background-color: #3995ff10"
							>
								{#if uploadingPlan}
									<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
								{:else}
									<Upload size={15} />
								{/if}
								Upload
								<input
									type="file"
									accept="image/*"
									class="hidden"
									onchange={handlePlanUpload}
									disabled={uploadingPlan}
								/>
							</label>
							{#if form.plan_image_url}
								<a
									href="http://localhost:5000{form.plan_image_url}"
									target="_blank"
									rel="noopener"
									class="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors"
									style="border-color: #3995ff33; color: #94a3b8"
								>
									<ExternalLink size={15} />
								</a>
							{/if}
						</div>
						{#if form.plan_image_url}
							<div class="mt-2 rounded-lg overflow-hidden" style="max-width: 300px; border: 1px solid #3995ff22">
								<img
									src="http://localhost:5000{form.plan_image_url}"
									alt="Plan du parcours"
									class="w-full h-auto"
									style="max-height: 200px; object-fit: contain; background-color: #221c4a"
								/>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Messages -->
			<div
				class="rounded-xl border overflow-hidden"
				style="background-color: #1a1540; border-color: #3995ff22;"
			>
				<div class="border-b px-6 py-4" style="border-color: #3995ff22">
					<h2 class="text-base font-semibold text-white">Messages</h2>
				</div>
				<div class="flex flex-col gap-5 p-6">
					<!-- Welcome message -->
					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium" style="color: #94a3b8">Message de bienvenue</label>
						<textarea
							bind:value={form.welcome_message}
							placeholder="Bienvenue dans le parcours Mirokaï !"
							rows={3}
							class="rounded-lg border px-3 py-2.5 text-sm text-white outline-none resize-y"
							style="background-color: #221c4a; border-color: #3995ff33;"
							onfocus={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#3995FF')}
							onblur={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#3995ff33')}
						></textarea>
					</div>

					<!-- Completion message -->
					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium" style="color: #94a3b8">Message de fin de parcours</label>
						<textarea
							bind:value={form.completion_message}
							placeholder="Félicitations ! Vous avez terminé le parcours."
							rows={3}
							class="rounded-lg border px-3 py-2.5 text-sm text-white outline-none resize-y"
							style="background-color: #221c4a; border-color: #3995ff33;"
							onfocus={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#3995FF')}
							onblur={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#3995ff33')}
						></textarea>
					</div>
				</div>
			</div>

			<!-- Advanced -->
			<div
				class="rounded-xl border overflow-hidden"
				style="background-color: #1a1540; border-color: #3995ff22;"
			>
				<div class="border-b px-6 py-4" style="border-color: #3995ff22">
					<h2 class="text-base font-semibold text-white">Options avancées</h2>
				</div>
				<div class="flex flex-col gap-5 p-6">
					<!-- Redirect URL -->
					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium" style="color: #94a3b8">
							URL de redirection finale
							<span class="ml-1 text-xs font-normal" style="color: #94a3b880">(optionnel)</span>
						</label>
						<input
							type="url"
							bind:value={form.completion_redirect_url}
							placeholder="https://mirokai.fr"
							class="rounded-lg border px-3 py-2.5 text-sm text-white outline-none"
							style="background-color: #221c4a; border-color: #3995ff33;"
							onfocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995FF')}
							onblur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3995ff33')}
						/>
					</div>

					<!-- Email template -->
					<div class="flex flex-col gap-1.5">
						<label class="text-sm font-medium" style="color: #94a3b8">
							Template email de complétion
							<span class="ml-1 text-xs font-normal" style="color: #94a3b880">(optionnel — HTML)</span>
						</label>
						<textarea
							bind:value={form.completion_email_template}
							placeholder="<html>...</html>"
							rows={6}
							class="rounded-lg border px-3 py-2.5 text-sm text-white outline-none resize-y font-mono"
							style="background-color: #221c4a; border-color: #3995ff33;"
							onfocus={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#3995FF')}
							onblur={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#3995ff33')}
						></textarea>
					</div>
				</div>
			</div>

			<!-- Save button -->
			<div class="flex justify-end">
				<button
					type="submit"
					disabled={saving}
					class="flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all"
					style="background-color: #FFBD14; color: #0F0B24; opacity: {saving ? '0.7' : '1'}"
					onmouseover={(e) => {
						if (!saving) (e.currentTarget as HTMLElement).style.backgroundColor = '#ffd14f';
					}}
					onmouseout={(e) => {
						(e.currentTarget as HTMLElement).style.backgroundColor = '#FFBD14';
					}}
				>
					{#if saving}
						<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
						Enregistrement...
					{:else}
						<Save size={16} />
						Enregistrer les paramètres
					{/if}
				</button>
			</div>

			<!-- Last updated info -->
			{#if settings?.updated_at}
				<p class="text-right text-xs" style="color: #94a3b860">
					Dernière mise à jour : {new Date(settings.updated_at).toLocaleString('fr-FR')}
				</p>
			{/if}
		</form>
	{/if}
</div>
