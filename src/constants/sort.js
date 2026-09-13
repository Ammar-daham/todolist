export const SORT_OPTIONS = [
	{ key: 'manual', label: 'Manual (drag to reorder)', icon: 'bi-arrows-move' },
	{ key: 'priority', label: 'Priority', icon: 'bi-flag' },
	{ key: 'dueDate', label: 'Due date', icon: 'bi-calendar-event' },
	{ key: 'newest', label: 'Newest first', icon: 'bi-sort-numeric-down-alt' },
	{ key: 'oldest', label: 'Oldest first', icon: 'bi-sort-numeric-down' },
	{ key: 'alphabetical', label: 'A → Z', icon: 'bi-sort-alpha-down' },
]

export const DEFAULT_SORT = 'priority'
