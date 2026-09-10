export function buildEvents(todos) {
	const events = []
	for (const todo of todos) {
		events.push({ id: `${todo.id}-created`, type: 'created', at: todo.createdAt, todo })
		if (todo.completedAt) events.push({ id: `${todo.id}-completed`, type: 'completed', at: todo.completedAt, todo })
		if (todo.removedAt) events.push({ id: `${todo.id}-removed`, type: 'removed', at: todo.removedAt, todo })
	}
	return events.sort((a, b) => b.at - a.at)
}

function startOfDay(timestamp) {
	const d = new Date(timestamp)
	d.setHours(0, 0, 0, 0)
	return d
}

function startOfWeek(timestamp) {
	const d = startOfDay(timestamp)
	const mondayOffset = (d.getDay() + 6) % 7
	d.setDate(d.getDate() - mondayOffset)
	return d
}

function startOfMonth(timestamp) {
	const d = new Date(timestamp)
	return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfYear(timestamp) {
	const d = new Date(timestamp)
	return new Date(d.getFullYear(), 0, 1)
}

const GROUPERS = {
	day: {
		start: startOfDay,
		label: (d, now) =>
			d.toLocaleDateString(undefined, {
				weekday: 'short',
				month: 'short',
				day: 'numeric',
				year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
			}),
	},
	week: {
		start: startOfWeek,
		label: (d, now) =>
			`Week of ${d.toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
			})}`,
	},
	month: {
		start: startOfMonth,
		label: (d) => d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
	},
	year: {
		start: startOfYear,
		label: (d) => `${d.getFullYear()}`,
	},
}

export const HISTORY_GRANULARITIES = [
	{ key: 'day', label: 'Day' },
	{ key: 'week', label: 'Week' },
	{ key: 'month', label: 'Month' },
	{ key: 'year', label: 'Year' },
]

export function groupEvents(events, granularity) {
	const grouper = GROUPERS[granularity] ?? GROUPERS.day
	const now = new Date()
	const groups = new Map()

	for (const event of events) {
		const start = grouper.start(event.at)
		const key = start.getTime()
		if (!groups.has(key)) {
			groups.set(key, { key, label: grouper.label(start, now), events: [] })
		}
		groups.get(key).events.push(event)
	}

	return [...groups.values()].sort((a, b) => b.key - a.key)
}
