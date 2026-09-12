import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatRelativeTime, formatDueTime, formatDueDate, parseDueDateTime, getDueStatus } from './time'

describe('formatRelativeTime', () => {
	afterEach(() => vi.useRealTimers())

	it('returns an empty string for a falsy timestamp', () => {
		expect(formatRelativeTime(null)).toBe('')
		expect(formatRelativeTime(0)).toBe('')
	})

	it('buckets recent times into just now / seconds / minutes / hours / days', () => {
		const now = new Date(2024, 0, 15, 12, 0, 0).getTime()
		vi.useFakeTimers()
		vi.setSystemTime(now)

		expect(formatRelativeTime(now - 2_000)).toBe('just now')
		expect(formatRelativeTime(now - 30_000)).toBe('30s ago')
		expect(formatRelativeTime(now - 5 * 60_000)).toBe('5m ago')
		expect(formatRelativeTime(now - 3 * 3_600_000)).toBe('3h ago')
		expect(formatRelativeTime(now - 2 * 86_400_000)).toBe('2d ago')
	})

	it('falls back to a locale date string after a week', () => {
		const now = new Date(2024, 0, 15, 12, 0, 0).getTime()
		vi.useFakeTimers()
		vi.setSystemTime(now)

		const timestamp = now - 10 * 86_400_000
		expect(formatRelativeTime(timestamp)).toBe(new Date(timestamp).toLocaleDateString())
	})
})

describe('formatDueTime', () => {
	it('returns an empty string when there is no time', () => {
		expect(formatDueTime(null)).toBe('')
		expect(formatDueTime('')).toBe('')
	})

	it('formats a 24h time string as a localized clock time', () => {
		expect(formatDueTime('09:05')).toBe(new Date(2000, 0, 1, 9, 5).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }))
	})
})

describe('formatDueDate', () => {
	afterEach(() => vi.useRealTimers())

	it('returns an empty string when there is no date', () => {
		expect(formatDueDate(null)).toBe('')
	})

	it('labels today, tomorrow, and yesterday relative to now', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date(2024, 0, 15, 8, 0, 0))

		expect(formatDueDate('2024-01-15')).toBe('Today')
		expect(formatDueDate('2024-01-16')).toBe('Tomorrow')
		expect(formatDueDate('2024-01-14')).toBe('Yesterday')
	})

	it('appends the formatted time when a due time is given', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date(2024, 0, 15, 8, 0, 0))

		expect(formatDueDate('2024-01-15', '14:30')).toBe(`Today, ${formatDueTime('14:30')}`)
	})

	it('falls back to a month/day date for dates further out', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date(2024, 0, 15, 8, 0, 0))

		const label = formatDueDate('2024-03-01')
		expect(label).toBe(new Date(2024, 2, 1).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))
	})
})

describe('parseDueDateTime', () => {
	it('returns null when either the date or the time is missing', () => {
		expect(parseDueDateTime(null, '10:00')).toBeNull()
		expect(parseDueDateTime('2024-01-15', null)).toBeNull()
		expect(parseDueDateTime(null, null)).toBeNull()
	})

	it('combines the date and time into a single local timestamp', () => {
		const result = parseDueDateTime('2024-01-15', '09:30')
		expect(result).toBe(new Date(2024, 0, 15, 9, 30, 0, 0).getTime())
	})
})

describe('getDueStatus', () => {
	afterEach(() => vi.useRealTimers())

	it('returns null when there is no due date', () => {
		expect(getDueStatus(null, false)).toBeNull()
	})

	it('returns done when the task is complete, regardless of the date', () => {
		expect(getDueStatus('2000-01-01', true)).toBe('done')
	})

	it('classifies overdue, upcoming, and normal dates relative to today', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date(2024, 0, 15, 8, 0, 0))

		expect(getDueStatus('2024-01-14', false)).toBe('overdue')
		expect(getDueStatus('2024-01-15', false)).toBe('upcoming')
		expect(getDueStatus('2024-01-17', false)).toBe('upcoming')
		expect(getDueStatus('2024-01-18', false)).toBe('normal')
	})
})
