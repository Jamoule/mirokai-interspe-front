import { visitorApi } from '$lib/visitor-api';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async () => {
	const [modules, settings] = await Promise.all([
		visitorApi.getModules().catch(() => []),
		visitorApi.getSettings().catch(() => null)
	]);
	return { modules, settings };
};
