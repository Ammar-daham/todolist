import { ref, watch } from 'vue'

const LISTS_STORAGE_KEY = 'todo-app.lists'
const ACTIVE_LIST_STORAGE_KEY = 'todo-app.activeListId'

export const DEFAULT_LIST_ID = 'default'

function loadLists() {
	try {
		const raw = localStorage.getItem(LISTS_STORAGE_KEY)
		const parsed = raw ? JSON.parse(raw) : null
		if (Array.isArray(parsed) && parsed.length) return parsed
	} catch {
		// fall through to the default list below
	}
	return [{ id: DEFAULT_LIST_ID, name: 'My Tasks', createdAt: Date.now() }]
}

function loadActiveListId(lists) {
	try {
		const stored = localStorage.getItem(ACTIVE_LIST_STORAGE_KEY)
		if (stored && lists.some((list) => list.id === stored)) return stored
	} catch {
		// ignore and fall back to the first list
	}
	return lists[0].id
}

export function useLists() {
	const lists = ref(loadLists())
	const activeListId = ref(loadActiveListId(lists.value))

	watch(
		lists,
		(value) => {
			try {
				localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(value))
			} catch (err) {
				console.error('Failed to save lists to localStorage:', err)
			}
		},
		{ deep: true }
	)

	watch(activeListId, (value) => {
		try {
			localStorage.setItem(ACTIVE_LIST_STORAGE_KEY, value)
		} catch (err) {
			console.error('Failed to save active list to localStorage:', err)
		}
	})

	function addList(name) {
		const trimmed = name.trim()
		if (!trimmed) return
		const list = { id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: trimmed, createdAt: Date.now() }
		lists.value.push(list)
		activeListId.value = list.id
	}

	function renameList(id, name) {
		const trimmed = name.trim()
		if (!trimmed) return
		const list = lists.value.find((l) => l.id === id)
		if (list) list.name = trimmed
	}

	function selectList(id) {
		if (lists.value.some((l) => l.id === id)) activeListId.value = id
	}

	// A list is only ever removed with all of its tasks — there's always at
	// least one list left to land on, so the app is never without a home view.
	function removeList(id) {
		if (lists.value.length <= 1) return
		const index = lists.value.findIndex((l) => l.id === id)
		if (index === -1) return
		lists.value.splice(index, 1)
		if (activeListId.value === id) activeListId.value = lists.value[0].id
	}

	return { lists, activeListId, addList, renameList, selectList, removeList }
}
