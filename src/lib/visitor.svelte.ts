export type AgeGroup = '5-7' | '11-13' | '14+';

const STORAGE_KEY = 'mirokai_age_group';

function createVisitor() {
	let ageGroup = $state<AgeGroup | null>(null);
	let initialized = $state(false);

	return {
		get ageGroup() {
			return ageGroup;
		},
		get hasAge() {
			return ageGroup !== null;
		},
		get initialized() {
			return initialized;
		},

		init() {
			if (typeof localStorage !== 'undefined') {
				const stored = localStorage.getItem(STORAGE_KEY);
				if (stored === '5-7' || stored === '11-13' || stored === '14+') {
					ageGroup = stored;
				}
				initialized = true;
			}
		},

		setAge(group: AgeGroup) {
			ageGroup = group;
			localStorage.setItem(STORAGE_KEY, group);
		},

		clearAge() {
			ageGroup = null;
			localStorage.removeItem(STORAGE_KEY);
		}
	};
}

export const visitor = createVisitor();
