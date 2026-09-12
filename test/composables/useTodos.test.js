import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useTodos } from './useTodos'
import { DEFAULT_LIST_ID } from './useLists'

// addTodo/toggleTodo/etc. all stamp with Date.now(), and calling them back to
// back in a test can land in the same millisecond — mock it so every call
// gets its own tick and ids/timestamps never collide.
let clock
beforeEach(() => {
	localStorage.clear()
	clock = 1_700_000_000_000
	vi.spyOn(Date, 'now').mockImplementation(() => clock++)
})

afterEach(() => {
	vi.restoreAllMocks()
})

function setup(listId = DEFAULT_LIST_ID) {
	return useTodos(ref(listId))
}

describe('addTodo', () => {
	it('adds a trimmed task to the active list with sane defaults', () => {
		const { addTodo, allTodos } = setup()
		addTodo('  Buy milk  ', 'high')

		expect(allTodos.value).toHaveLength(1)
		const todo = allTodos.value[0]
		expect(todo.text).toBe('Buy milk')
		expect(todo.priority).toBe('high')
		expect(todo.done).toBe(false)
		expect(todo.listId).toBe(DEFAULT_LIST_ID)
		expect(todo.completedAt).toBeNull()
		expect(todo.removedAt).toBeNull()
	})

	it('ignores a blank task', () => {
		const { addTodo, allTodos } = setup()
		addTodo('   ', 'low')
		expect(allTodos.value).toHaveLength(0)
	})

	it('only stores a due time when a due date is also given', () => {
		const { addTodo, allTodos } = setup()
		addTodo('No date', 'low', null, '09:00')
		expect(allTodos.value[0].dueTime).toBeNull()

		addTodo('With date', 'low', '2024-01-15', '09:00')
		expect(allTodos.value[1].dueTime).toBe('09:00')
	})
})

describe('editing and status changes', () => {
	it('edits a task, trimming and ignoring blank edits', () => {
		const { addTodo, editTodo, allTodos } = setup()
		addTodo('Original', 'low')
		const id = allTodos.value[0].id

		editTodo(id, '  Updated  ')
		expect(allTodos.value[0].text).toBe('Updated')

		editTodo(id, '   ')
		expect(allTodos.value[0].text).toBe('Updated')
	})

	it('toggles done and stamps/clears completedAt', () => {
		const { addTodo, toggleTodo, allTodos } = setup()
		addTodo('Task', 'low')
		const id = allTodos.value[0].id

		toggleTodo(id)
		expect(allTodos.value[0].done).toBe(true)
		expect(allTodos.value[0].completedAt).not.toBeNull()

		toggleTodo(id)
		expect(allTodos.value[0].done).toBe(false)
		expect(allTodos.value[0].completedAt).toBeNull()
	})

	it('sets priority', () => {
		const { addTodo, setPriority, allTodos } = setup()
		addTodo('Task', 'low')
		setPriority(allTodos.value[0].id, 'high')
		expect(allTodos.value[0].priority).toBe('high')
	})

	it('sets a due date and clears the due time when the date is cleared', () => {
		const { addTodo, setDueDate, allTodos } = setup()
		addTodo('Task', 'low')
		const id = allTodos.value[0].id

		setDueDate(id, '2024-02-01', '10:00')
		expect(allTodos.value[0].dueDate).toBe('2024-02-01')
		expect(allTodos.value[0].dueTime).toBe('10:00')

		setDueDate(id, null)
		expect(allTodos.value[0].dueDate).toBeNull()
		expect(allTodos.value[0].dueTime).toBeNull()
	})
})

describe('removal and lists', () => {
	it('soft-deletes and restores a task', () => {
		const { addTodo, removeTodo, restoreTodo, allTodos, removedTodos } = setup()
		addTodo('Task', 'low')
		const id = allTodos.value[0].id

		removeTodo(id)
		expect(allTodos.value.find((t) => t.id === id).removedAt).not.toBeNull()
		expect(removedTodos.value.map((t) => t.id)).toContain(id)

		restoreTodo(id)
		expect(allTodos.value.find((t) => t.id === id).removedAt).toBeNull()
	})

	it('permanently deletes a task', () => {
		const { addTodo, deleteTodoPermanently, allTodos } = setup()
		addTodo('Task', 'low')
		const id = allTodos.value[0].id

		deleteTodoPermanently(id)
		expect(allTodos.value).toHaveLength(0)
	})

	it('drops every task belonging to a deleted list', () => {
		const listA = ref('list-a')
		const { addTodo, allTodos, deleteTodosForList } = useTodos(listA)
		addTodo('In A', 'low')
		listA.value = 'list-b'
		addTodo('In B', 'low')

		deleteTodosForList('list-a')
		expect(allTodos.value.map((t) => t.text)).toEqual(['In B'])
	})
})

describe('clearCompleted', () => {
	it('soft-deletes done tasks and leaves the rest alone', () => {
		const { addTodo, toggleTodo, clearCompleted, allTodos, removedTodos } = setup()
		addTodo('Done', 'low')
		addTodo('Active', 'low')
		toggleTodo(allTodos.value[0].id)

		clearCompleted()

		expect(removedTodos.value.map((t) => t.text)).toEqual(['Done'])
		expect(allTodos.value.find((t) => t.text === 'Active').removedAt).toBeNull()
	})
})

// getDueStatus compares against the real wall-clock date (not the mocked
// Date.now() above, which only exists to keep ids/timestamps distinct), so
// due-date fixtures must be relative to today rather than fixed strings.
function dateOffset(days) {
	const d = new Date()
	d.setDate(d.getDate() + days)
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('filters and sorting', () => {
	function seed() {
		const state = setup()
		state.addTodo('Zebra', 'low', dateOffset(1)) // upcoming
		state.addTodo('Alpha', 'high', dateOffset(-5)) // overdue, but completed below so status is "done"
		state.addTodo('Middle', 'medium')
		state.toggleTodo(state.allTodos.value[1].id) // complete "Alpha"
		return state
	}

	it('filters by status', () => {
		const state = seed()
		state.statusFilter.value = 'completed'
		expect(state.filteredTodos.value.map((t) => t.text)).toEqual(['Alpha'])

		state.statusFilter.value = 'active'
		expect(state.filteredTodos.value.map((t) => t.text).sort()).toEqual(['Middle', 'Zebra'])
	})

	it('filters by priority', () => {
		const state = seed()
		state.togglePriorityFilter('high')
		expect(state.filteredTodos.value.map((t) => t.text)).toEqual(['Alpha'])
	})

	it('filters by due-date bucket', () => {
		const state = seed()
		state.toggleDueFilter('upcoming')
		expect(state.filteredTodos.value.map((t) => t.text)).toEqual(['Zebra'])
	})

	it('filters by search text, case-insensitively', () => {
		const state = seed()
		state.searchQuery.value = 'ZEB'
		expect(state.filteredTodos.value.map((t) => t.text)).toEqual(['Zebra'])
	})

	it('sorts alphabetically', () => {
		const state = seed()
		state.sortBy.value = 'alphabetical'
		expect(state.filteredTodos.value.map((t) => t.text)).toEqual(['Alpha', 'Middle', 'Zebra'])
	})

	it('sorts by priority (high before medium before low)', () => {
		const state = seed()
		state.sortBy.value = 'priority'
		expect(state.filteredTodos.value.map((t) => t.text)[0]).toBe('Alpha')
	})

	it('reports whether any filter/search is active', () => {
		const state = seed()
		expect(state.hasActiveFilters.value).toBe(false)
		state.searchQuery.value = 'a'
		expect(state.hasActiveFilters.value).toBe(true)
	})

	it('clearFilters resets status, priority, due, and search', () => {
		const state = seed()
		state.statusFilter.value = 'completed'
		state.togglePriorityFilter('high')
		state.toggleDueFilter('upcoming')
		state.searchQuery.value = 'zebra'

		state.clearFilters()

		expect(state.statusFilter.value).toBe('all')
		expect(state.priorityFilters.value).toEqual([])
		expect(state.dueFilters.value).toEqual([])
		expect(state.searchQuery.value).toBe('')
	})

	it('scopes visible/filtered tasks to the active list', () => {
		const listId = ref('list-a')
		const state = useTodos(listId)
		state.addTodo('In A', 'low')
		listId.value = 'list-b'
		state.addTodo('In B', 'low')

		expect(state.allTodos.value.map((t) => t.text)).toEqual(['In B'])
	})
})

describe('bulk actions', () => {
	function seed() {
		const state = setup()
		state.addTodo('One', 'low')
		state.addTodo('Two', 'low')
		state.addTodo('Three', 'low')
		return state
	}

	it('selects all currently visible tasks', () => {
		const state = seed()
		state.selectAllVisible()
		expect(state.selectedIds.value).toHaveLength(3)
	})

	it('bulk-completes only the selected tasks', () => {
		const state = seed()
		const [a, b] = state.allTodos.value
		state.toggleSelected(a.id)
		state.toggleSelected(b.id)

		state.bulkComplete()

		expect(state.allTodos.value.find((t) => t.id === a.id).done).toBe(true)
		expect(state.allTodos.value.find((t) => t.id === b.id).done).toBe(true)
		expect(state.allTodos.value.find((t) => t.text === 'Three').done).toBe(false)
		expect(state.selectedIds.value).toEqual([])
	})

	it('bulk-sets priority on the selection', () => {
		const state = seed()
		state.toggleSelected(state.allTodos.value[0].id)
		state.bulkSetPriority('high')
		expect(state.allTodos.value[0].priority).toBe('high')
		expect(state.allTodos.value[1].priority).not.toBe('high')
	})

	it('bulk-deletes (soft) the selection', () => {
		const state = seed()
		state.toggleSelected(state.allTodos.value[0].id)
		state.bulkDelete()
		expect(state.removedTodos.value).toHaveLength(1)
	})

	it('clears the selection when leaving the tasks view', async () => {
		const state = seed()
		state.selectAllVisible()
		state.view.value = 'history'
		await nextTick()
		expect(state.selectMode.value).toBe(false)
		expect(state.selectedIds.value).toEqual([])
	})

	it('clears the selection when the active list changes', async () => {
		const listId = ref('list-a')
		const state = useTodos(listId)
		state.addTodo('Task', 'low')
		state.selectAllVisible()

		listId.value = 'list-b'
		await nextTick()

		expect(state.selectedIds.value).toEqual([])
	})
})

describe('persistence', () => {
	it('saves todos to localStorage on change', async () => {
		const { addTodo } = setup()
		addTodo('Persist me', 'low')
		await Promise.resolve()

		const stored = JSON.parse(localStorage.getItem('todo-app.todos'))
		expect(stored).toHaveLength(1)
		expect(stored[0].text).toBe('Persist me')
	})

	it('back-fills missing fields on tasks saved before lists/due-dates existed', () => {
		localStorage.setItem('todo-app.todos', JSON.stringify([{ id: 1, text: 'Legacy', done: false }]))
		const { allTodos } = setup()

		const todo = allTodos.value[0]
		expect(todo.listId).toBe(DEFAULT_LIST_ID)
		expect(todo.completedAt).toBeNull()
		expect(todo.removedAt).toBeNull()
		expect(todo.dueDate).toBeNull()
	})

	it('recovers from corrupted todos JSON instead of throwing', () => {
		localStorage.setItem('todo-app.todos', '{not valid json')
		const { allTodos } = setup()
		expect(allTodos.value).toEqual([])
	})

	it('ignores an invalid stored sort/status/view and falls back to defaults', () => {
		localStorage.setItem('todo-app.filters', JSON.stringify({ view: 'bogus', statusFilter: 'bogus', sortBy: 'bogus' }))
		const { view, statusFilter, sortBy } = setup()
		expect(view.value).toBe('tasks')
		expect(statusFilter.value).toBe('all')
		expect(sortBy.value).toBe('priority')
	})
})
