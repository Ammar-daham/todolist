import { ref, computed, watch } from 'vue'
import { THEME_PRESETS, DEFAULT_THEME_KEY } from '../constants/themes'
import { getPatternLayer } from '../utils/backgroundPatterns'

const STORAGE_KEY = 'todo-app.customTheme'

const CSS_VAR_NAMES = {
	accent: '--accent',
	accentStrong: '--accent-strong',
	accentSoft: '--accent-soft',
	accentContrast: '--accent-contrast',
	bgStart: '--bg-start',
	bgMid: '--bg-mid',
	bgEnd: '--bg-end',
}

function loadThemeKey() {
	try {
		const saved = localStorage.getItem(STORAGE_KEY)
		if (saved && THEME_PRESETS.some((t) => t.key === saved)) return saved
	} catch {
		/* ignore */
	}
	return DEFAULT_THEME_KEY
}

// A `null` field (only the Default preset uses this) removes the inline
// override so the light/dark stylesheet rules take over again — otherwise
// Default would stop following the theme toggle once another preset had run.
function applyPreset(preset) {
	const root = document.documentElement.style
	for (const [field, cssVar] of Object.entries(CSS_VAR_NAMES)) {
		if (preset[field] == null) root.removeProperty(cssVar)
		else root.setProperty(cssVar, preset[field])
	}

	const { image, size } = getPatternLayer(preset.pattern)
	root.setProperty('--bg-pattern', image)
	root.setProperty('--bg-pattern-size', size)
}

export function useCustomTheme() {
	const themeKey = ref(loadThemeKey())
	const preset = computed(() => THEME_PRESETS.find((t) => t.key === themeKey.value) ?? THEME_PRESETS[0])

	applyPreset(preset.value)

	function setTheme(key) {
		if (THEME_PRESETS.some((t) => t.key === key)) themeKey.value = key
	}

	watch(themeKey, () => {
		applyPreset(preset.value)
		try {
			localStorage.setItem(STORAGE_KEY, themeKey.value)
		} catch (err) {
			console.error('Failed to save theme preference:', err)
		}
	})

	return { themeKey, presets: THEME_PRESETS, setTheme }
}
