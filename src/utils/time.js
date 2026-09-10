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
