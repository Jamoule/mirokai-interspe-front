import type { Module, Question, Settings } from './api';

const BASE = 'http://localhost:5000/api';
export const BACKEND_ORIGIN = 'http://localhost:5000';

export function resolveMediaUrl(url: string | null | undefined): string {
	if (!url) return '';
	if (url.startsWith('http://') || url.startsWith('https://')) return url;
	return BACKEND_ORIGIN + (url.startsWith('/') ? '' : '/') + url;
}

async function request<T>(path: string): Promise<T> {
	const res = await fetch(`${BASE}${path}`);

	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error(err.error || `HTTP ${res.status}`);
	}

	return res.json();
}

export const visitorApi = {
	getModuleByQr: (qr_code: string) => request<Module>(`/modules/qr/${qr_code}`),
	getModules: () => request<Module[]>('/modules'),
	getQuestions: (id: string, age: string) =>
		request<Question[]>(`/modules/${id}/questions?age_group=${encodeURIComponent(age)}`),
	getSettings: () => request<Settings>('/settings')
};
