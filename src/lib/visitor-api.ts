import type { Module, Question } from './api';

const BASE = 'http://localhost:5000/api';

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
		request<Question[]>(`/modules/${id}/questions?age_group=${encodeURIComponent(age)}`)
};
