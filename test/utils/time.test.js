import { describe, it, expect, vi, afterEach } from 'vitest'
import {
	formatRelativeTime,
	formatDueTime,
	formatDueDate,
	parseDueDateTime,
	getDueStatus,
	getNextDueDate,
	formatRecurrence,
	todayDateString,
} from '../../src/utils/time'

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

describe('getNextDueDate', () => {
	it('returns the original date unchanged when there is no date or no recurrence', () => {
		expect(getNextDueDate(null, { frequency: 'daily', interval: 1 })).toBeNull()
		expect(getNextDueDate('2024-01-15', null)).toBe('2024-01-15')
	})

	it('advances by the interval in days for daily recurrence', () => {
		expect(getNextDueDate('2024-01-15', { frequency: 'daily', interval: 1 })).toBe('2024-01-16')
		expect(getNextDueDate('2024-01-15', { frequency: 'daily', interval: 3 })).toBe('2024-01-18')
	})

	it('advances by the interval in weeks for weekly recurrence', () => {
		expect(getNextDueDate('2024-01-15', { frequency: 'weekly', interval: 1 })).toBe('2024-01-22')
		expect(getNextDueDate('2024-01-15', { frequency: 'weekly', interval: 2 })).toBe('2024-01-29')
	})

	it('advances by the interval in months for monthly recurrence', () => {
		expect(getNextDueDate('2024-01-15', { frequency: 'monthly', interval: 1 })).toBe('2024-02-15')
		expect(getNextDueDate('2024-01-31', { frequency: 'monthly', interval: 1 })).toBe('2024-03-02') // Feb has no 31st
	})

	it('anchors to the original due date rather than today, so a late completion does not shift the schedule', () => {
		// e.g. a task due every Monday, completed a day late on Tuesday, should
		// still land on the following Monday — not "a week from Tuesday".
		expect(getNextDueDate('2024-01-15', { frequency: 'weekly', interval: 1 })).toBe('2024-01-22')
	})

	it('treats a missing/invalid interval as 1', () => {
		expect(getNextDueDate('2024-01-15', { frequency: 'daily' })).toBe('2024-01-16')
	})
})

describe('formatRecurrence', () => {
	it('returns an empty string when there is no recurrence', () => {
		expect(formatRecurrence(null)).toBe('')
	})

	it('labels a 1-interval recurrence by its plain frequency name', () => {
		expect(formatRecurrence({ frequency: 'daily', interval: 1 })).toBe('Daily')
		expect(formatRecurrence({ frequency: 'weekly', interval: 1 })).toBe('Weekly')
		expect(formatRecurrence({ frequency: 'monthly', interval: 1 })).toBe('Monthly')
	})

	it('labels a custom interval as "Every N <unit>s"', () => {
		expect(formatRecurrence({ frequency: 'daily', interval: 3 })).toBe('Every 3 days')
		expect(formatRecurrence({ frequency: 'weekly', interval: 2 })).toBe('Every 2 weeks')
	})
})

describe('todayDateString', () => {
	afterEach(() => vi.useRealTimers())

	it('formats the current date as YYYY-MM-DD', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date(2024, 0, 5, 8, 0, 0))
		expect(todayDateString()).toBe('2024-01-05')
	})
})
