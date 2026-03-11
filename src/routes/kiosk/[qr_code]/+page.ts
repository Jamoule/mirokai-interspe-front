import { visitorApi } from '$lib/visitor-api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const module = await visitorApi.getModuleByQr(params.qr_code);
		return { module };
	} catch (e) {
		throw error(404, 'Module introuvable');
	}
};
