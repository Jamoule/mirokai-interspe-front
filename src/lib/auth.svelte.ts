import { goto } from '$app/navigation';
import { api, type Admin } from './api';

function createAuth() {
	let admin = $state<Admin | null>(null);
	let token = $state<string | null>(null);
	let initialized = $state(false);

	return {
		get admin() {
			return admin;
		},
		get token() {
			return token;
		},
		get initialized() {
			return initialized;
		},
		get isAuthenticated() {
			return !!token;
		},

		init() {
			if (typeof localStorage !== 'undefined') {
				const stored = localStorage.getItem('mirokai_token');
				if (stored) {
					token = stored;
					api
						.me()
						.then((a) => {
							admin = a;
							initialized = true;
						})
						.catch(() => {
							this.clearAuth();
							initialized = true;
						});
				} else {
					initialized = true;
				}
			}
		},

		async login(email: string, password: string) {
			const res = await api.login(email, password);
			token = res.token;
			admin = res.admin;
			localStorage.setItem('mirokai_token', res.token);
		},

		async logout() {
			try {
				await api.logout();
			} catch {}
			this.clearAuth();
			goto('/admin/login');
		},

		clearAuth() {
			token = null;
			admin = null;
			localStorage.removeItem('mirokai_token');
		}
	};
}

export const auth = createAuth();
