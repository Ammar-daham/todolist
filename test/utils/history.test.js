import { describe, it, expect } from 'vitest'
import { buildEvents, groupEvents } from '../../src/utils/history'

function makeTodo(overrides = {}) {
	return {
		id: 1,
		text: 'Task',
		createdAt: new Date(2024, 0, 10, 9, 0).getTime(),
		completedAt: null,
		removedAt: null,
		...overrides,
	}
}

describe('buildEvents', () => {
	it('always emits a created event', () => {
		const todo = makeTodo()
		const events = buildEvents([todo])
		expect(events).toHaveLength(1)
		expect(events[0]).toMatchObject({ type: 'created', at: todo.createdAt, todo })
	})

	it('adds completed and removed events only when those timestamps are set', () => {
		const todo = makeTodo({
			completedAt: new Date(2024, 0, 11, 9, 0).getTime(),
			removedAt: new Date(2024, 0, 12, 9, 0).getTime(),
		})
		const events = buildEvents([todo])
		const types = events.map((e) => e.type)
		expect(types).toEqual(expect.arrayContaining(['created', 'completed', 'removed']))
		expect(events).toHaveLength(3)
	})

	it('sorts events newest first across multiple todos', () => {
		const earlier = makeTodo({ id: 1, createdAt: new Date(2024, 0, 10).getTime() })
		const later = makeTodo({ id: 2, createdAt: new Date(2024, 0, 12).getTime() })
		const events = buildEvents([earlier, later])
		expect(events.map((e) => e.todo.id)).toEqual([2, 1])
	})
})

describe('groupEvents', () => {
	it('groups events by day and sorts groups newest first', () => {
		const day1 = new Date(2024, 0, 10, 9, 0).getTime()
		const day2 = new Date(2024, 0, 12, 9, 0).getTime()
		const events = [
			{ id: 'a', type: 'created', at: day1, todo: makeTodo({ id: 1 }) },
			{ id: 'b', type: 'created', at: day2, todo: makeTodo({ id: 2 }) },
			{ id: 'c', type: 'created', at: day1 + 3600_000, todo: makeTodo({ id: 3 }) },
		]

		const groups = groupEvents(events, 'day')
		expect(groups).toHaveLength(2)
		expect(groups[0].events).toHaveLength(1)
		expect(groups[1].events).toHaveLength(2)
	})

	it('falls back to day grouping for an unknown granularity', () => {
		const at = new Date(2024, 0, 10, 9, 0).getTime()
		const events = [{ id: 'a', type: 'created', at, todo: makeTodo() }]
		expect(groupEvents(events, 'bogus')).toEqual(groupEvents(events, 'day'))
	})

	it('groups by month and year for coarser granularities', () => {
		const jan = new Date(2024, 0, 5).getTime()
		const feb = new Date(2024, 1, 5).getTime()
		const events = [
			{ id: 'a', type: 'created', at: jan, todo: makeTodo({ id: 1 }) },
			{ id: 'b', type: 'created', at: feb, todo: makeTodo({ id: 2 }) },
		]

		expect(groupEvents(events, 'month')).toHaveLength(2)
		expect(groupEvents(events, 'year')).toHaveLength(1)
	})
})
