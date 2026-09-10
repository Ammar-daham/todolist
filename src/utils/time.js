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

export function formatDueDate(dateStr) {
	if (!dateStr) return ''

	const diffDays = daysUntilDue(dateStr)
	if (diffDays === 0) return 'Today'
	if (diffDays === 1) return 'Tomorrow'
	if (diffDays === -1) return 'Yesterday'

	const date = parseDueDate(dateStr)
	return date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: date.getFullYear() === startOfToday().getFullYear() ? undefined : 'numeric',
	})
}

export function getDueStatus(dateStr, done) {
	if (!dateStr) return null
	if (done) return 'done'

	const diffDays = daysUntilDue(dateStr)
	if (diffDays < 0) return 'overdue'
	if (diffDays <= 2) return 'upcoming'
	return 'normal'
}
