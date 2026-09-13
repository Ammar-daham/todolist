import { ref, computed, watch } from 'vue'
import { PRIORITY_ORDER } from '../constants/priorities'
import { SORT_OPTIONS, DEFAULT_SORT } from '../constants/sort'
import { STATUSES, DEFAULT_STATUS } from '../constants/status'
import { VIEWS, DEFAULT_VIEW } from '../constants/view'
import { DUE_FILTERS } from '../constants/due'
import { getDueStatus } from '../utils/time'
import { DEFAULT_LIST_ID } from './useLists'

const VALID_VIEWS = VIEWS.map((v) => v.key)
const VALID_STATUSES = STATUSES.map((s) => s.key)
const VALID_DUE_FILTERS = DUE_FILTERS.map((d) => d.key)
const VALID_SORTS = SORT_OPTIONS.map((s) => s.key)

const SORTERS = {
	priority: (a, b) => PRIORITY_ORDER.indexOf(a.priority || 'medium') - PRIORITY_ORDER.indexOf(b.priority || 'medium'),
	dueDate: (a, b) => {
		if (!a.dueDate && !b.dueDate) return 0
		if (!a.dueDate) return 1 // no due date sorts after any date
		if (!b.dueDate) return -1
		return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0
	},
	newest: (a, b) => b.createdAt - a.createdAt,
	oldest: (a, b) => a.createdAt - b.createdAt,
	alphabetical: (a, b) => a.text.localeCompare(b.text),
}

const STORAGE_KEY = 'todo-app.todos'
const FILTERS_STORAGE_KEY = 'todo-app.filters'

function loadTodos() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		const parsed = raw ? JSON.parse(raw) : []
		return parsed.map((todo) => ({
			completedAt: null,
			removedAt: null,
			dueDate: null,
			dueTime: null,
			notes: null,
			subtasks: [],
			...todo,
			// Guard against a corrupted/legacy value that isn't actually an array.
			subtasks: Array.isArray(todo.subtasks) ? todo.subtasks : [],
			// Todos saved before lists existed have no listId — fold them into
			// the default list so nothing already on the board disappears.
			listId: todo.listId ?? DEFAULT_LIST_ID,
			createdAt: todo.createdAt ?? Date.now(),
		}))
	} catch {
		return []
	}
}

// Search is intentionally excluded — a stale search term reappearing on
// reopen tends to confuse more than it helps, unlike the toolbar's toggles.
function loadFilterState() {
	const defaults = {
		view: DEFAULT_VIEW,
		statusFilter: DEFAULT_STATUS,
		priorityFilters: [],
		dueFilters: [],
		sortBy: DEFAULT_SORT,
	}
	try {
		const raw = localStorage.getItem(FILTERS_STORAGE_KEY)
		if (!raw) return defaults
		const parsed = JSON.parse(raw)
		return {
			view: VALID_VIEWS.includes(parsed.view) ? parsed.view : defaults.view,
			statusFilter: VALID_STATUSES.includes(parsed.statusFilter) ? parsed.statusFilter : defaults.statusFilter,
			priorityFilters: Array.isArray(parsed.priorityFilters)
				? parsed.priorityFilters.filter((key) => PRIORITY_ORDER.includes(key))
				: defaults.priorityFilters,
			dueFilters: Array.isArray(parsed.dueFilters)
				? parsed.dueFilters.filter((key) => VALID_DUE_FILTERS.includes(key))
				: defaults.dueFilters,
			sortBy: VALID_SORTS.includes(parsed.sortBy) ? parsed.sortBy : defaults.sortBy,
		}
	} catch {
		return defaults
	}
}

export function useTodos(activeListId) {
	const todos = ref(loadTodos())

	const savedFilters = loadFilterState()

	// Which collection is on screen: the task list, the bin, or the activity log.
	const view = ref(savedFilters.view)
	// Filters applied within the current view.
	const statusFilter = ref(savedFilters.statusFilter)
	// Empty means "every priority" — there is no separate "All" button.
	const priorityFilters = ref(savedFilters.priorityFilters)
	// Same convention: empty means every due-date bucket. Keys match getDueStatus
	// ('overdue' / 'upcoming') so a chip means exactly what its item badge shows.
	const dueFilters = ref(savedFilters.dueFilters)
	// Not persisted — see loadFilterState.
	const searchQuery = ref('')
	// Ordering, independent of filtering — changing it never hides a task.
	const sortBy = ref(savedFilters.sortBy)

	// Remember the toolbar's state across visits, same as todos above. A
	// failure here is a lost preference, not lost data, so it's logged but
	// doesn't need its own user-facing error like saveError.
	watch([view, statusFilter, priorityFilters, dueFilters, sortBy], () => {
		try {
			localStorage.setItem(
				FILTERS_STORAGE_KEY,
				JSON.stringify({
					view: view.value,
					statusFilter: statusFilter.value,
					priorityFilters: priorityFilters.value,
					dueFilters: dueFilters.value,
					sortBy: sortBy.value,
				})
			)
		} catch (err) {
			console.error('Failed to save filter preferences:', err)
		}
	})

	// localStorage is our only persistence layer, so a write failure (quota
	// exceeded, private browsing lockdown, etc.) must never pass silently —
	// the user would otherwise keep working on tasks that are quietly not
	// being saved. `saveError` lets the UI surface that to them.
	const saveError = ref(null)

	watch(
		todos,
		(value) => {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
				saveError.value = null
			} catch (err) {
				saveError.value = err
				console.error('Failed to save todos to localStorage:', err)
			}
		},
		{ deep: true }
	)

	function addTodo(text, priority, dueDate = null, dueTime = null, notes = null) {
		const trimmed = text.trim()
		if (!trimmed) return
		todos.value.push({
			id: Date.now(),
			text: trimmed,
			done: false,
			priority,
			dueDate,
			dueTime: dueDate ? dueTime : null,
			notes: notes ? notes.trim() || null : null,
			subtasks: [],
			listId: activeListId.value,
			createdAt: Date.now(),
			completedAt: null,
			removedAt: null,
		})
	}

	// Called when a list is deleted — its tasks have nowhere left to live, so
	// they're dropped for good rather than orphaned under a list that no
	// longer exists.
	function deleteTodosForList(listId) {
		todos.value = todos.value.filter((todo) => todo.listId !== listId)
	}

	function editTodo(id, text) {
		const trimmed = text.trim()
		if (!trimmed) return
		const todo = todos.value.find((t) => t.id === id)
		if (todo) todo.text = trimmed
	}

	function setDueDate(id, dueDate, dueTime = null) {
		const todo = todos.value.find((t) => t.id === id)
		if (!todo) return
		todo.dueDate = dueDate || null
		todo.dueTime = todo.dueDate ? dueTime || null : null
	}

	function setPriority(id, priority) {
		const todo = todos.value.find((t) => t.id === id)
		if (todo) todo.priority = priority
	}

	function setNotes(id, notes) {
		const todo = todos.value.find((t) => t.id === id)
		if (!todo) return
		const trimmed = typeof notes === 'string' ? notes.trim() : ''
		todo.notes = trimmed || null
	}

	function addSubtask(todoId, text) {
		const trimmed = text.trim()
		if (!trimmed) return
		const todo = todos.value.find((t) => t.id === todoId)
		if (!todo) return
		todo.subtasks.push({ id: Date.now(), text: trimmed, done: false })
	}

	function editSubtask(todoId, subtaskId, text) {
		const trimmed = text.trim()
		if (!trimmed) return
		const todo = todos.value.find((t) => t.id === todoId)
		const subtask = todo?.subtasks.find((s) => s.id === subtaskId)
		if (subtask) subtask.text = trimmed
	}

	function toggleSubtask(todoId, subtaskId) {
		const todo = todos.value.find((t) => t.id === todoId)
		const subtask = todo?.subtasks.find((s) => s.id === subtaskId)
		if (subtask) subtask.done = !subtask.done
	}

	function removeSubtask(todoId, subtaskId) {
		const todo = todos.value.find((t) => t.id === todoId)
		if (!todo) return
		todo.subtasks = todo.subtasks.filter((s) => s.id !== subtaskId)
	}

	function toggleTodo(id) {
		const todo = todos.value.find((t) => t.id === id)
		if (!todo) return
		todo.done = !todo.done
		todo.completedAt = todo.done ? Date.now() : null
	}

	function removeTodo(id) {
		const todo = todos.value.find((t) => t.id === id)
		if (todo) todo.removedAt = Date.now()
	}

	function restoreTodo(id) {
		const todo = todos.value.find((t) => t.id === id)
		if (todo) todo.removedAt = null
	}

	function deleteTodoPermanently(id) {
		todos.value = todos.value.filter((todo) => todo.id !== id)
	}

	function clearCompleted() {
		const now = Date.now()
		todos.value.forEach((todo) => {
			if (todo.done && !todo.removedAt) todo.removedAt = now
		})
	}

	function togglePriorityFilter(key) {
		const current = priorityFilters.value
		priorityFilters.value = current.includes(key) ? current.filter((p) => p !== key) : [...current, key]
	}

	function toggleDueFilter(key) {
		const current = dueFilters.value
		dueFilters.value = current.includes(key) ? current.filter((d) => d !== key) : [...current, key]
	}

	function clearFilters() {
		statusFilter.value = DEFAULT_STATUS
		priorityFilters.value = []
		dueFilters.value = []
		searchQuery.value = ''
	}

	const hasActiveFilters = computed(
		() =>
			statusFilter.value !== DEFAULT_STATUS ||
			priorityFilters.value.length > 0 ||
			dueFilters.value.length > 0 ||
			searchQuery.value.trim() !== ''
	)

	// The active list narrows every view (Tasks, Removed, History) exactly
	// like the priority/due/search filters already do below.
	const todosInActiveList = computed(() => todos.value.filter((t) => t.listId === activeListId.value))

	const visibleTodos = computed(() => {
		const query = searchQuery.value.trim().toLowerCase()
		const priorities = priorityFilters.value
		const dues = dueFilters.value
		return todosInActiveList.value.filter((t) => {
			const matchesPriority = !priorities.length || priorities.includes(t.priority || 'medium')
			const matchesDue = !dues.length || dues.includes(getDueStatus(t.dueDate, t.done))
			const matchesSearch = !query || t.text.toLowerCase().includes(query) || (t.notes ?? '').toLowerCase().includes(query)
			return matchesPriority && matchesDue && matchesSearch
		})
	})

	const hasAnyTodos = computed(() => todosInActiveList.value.some((t) => !t.removedAt))

	// Unfiltered by search/priority/due chips, and by the active list too — the
	// due-alert scheduler must check every active task across every list, not
	// just whatever the toolbar currently shows.
	const alertableTodos = computed(() => todos.value.filter((t) => !t.removedAt))

	const activeTodos = computed(() => visibleTodos.value.filter((t) => !t.removedAt))

	const filteredTodos = computed(() => {
		let list = activeTodos.value
		if (statusFilter.value === 'active') list = list.filter((t) => !t.done)
		if (statusFilter.value === 'completed') list = list.filter((t) => t.done)
		const sorter = SORTERS[sortBy.value] ?? SORTERS[DEFAULT_SORT]
		return [...list].sort(sorter)
	})

	// Bulk selection — Tasks view only. Not persisted: reopening the app
	// already in select mode with a stale selection would be confusing.
	const selectMode = ref(false)
	const selectedIds = ref([])

	// Leaving Tasks (e.g. to check Removed) invalidates any in-progress
	// selection, so don't let it linger for when the user comes back.
	watch(view, (value) => {
		if (value !== DEFAULT_VIEW) {
			selectMode.value = false
			selectedIds.value = []
		}
	})

	// Switching lists changes which tasks are even on screen, so a selection
	// made in the previous list can't carry over meaningfully.
	watch(activeListId, () => {
		selectMode.value = false
		selectedIds.value = []
	})

	function toggleSelectMode() {
		selectMode.value = !selectMode.value
		selectedIds.value = []
	}

	function toggleSelected(id) {
		const current = selectedIds.value
		selectedIds.value = current.includes(id) ? current.filter((i) => i !== id) : [...current, id]
	}

	function selectAllVisible() {
		selectedIds.value = filteredTodos.value.map((t) => t.id)
	}

	function clearSelection() {
		selectedIds.value = []
	}

	function bulkComplete() {
		const now = Date.now()
		const ids = new Set(selectedIds.value)
		todos.value.forEach((todo) => {
			if (ids.has(todo.id) && !todo.done) {
				todo.done = true
				todo.completedAt = now
			}
		})
		selectedIds.value = []
	}

	function bulkSetPriority(priority) {
		const ids = new Set(selectedIds.value)
		todos.value.forEach((todo) => {
			if (ids.has(todo.id)) todo.priority = priority
		})
		selectedIds.value = []
	}

	function bulkDelete() {
		const now = Date.now()
		const ids = new Set(selectedIds.value)
		todos.value.forEach((todo) => {
			if (ids.has(todo.id)) todo.removedAt = now
		})
		selectedIds.value = []
	}

	const removedTodos = computed(() =>
		[...visibleTodos.value].filter((t) => t.removedAt).sort((a, b) => b.removedAt - a.removedAt)
	)

	const allTodos = computed(() => visibleTodos.value)

	const totalCount = computed(() => activeTodos.value.length)
	const remainingCount = computed(() => activeTodos.value.filter((t) => !t.done).length)
	const progress = computed(() =>
		totalCount.value ? Math.round(((totalCount.value - remainingCount.value) / totalCount.value) * 100) : 0
	)

	return {
		view,
		statusFilter,
		priorityFilters,
		dueFilters,
		searchQuery,
		sortBy,
		hasActiveFilters,
		togglePriorityFilter,
		toggleDueFilter,
		clearFilters,
		filteredTodos,
		removedTodos,
		allTodos,
		hasAnyTodos,
		alertableTodos,
		saveError,
		selectMode,
		selectedIds,
		toggleSelectMode,
		toggleSelected,
		selectAllVisible,
		clearSelection,
		bulkComplete,
		bulkSetPriority,
		bulkDelete,
		addTodo,
		editTodo,
		setDueDate,
		setPriority,
		setNotes,
		addSubtask,
		editSubtask,
		toggleSubtask,
		removeSubtask,
		toggleTodo,
		removeTodo,
		restoreTodo,
		deleteTodoPermanently,
		deleteTodosForList,
		clearCompleted,
		totalCount,
		remainingCount,
		progress,
	}
}
