import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useTheme } from '../../src/composables/useTheme'

function mockMatchMedia(matches) {
	window.matchMedia = vi.fn().mockImplementation((query) => ({
		matches,
		media: query,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	}))
}

beforeEach(() => {
	localStorage.clear()
	document.documentElement.removeAttribute('data-bs-theme')
})

afterEach(() => {
	vi.restoreAllMocks()
})

describe('useTheme', () => {
	it('defaults to the OS preference when nothing is stored', () => {
		mockMatchMedia(true)
		const { isDark } = useTheme()
		expect(isDark.value).toBe(true)
		expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark')
	})

	it('prefers a stored preference over the OS setting', () => {
		mockMatchMedia(true)
		localStorage.setItem('todo-app.theme', 'light')

		const { isDark } = useTheme()
		expect(isDark.value).toBe(false)
		expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light')
	})

	it('toggles the theme, updates the DOM attribute, and persists the choice', async () => {
		mockMatchMedia(false)
		const { isDark, toggleTheme } = useTheme()

		toggleTheme()
		await Promise.resolve()

		expect(isDark.value).toBe(true)
		expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark')
		expect(localStorage.getItem('todo-app.theme')).toBe('dark')
	})
})
