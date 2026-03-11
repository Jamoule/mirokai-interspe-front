const BASE = 'http://localhost:5000/api';

function getToken(): string | null {
	if (typeof localStorage === 'undefined') return null;
	return localStorage.getItem('mirokai_token');
}

async function request<T>(
	method: string,
	path: string,
	body?: unknown,
	isFormData = false
): Promise<T> {
	const token = getToken();
	const headers: Record<string, string> = {};
	if (token) headers['Authorization'] = `Bearer ${token}`;
	if (body && !isFormData) headers['Content-Type'] = 'application/json';

	const res = await fetch(`${BASE}${path}`, {
		method,
		headers,
		body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error(err.error || `HTTP ${res.status}`);
	}

	if (res.status === 204 || res.headers.get('content-length') === '0') return {} as T;
	return res.json();
}

export const api = {
	// Auth
	login: (email: string, password: string) =>
		request<{ token: string; admin: Admin }>('POST', '/auth/login', { email, password }),
	me: () => request<Admin>('GET', '/auth/me'),
	logout: () => request<void>('POST', '/auth/logout'),

	// Modules
	getModules: () => request<Module[]>('GET', '/modules/all'),
	getModule: (id: string) => request<Module>('GET', `/modules/${id}`),
	createModule: (data: Partial<Module>) => request<Module>('POST', '/modules', data),
	updateModule: (id: string, data: Partial<Module>) => request<Module>('PUT', `/modules/${id}`, data),
	toggleModule: (id: string, is_active: boolean) =>
		request<Module>('PATCH', `/modules/${id}/toggle`, { is_active }),
	deleteModule: (id: string) => request<void>('DELETE', `/modules/${id}`),
	updatePositions: (positions: { id: string; position_x: number; position_y: number }[]) =>
		request<Module[]>('PATCH', '/modules/positions', positions),

	// Questions
	getQuestionsAll: (moduleId: string) =>
		request<Question[]>('GET', `/modules/${moduleId}/questions/all`),
	createQuestion: (data: QuestionInput) => request<Question>('POST', '/questions', data),
	updateQuestion: (id: string, data: QuestionInput) =>
		request<Question>('PUT', `/questions/${id}`, data),
	deleteQuestion: (id: string) => request<void>('DELETE', `/questions/${id}`),

	// Admins
	getAdmins: () => request<Admin[]>('GET', '/admins'),
	createAdmin: (data: { email: string; password: string; display_name: string }) =>
		request<Admin>('POST', '/admins', data),
	updateAdmin: (id: string, data: Partial<Admin & { password: string }>) =>
		request<Admin>('PUT', `/admins/${id}`, data),
	deleteAdmin: (id: string) => request<void>('DELETE', `/admins/${id}`),

	// Settings
	getSettings: () => request<Settings>('GET', '/settings'),
	updateSettings: (data: Partial<Settings>) => request<Settings>('PUT', '/settings', data),

	// Upload
	upload: (file: File, folder: string) => {
		const fd = new FormData();
		fd.append('file', file);
		return request<{ url: string; filename: string }>('POST', `/upload?folder=${folder}`, fd, true);
	},
	deleteUpload: (url: string) => request<void>('DELETE', '/upload', { url })
};

export interface Admin {
	id: string;
	email: string;
	display_name: string;
	is_active: boolean;
	last_login_at: string;
	created_at: string;
}

export interface TranscriptSegment {
	start: number;
	end: number;
	speaker: string;
	text: string;
}

export interface Module {
	id: string;
	number: number;
	name: string;
	description: string;
	media_type: string;
	media_url: string;
	image_urls: string[];
	transcript_segments: TranscriptSegment[] | null;
	qr_code: string;
	position_x: number;
	position_y: number;
	has_quiz: boolean;
	is_active: boolean;
	suggested_order: number;
	created_at: string;
	updated_at: string;
}

export interface Question {
	id: string;
	module_id: string;
	age_group: string;
	question_text: string;
	secret_word: string;
	display_order: number;
	answers: Answer[];
}

export interface Answer {
	id: string;
	question_id: string;
	answer_text: string;
	is_correct: number;
	display_order: number;
}

export interface AnswerInput {
	answer_text: string;
	is_correct: boolean;
	display_order: number;
}

export interface QuestionInput {
	module_id?: string;
	age_group?: string;
	question_text?: string;
	secret_word?: string;
	display_order?: number;
	answers?: AnswerInput[];
}

export interface Settings {
	id: string;
	parcours_name: string;
	plan_image_url: string;
	welcome_message: string;
	completion_message: string;
	completion_email_template: string | null;
	completion_redirect_url: string | null;
	estimated_duration_min: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}
