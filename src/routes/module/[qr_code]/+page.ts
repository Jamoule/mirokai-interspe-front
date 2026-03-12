import { visitorApi } from '$lib/visitor-api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const [module, modules] = await Promise.all([
			visitorApi.getModuleByQr(params.qr_code),
			visitorApi.getModules().catch(() => [])
		]);
		const totalModules = modules.filter((m) => m.is_active).length;
		return { module, totalModules };
	} catch (e) {
		throw error(404, 'Module introuvable');
	}
};
