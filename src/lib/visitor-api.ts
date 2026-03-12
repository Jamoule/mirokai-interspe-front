import type { Module, Question, Settings } from './api';

const BACKEND_ORIGIN_DEFAULT = 'http://localhost:5000';
export const BACKEND_ORIGIN = (import.meta.env.VITE_API_URL ?? BACKEND_ORIGIN_DEFAULT).replace(/\/api$/, '');
const BASE = BACKEND_ORIGIN + '/api';
export const AVATAR_VIDEO_URL = BACKEND_ORIGIN + '/uploads/avatar/0311.mov';

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

async function post<T>(path: string, body: unknown): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});

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
	getSettings: () => request<Settings>('/settings'),
	validateAnswer: (question_id: string, answer_id: string) =>
		post<{ correct: boolean; secret_word: string | null }>('/quiz/validate', {
			question_id,
			answer_id
		})
};
