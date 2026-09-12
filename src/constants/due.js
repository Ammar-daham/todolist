// Keys match utils/time.js's getDueStatus, so a filter chip means exactly
// what the matching per-item due badge already shows.
export const DUE_FILTERS = [
	{ key: 'overdue', label: 'Overdue', badge: 'danger', icon: 'bi-exclamation-circle' },
	{ key: 'upcoming', label: 'Upcoming', badge: 'warning', icon: 'bi-hourglass-split' },
]
