// Frequencies a task can repeat on. There's no separate "custom" mode — an
// arbitrary interval (e.g. "every 3 weeks") layered on top of one of these
// three units already covers the daily/weekly/custom range from the roadmap,
// without a bespoke days-of-week picker.
export const RECURRENCE_FREQUENCIES = [
	{ key: 'daily', label: 'Day(s)' },
	{ key: 'weekly', label: 'Week(s)' },
	{ key: 'monthly', label: 'Month(s)' },
]

export const DEFAULT_RECURRENCE_FREQUENCY = 'daily'
