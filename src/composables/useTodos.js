import { ref, computed, watch } from 'vue'
import { PRIORITY_ORDER } from '../constants/priorities'

const STORAGE_KEY = 'todo-app.todos'

function loadTodos() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		const parsed = raw ? JSON.parse(raw) : []
		return parsed.map((todo) => ({
			completedAt: null,
			removedAt: null,
			dueDate: null,
			...todo,
			createdAt: todo.createdAt ?? Date.now(),
		}))
	} catch {
		return []
	}
}

export function useTodos() {
	const todos = ref(loadTodos())

	// Which collection is on screen: the task list, the bin, or the activity log.
	const view = ref('tasks')
	// Filters applied within the current view.
	const statusFilter = ref('all')
	// Empty means "every priority" — there is no separate "All" button.
	const priorityFilters = ref([])
	const searchQuery = ref('')

	watch(
		todos,
		(value) => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
		},
		{ deep: true }
	)

	function addTodo(text, priority, dueDate = null) {
		const trimmed = text.trim()
		if (!trimmed) return
		todos.value.push({
			id: Date.now(),
			text: trimmed,
			done: false,
			priority,
			dueDate,
			createdAt: Date.now(),
			completedAt: null,
			removedAt: null,
		})
	}

	function editTodo(id, text) {
		const trimmed = text.trim()
		if (!trimmed) return
		const todo = todos.value.find((t) => t.id === id)
		if (todo) todo.text = trimmed
	}

	function setDueDate(id, dueDate) {
		const todo = todos.value.find((t) => t.id === id)
		if (todo) todo.dueDate = dueDate || null
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

	function clearFilters() {
		statusFilter.value = 'all'
		priorityFilters.value = []
		searchQuery.value = ''
	}

	const hasActiveFilters = computed(
		() => statusFilter.value !== 'all' || priorityFilters.value.length > 0 || searchQuery.value.trim() !== ''
	)

	const visibleTodos = computed(() => {
		const query = searchQuery.value.trim().toLowerCase()
		const priorities = priorityFilters.value
		return todos.value.filter((t) => {
			const matchesPriority = !priorities.length || priorities.includes(t.priority || 'medium')
			const matchesSearch = !query || t.text.toLowerCase().includes(query)
			return matchesPriority && matchesSearch
		})
	})

	const hasAnyTodos = computed(() => todos.value.some((t) => !t.removedAt))

	const activeTodos = computed(() => visibleTodos.value.filter((t) => !t.removedAt))

	const filteredTodos = computed(() => {
		let list = activeTodos.value
		if (statusFilter.value === 'active') list = list.filter((t) => !t.done)
		if (statusFilter.value === 'completed') list = list.filter((t) => t.done)
		return [...list].sort(
			(a, b) => PRIORITY_ORDER.indexOf(a.priority || 'medium') - PRIORITY_ORDER.indexOf(b.priority || 'medium')
		)
	})

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
		searchQuery,
		hasActiveFilters,
		togglePriorityFilter,
		clearFilters,
		filteredTodos,
		removedTodos,
		allTodos,
		hasAnyTodos,
		addTodo,
		editTodo,
		setDueDate,
		toggleTodo,
		removeTodo,
		restoreTodo,
		deleteTodoPermanently,
		clearCompleted,
		totalCount,
		remainingCount,
		progress,
	}
}
