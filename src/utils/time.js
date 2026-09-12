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

export function getDueStatus(dateStr, done) {
	if (!dateStr) return null
	if (done) return 'done'

	const diffDays = daysUntilDue(dateStr)
	if (diffDays < 0) return 'overdue'
	if (diffDays <= 2) return 'upcoming'
	return 'normal'
}
