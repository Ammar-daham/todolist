import { describe, it, expect, beforeEach } from 'vitest'
import { useLists, DEFAULT_LIST_ID } from '../../src/composables/useLists'

beforeEach(() => {
	localStorage.clear()
})

describe('useLists', () => {
	it('creates a default list when nothing is stored', () => {
		const { lists, activeListId } = useLists()
		expect(lists.value).toHaveLength(1)
		expect(lists.value[0].id).toBe(DEFAULT_LIST_ID)
		expect(activeListId.value).toBe(DEFAULT_LIST_ID)
	})

	it('restores lists and the active list from localStorage', () => {
		localStorage.setItem(
			'todo-app.lists',
			JSON.stringify([
				{ id: 'a', name: 'Work', createdAt: 1 },
				{ id: 'b', name: 'Home', createdAt: 2 },
			])
		)
		localStorage.setItem('todo-app.activeListId', 'b')

		const { lists, activeListId } = useLists()
		expect(lists.value.map((l) => l.id)).toEqual(['a', 'b'])
		expect(activeListId.value).toBe('b')
	})

	it('falls back to the first list when the stored active id no longer exists', () => {
		localStorage.setItem('todo-app.lists', JSON.stringify([{ id: 'a', name: 'Work', createdAt: 1 }]))
		localStorage.setItem('todo-app.activeListId', 'ghost')

		const { activeListId } = useLists()
		expect(activeListId.value).toBe('a')
	})

	it('adds a list, trims its name, and makes it active', () => {
		const { lists, activeListId, addList } = useLists()
		addList('  Groceries  ')

		expect(lists.value).toHaveLength(2)
		expect(lists.value[1].name).toBe('Groceries')
		expect(activeListId.value).toBe(lists.value[1].id)
	})

	it('ignores adding a blank list name', () => {
		const { lists, addList } = useLists()
		addList('   ')
		expect(lists.value).toHaveLength(1)
	})

	it('renames a list and trims the new name, ignoring blank input', () => {
		const { lists, renameList } = useLists()
		const id = lists.value[0].id

		renameList(id, '  Renamed  ')
		expect(lists.value[0].name).toBe('Renamed')

		renameList(id, '   ')
		expect(lists.value[0].name).toBe('Renamed')
	})

	it('only selects a list that actually exists', () => {
		const { lists, activeListId, addList, selectList } = useLists()
		addList('Second')
		const firstId = lists.value[0].id

		selectList(firstId)
		expect(activeListId.value).toBe(firstId)

		selectList('does-not-exist')
		expect(activeListId.value).toBe(firstId)
	})

	it('removes a list and moves the active selection off it', () => {
		const { lists, activeListId, addList, removeList } = useLists()
		addList('Second') // now active
		const secondId = activeListId.value
		const firstId = lists.value[0].id

		removeList(secondId)
		expect(lists.value).toHaveLength(1)
		expect(activeListId.value).toBe(firstId)
	})

	it('refuses to remove the last remaining list', () => {
		const { lists, removeList } = useLists()
		const id = lists.value[0].id

		removeList(id)
		expect(lists.value).toHaveLength(1)
	})

	it('persists lists and the active list id to localStorage', async () => {
		const { addList } = useLists()
		addList('Persisted')
		await Promise.resolve() // let the deep watcher flush

		const stored = JSON.parse(localStorage.getItem('todo-app.lists'))
		expect(stored.map((l) => l.name)).toContain('Persisted')
		expect(localStorage.getItem('todo-app.activeListId')).toBe(stored.at(-1).id)
	})
})
