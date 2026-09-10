import { ref, watch } from 'vue'

const THEME_KEY = 'todo-app.theme'

function loadTheme() {
	try {
		const saved = localStorage.getItem(THEME_KEY)
		if (saved) return saved === 'dark'
	} catch {
		/* ignore */
	}
	return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function applyTheme(dark) {
	document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light')
}

export function useTheme() {
	const isDark = ref(loadTheme())
	applyTheme(isDark.value)

	function toggleTheme() {
		isDark.value = !isDark.value
	}

	watch(isDark, (value) => {
		applyTheme(value)
		localStorage.setItem(THEME_KEY, value ? 'dark' : 'light')
	})

	return { isDark, toggleTheme }
}
