export type AgeGroup = '3-4' | '5-7' | '8-10' | '11-13' | '14+';

const STORAGE_KEY = 'mirokai_age_group';
const COMPLETED_KEY = 'mirokai_completed';
const EMAIL_KEY = 'mirokai_email';

function createVisitor() {
	let ageGroup = $state<AgeGroup | null>(null);
	let email = $state<string | null>(null);
	let initialized = $state(false);
	let completedModules = $state<string[]>([]);

	return {
		get ageGroup() {
			return ageGroup;
		},
		get hasAge() {
			return ageGroup !== null;
		},
		get email() {
			return email;
		},
		get hasEmail() {
			return email !== null;
		},
		get initialized() {
			return initialized;
		},
		get completedModules() {
			return completedModules;
		},

		init() {
			if (typeof localStorage !== 'undefined') {
				const stored = localStorage.getItem(STORAGE_KEY);
				if (
					stored === '3-4' ||
					stored === '5-7' ||
					stored === '8-10' ||
					stored === '11-13' ||
					stored === '14+'
				) {
					ageGroup = stored;
				}
				const storedEmail = localStorage.getItem(EMAIL_KEY);
				if (storedEmail) {
					email = storedEmail;
				}
				const storedCompleted = localStorage.getItem(COMPLETED_KEY);
				if (storedCompleted) {
					try {
						completedModules = JSON.parse(storedCompleted);
					} catch {
						completedModules = [];
					}
				}
				initialized = true;
			}
		},

		setEmail(value: string) {
			email = value;
			localStorage.setItem(EMAIL_KEY, value);
		},

		skipEmail() {
			email = '';
			localStorage.setItem(EMAIL_KEY, '');
		},

		setAge(group: AgeGroup) {
			ageGroup = group;
			localStorage.setItem(STORAGE_KEY, group);
		},

		clearAge() {
			ageGroup = null;
			localStorage.removeItem(STORAGE_KEY);
		},

		hasCompleted(moduleId: string): boolean {
			return completedModules.includes(moduleId);
		},

		markComplete(moduleId: string): void {
			if (!completedModules.includes(moduleId)) {
				completedModules = [...completedModules, moduleId];
				localStorage.setItem(COMPLETED_KEY, JSON.stringify(completedModules));
			}
		},

		clearProgress(): void {
			completedModules = [];
			localStorage.removeItem(COMPLETED_KEY);
		}
	};
}

export const visitor = createVisitor();
