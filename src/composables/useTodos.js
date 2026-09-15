import { ref, computed, watch } from 'vue'
import { PRIORITY_ORDER } from '../constants/priorities'
import { SORT_OPTIONS, DEFAULT_SORT } from '../constants/sort'
import { STATUSES, DEFAULT_STATUS } from '../constants/status'
import { VIEWS, DEFAULT_VIEW } from '../constants/view'
import { DUE_FILTERS } from '../constants/due'
import { RECURRENCE_FREQUENCIES, DEFAULT_RECURRENCE_FREQUENCY } from '../constants/recurrence'
import { getDueStatus, getNextDueDate, todayDateString } from '../utils/time'
import { DEFAULT_LIST_ID } from './useLists'

const VALID_VIEWS = VIEWS.map((v) => v.key)
const VALID_STATUSES = STATUSES.map((s) => s.key)
const VALID_DUE_FILTERS = DUE_FILTERS.map((d) => d.key)
const VALID_SORTS = SORT_OPTIONS.map((s) => s.key)
const VALID_RECURRENCE_FREQUENCIES = RECURRENCE_FREQUENCIES.map((f) => f.key)

function isValidRecurrence(recurrence) {
	return (
		recurrence != null &&
		typeof recurrence === 'object' &&
		VALID_RECURRENCE_FREQUENCIES.includes(recurrence.frequency) &&
		Number.isFinite(recurrence.interval) &&
		recurrence.interval >= 1
	)
}

const SORTERS = {
	// No-op — Array#sort is required to be stable (ES2019+), so this just
	// preserves whatever order the todos are already in. That order is exactly
	// what reorderTodo() mutates via drag-and-drop, so "manual" really means
	// "the order they're stored in".
	manual: () => 0,
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

// Trims each tag, drops blanks, and de-dupes case-insensitively (keeping the
// first-seen casing) — shared by addTodo's initial tags and addTag below so
// a task can't end up with both "Work" and "work".
function normalizeTags(tags) {
	const seen = new Set()
	const result = []
	for (const raw of tags) {
		const trimmed = typeof raw === 'string' ? raw.trim() : ''
		if (!trimmed) continue
		const key = trimmed.toLowerCase()
		if (seen.has(key)) continue
		seen.add(key)
		result.push(trimmed)
	}
	return result
}

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
			tags: [],
			recurrence: null,
			...todo,
			// Guard against a corrupted/legacy value that isn't actually an array.
			subtasks: Array.isArray(todo.subtasks) ? todo.subtasks : [],
			tags: Array.isArray(todo.tags) ? todo.tags : [],
			recurrence: isValidRecurrence(todo.recurrence) ? todo.recurrence : null,
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
		tagFilters: [],
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
			// Tags are free-form, so there's no fixed vocabulary to validate
			// against — just make sure it's a list of strings. A tag filter that
			// no longer exists in the data simply matches nothing, harmlessly.
			tagFilters: Array.isArray(parsed.tagFilters)
				? parsed.tagFilters.filter((tag) => typeof tag === 'string')
				: defaults.tagFilters,
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
	// Same convention as priority/due, but the vocabulary is whatever tags exist
	// in the data (see allTags) rather than a fixed set of constants.
	const tagFilters = ref(savedFilters.tagFilters)
	// Not persisted — see loadFilterState.
	const searchQuery = ref('')
	// Ordering, independent of filtering — changing it never hides a task.
	const sortBy = ref(savedFilters.sortBy)

	// Remember the toolbar's state across visits, same as todos above. A
	// failure here is a lost preference, not lost data, so it's logged but
	// doesn't need its own user-facing error like saveError.
	watch([view, statusFilter, priorityFilters, dueFilters, tagFilters, sortBy], () => {
		try {
			localStorage.setItem(
				FILTERS_STORAGE_KEY,
				JSON.stringify({
					view: view.value,
					statusFilter: statusFilter.value,
					priorityFilters: priorityFilters.value,
					dueFilters: dueFilters.value,
					tagFilters: tagFilters.value,
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

	function addTodo(text, priority, dueDate = null, dueTime = null, notes = null, tags = []) {
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
			tags: normalizeTags(tags),
			recurrence: null,
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

	// `recurrence` is `{ frequency, interval }` or null to turn recurrence off.
	// Repeating only means something with an anchor date to count from, so
	// turning it on defaults the due date to today when the task doesn't have
	// one yet, rather than silently storing a rule that can never fire.
	function setRecurrence(id, recurrence) {
		const todo = todos.value.find((t) => t.id === id)
		if (!todo) return
		if (!recurrence) {
			todo.recurrence = null
			return
		}
		const frequency = VALID_RECURRENCE_FREQUENCIES.includes(recurrence.frequency)
			? recurrence.frequency
			: DEFAULT_RECURRENCE_FREQUENCY
		const interval = Math.max(1, Math.round(Number(recurrence.interval)) || 1)
		todo.recurrence = { frequency, interval }
		if (!todo.dueDate) todo.dueDate = todayDateString()
	}

	// Completing a recurring task spawns its next occurrence as a fresh,
	// independent task rather than resetting this one in place — that way the
	// just-finished instance still shows up as "done" in the completed filter
	// and in history, exactly like a one-off task would.
	function spawnNextOccurrence(todo) {
		todos.value.push({
			id: Date.now(),
			text: todo.text,
			done: false,
			priority: todo.priority,
			dueDate: getNextDueDate(todo.dueDate, todo.recurrence),
			dueTime: todo.dueTime,
			notes: todo.notes,
			// Subtasks carry over as a fresh, unchecked checklist — same shape,
			// new ids, so ticking them off on this occurrence doesn't retroactively
			// affect the completed one.
			subtasks: todo.subtasks.map((s) => ({ id: Date.now(), text: s.text, done: false })),
			tags: [...todo.tags],
			recurrence: { ...todo.recurrence },
			listId: todo.listId,
			createdAt: Date.now(),
			completedAt: null,
			removedAt: null,
		})
	}

	function addTag(id, tag) {
		const trimmed = tag.trim()
		if (!trimmed) return
		const todo = todos.value.find((t) => t.id === id)
		if (!todo) return
		if (todo.tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return
		todo.tags.push(trimmed)
	}

	function removeTag(id, tag) {
		const todo = todos.value.find((t) => t.id === id)
		if (!todo) return
		todo.tags = todo.tags.filter((t) => t !== tag)
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
		const completing = !todo.done
		todo.done = completing
		todo.completedAt = completing ? Date.now() : null
		// Un-completing later doesn't retract the spawned occurrence — it
		// already exists as its own task by then, same as if it'd been added
		// by hand.
		if (completing && todo.recurrence && todo.dueDate) {
			spawnNextOccurrence(todo)
		}
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

	// Moves `draggedId` to sit next to `targetId` in the underlying storage
	// order — the same order the 'manual' sorter (a no-op) leaves untouched.
	// Re-inserting at the target's pre-removal index naturally lands the item
	// just after the target when dragging downward, and just before it when
	// dragging upward — removing the dragged item first only shifts indices
	// *after* it, so which side of the target you land on falls out of the
	// splice math for free, without branching on direction.
	function reorderTodo(draggedId, targetId) {
		if (draggedId === targetId) return
		const list = todos.value
		const fromIndex = list.findIndex((t) => t.id === draggedId)
		const toIndex = list.findIndex((t) => t.id === targetId)
		if (fromIndex === -1 || toIndex === -1) return

		const [item] = list.splice(fromIndex, 1)
		list.splice(toIndex, 0, item)
	}

	function togglePriorityFilter(key) {
		const current = priorityFilters.value
		priorityFilters.value = current.includes(key) ? current.filter((p) => p !== key) : [...current, key]
	}

	function toggleDueFilter(key) {
		const current = dueFilters.value
		dueFilters.value = current.includes(key) ? current.filter((d) => d !== key) : [...current, key]
	}

	function toggleTagFilter(tag) {
		const current = tagFilters.value
		tagFilters.value = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
	}

	function clearFilters() {
		statusFilter.value = DEFAULT_STATUS
		priorityFilters.value = []
		dueFilters.value = []
		tagFilters.value = []
		searchQuery.value = ''
	}

	const hasActiveFilters = computed(
		() =>
			statusFilter.value !== DEFAULT_STATUS ||
			priorityFilters.value.length > 0 ||
			dueFilters.value.length > 0 ||
			tagFilters.value.length > 0 ||
			searchQuery.value.trim() !== ''
	)

	// The active list narrows every view (Tasks, Removed, History) exactly
	// like the priority/due/search filters already do below.
	const todosInActiveList = computed(() => todos.value.filter((t) => t.listId === activeListId.value))

	// Tags are free-form, so — unlike priority/due — there's no fixed set of
	// filter chips to render. This derives that vocabulary from whatever's
	// actually in use in the active list, independent of the other filters
	// currently applied, so toggling one tag doesn't make the others vanish.
	const allTags = computed(() => {
		const tags = new Set()
		todosInActiveList.value.forEach((t) => {
			if (!t.removedAt) t.tags.forEach((tag) => tags.add(tag))
		})
		return [...tags].sort((a, b) => a.localeCompare(b))
	})

	const visibleTodos = computed(() => {
		const query = searchQuery.value.trim().toLowerCase()
		const priorities = priorityFilters.value
		const dues = dueFilters.value
		const tags = tagFilters.value
		return todosInActiveList.value.filter((t) => {
			const matchesPriority = !priorities.length || priorities.includes(t.priority || 'medium')
			const matchesDue = !dues.length || dues.includes(getDueStatus(t.dueDate, t.done))
			const matchesTags = !tags.length || tags.some((tag) => t.tags.includes(tag))
			const matchesSearch =
				!query ||
				t.text.toLowerCase().includes(query) ||
				(t.notes ?? '').toLowerCase().includes(query) ||
				t.tags.some((tag) => tag.toLowerCase().includes(query))
			return matchesPriority && matchesDue && matchesTags && matchesSearch
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

	// Real undo/redo — a snapshot history of the whole todos array (every
	// list, not just the active one), so any data-changing action (text
	// edits, priority/notes/tags/subtasks/due-date/recurrence changes,
	// add/remove/restore, reordering, and bulk actions) can be undone, not
	// just the soft-delete/restore pair the Removed view already covers on
	// its own. Deliberately in-memory only (not persisted to localStorage) —
	// like the bulk-selection state above, a stale history reappearing after
	// a reload would be more confusing than useful.
	const MAX_UNDO_STEPS = 50
	const undoStack = ref([])
	const redoStack = ref([])

	function snapshotTodos() {
		return JSON.parse(JSON.stringify(todos.value))
	}

	// Wraps a mutating function so that, if it actually changed the data, the
	// prior state is pushed onto the undo stack and the redo stack is
	// cleared. Comparing before/after (rather than pushing unconditionally)
	// keeps no-op calls — a blank edit, an add-tag with no todo found, etc. —
	// from cluttering the undo history with steps that would visibly do
	// nothing when undone.
	function withUndo(mutator) {
		return (...args) => {
			const before = snapshotTodos()
			mutator(...args)
			if (JSON.stringify(before) === JSON.stringify(todos.value)) return
			undoStack.value.push(before)
			if (undoStack.value.length > MAX_UNDO_STEPS) undoStack.value.shift()
			redoStack.value = []
		}
	}

	function undo() {
		if (!undoStack.value.length) return
		const previous = undoStack.value.pop()
		redoStack.value.push(snapshotTodos())
		todos.value = previous
	}

	function redo() {
		if (!redoStack.value.length) return
		const next = redoStack.value.pop()
		undoStack.value.push(snapshotTodos())
		todos.value = next
	}

	const canUndo = computed(() => undoStack.value.length > 0)
	const canRedo = computed(() => redoStack.value.length > 0)

	return {
		view,
		statusFilter,
		priorityFilters,
		dueFilters,
		tagFilters,
		allTags,
		searchQuery,
		sortBy,
		hasActiveFilters,
		togglePriorityFilter,
		toggleDueFilter,
		toggleTagFilter,
		clearFilters,
		filteredTodos,
		removedTodos,
		allTodos,
		activeTodos,
		hasAnyTodos,
		alertableTodos,
		saveError,
		selectMode,
		selectedIds,
		toggleSelectMode,
		toggleSelected,
		selectAllVisible,
		clearSelection,
		bulkComplete: withUndo(bulkComplete),
		bulkSetPriority: withUndo(bulkSetPriority),
		bulkDelete: withUndo(bulkDelete),
		addTodo: withUndo(addTodo),
		editTodo: withUndo(editTodo),
		setDueDate: withUndo(setDueDate),
		setPriority: withUndo(setPriority),
		setNotes: withUndo(setNotes),
		setRecurrence: withUndo(setRecurrence),
		addTag: withUndo(addTag),
		removeTag: withUndo(removeTag),
		addSubtask: withUndo(addSubtask),
		editSubtask: withUndo(editSubtask),
		toggleSubtask: withUndo(toggleSubtask),
		removeSubtask: withUndo(removeSubtask),
		toggleTodo: withUndo(toggleTodo),
		removeTodo: withUndo(removeTodo),
		restoreTodo: withUndo(restoreTodo),
		deleteTodoPermanently: withUndo(deleteTodoPermanently),
		// Not wrapped: it's the automatic consequence of deleting an entire
		// list (itself not undoable), not a standalone user edit — undoing
		// just the tasks back into existence under a list that's already gone
		// would be more confusing than useful.
		deleteTodosForList,
		clearCompleted: withUndo(clearCompleted),
		reorderTodo: withUndo(reorderTodo),
		undo,
		redo,
		canUndo,
		canRedo,
		totalCount,
		remainingCount,
		progress,
	}
}
