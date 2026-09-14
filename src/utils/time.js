export function formatRelativeTime(timestamp) {
	if (!timestamp) return ''

	const diffSec = Math.round((Date.now() - timestamp) / 1000)
	if (diffSec < 5) return 'just now'
	if (diffSec < 60) return `${diffSec}s ago`

	const diffMin = Math.round(diffSec / 60)
	if (diffMin < 60) return `${diffMin}m ago`

	const diffHour = Math.round(diffMin / 60)
	if (diffHour < 24) return `${diffHour}h ago`

	const diffDay = Math.round(diffHour / 24)
	if (diffDay < 7) return `${diffDay}d ago`

	return new Date(timestamp).toLocaleDateString()
}

function parseDueDate(dateStr) {
	const [y, m, d] = dateStr.split('-').map(Number)
	return new Date(y, m - 1, d)
}

function startOfToday() {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	return today
}

function toDateString(date) {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

// Today's date as a `dueDate`-shaped string, for defaulting a recurring
// task's anchor date when it doesn't already have a due date of its own.
export function todayDateString() {
	return toDateString(new Date())
}

function daysUntilDue(dateStr) {
	const diffMs = parseDueDate(dateStr) - startOfToday()
	return Math.round(diffMs / 86400000)
}

export function formatDueTime(timeStr) {
	if (!timeStr) return ''
	const [h, m] = timeStr.split(':').map(Number)
	const d = new Date()
	d.setHours(h, m, 0, 0)
	return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatDueDate(dateStr, timeStr) {
	if (!dateStr) return ''

	const diffDays = daysUntilDue(dateStr)
	let label
	if (diffDays === 0) label = 'Today'
	else if (diffDays === 1) label = 'Tomorrow'
	else if (diffDays === -1) label = 'Yesterday'
	else {
		const date = parseDueDate(dateStr)
		label = date.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() === startOfToday().getFullYear() ? undefined : 'numeric',
		})
	}
	return timeStr ? `${label}, ${formatDueTime(timeStr)}` : label
}

// The exact due moment, for the alert scheduler. Returns null when there's no
// time component — day-only due dates have no specific instant to alarm at,
// so they keep the existing overdue/upcoming badge behavior but don't page.
export function parseDueDateTime(dateStr, timeStr) {
	if (!dateStr || !timeStr) return null
	const [y, m, d] = dateStr.split('-').map(Number)
	const [h, min] = timeStr.split(':').map(Number)
	return new Date(y, m - 1, d, h, min, 0, 0).getTime()
}

// The next occurrence's due date for a recurring task, computed from the
// occurrence that was just completed rather than from "today" — so a task
// due every Monday stays anchored to Mondays even if it's completed late (or
// early), instead of drifting onto whatever day it happened to be checked off.
export function getNextDueDate(dateStr, recurrence) {
	if (!dateStr || !recurrence) return dateStr
	const n = Math.max(1, Math.round(recurrence.interval) || 1)
	const date = parseDueDate(dateStr)
	if (recurrence.frequency === 'weekly') date.setDate(date.getDate() + n * 7)
	else if (recurrence.frequency === 'monthly') date.setMonth(date.getMonth() + n)
	else date.setDate(date.getDate() + n) // daily is the default/fallback unit
	return toDateString(date)
}

export function formatRecurrence(recurrence) {
	if (!recurrence) return ''
	const n = Math.max(1, Math.round(recurrence.interval) || 1)
	const unit = { daily: 'day', weekly: 'week', monthly: 'month' }[recurrence.frequency] || 'day'
	if (n === 1) return { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[recurrence.frequency] || 'Daily'
	return `Every ${n} ${unit}s`
}

export function getDueStatus(dateStr, done) {
	if (!dateStr) return null
	if (done) return 'done'

	const diffDays = daysUntilDue(dateStr)
	if (diffDays < 0) return 'overdue'
	if (diffDays <= 2) return 'upcoming'
	return 'normal'
}
