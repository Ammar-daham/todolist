<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useTodos } from '../composables/useTodos'
import { useLists } from '../composables/useLists'
import { useTheme } from '../composables/useTheme'
import { useCustomTheme } from '../composables/useCustomTheme'
import { useDueAlerts } from '../composables/useDueAlerts'
import DueAlertToast from './DueAlertToast.vue'
import TodoHeaderBar from './TodoHeaderBar.vue'
import TodoInput from './TodoInput.vue'
import TodoToolbar from './TodoToolbar.vue'
import TodoList from './TodoList.vue'
import TodoRemovedList from './TodoRemovedList.vue'
import TodoHistory from './TodoHistory.vue'

const { lists, activeListId, addList, renameList, selectList, removeList } = useLists()

const {
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
	setRecurrence,
	addTag,
	removeTag,
	addSubtask,
	editSubtask,
	toggleSubtask,
	removeSubtask,
	toggleTodo,
	removeTodo,
	restoreTodo,
	deleteTodoPermanently,
	clearCompleted,
	reorderTodo,
	undo,
	redo,
	canUndo,
	canRedo,
	totalCount,
	remainingCount,
	progress,
	deleteTodosForList,
} = useTodos(activeListId)

// Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (also Ctrl/Cmd+Y) drive undo/redo from
// anywhere in the app — except while focus is in a text field, where the
// browser's own native undo for whatever's being typed should win instead of
// the app-wide history.
function isEditableTarget(el) {
	if (!el) return false
	return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable
}

function handleKeydown(event) {
	const key = event.key.toLowerCase()
	const isUndoCombo = (event.ctrlKey || event.metaKey) && !event.shiftKey && key === 'z'
	const isRedoCombo = (event.ctrlKey || event.metaKey) && ((event.shiftKey && key === 'z') || key === 'y')
	if (!isUndoCombo && !isRedoCombo) return
	if (isEditableTarget(document.activeElement)) return
	event.preventDefault()
	if (isUndoCombo) undo()
	else redo()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

function handleRemoveList(id) {
	deleteTodosForList(id)
	removeList(id)
}

const { isDark, toggleTheme } = useTheme()
const { themeKey, presets, setTheme } = useCustomTheme()
const {
	enabled: dueAlertsEnabled,
	permission: dueAlertsPermission,
	toast: dueAlertToast,
	toggle: toggleDueAlerts,
	dismissToast: dismissDueAlertToast,
} = useDueAlerts(alertableTodos)
</script>

<template>
	<div class="d-flex justify-content-center align-items-start align-items-sm-center min-vh-100 py-5 px-3">
		<div class="todo-card card border-0 shadow-lg w-100">
			<div class="card-body p-3 p-sm-4">
				<TodoHeaderBar
					:remaining-count="remainingCount"
					:total-count="totalCount"
					:progress="progress"
					:is-dark="isDark"
					:presets="presets"
					:theme-key="themeKey"
					:due-alerts-enabled="dueAlertsEnabled"
					:due-alerts-permission="dueAlertsPermission"
					:lists="lists"
					:active-list-id="activeListId"
					:can-undo="canUndo"
					:can-redo="canRedo"
					@toggle-theme="toggleTheme"
					@select-theme="setTheme"
					@toggle-due-alerts="toggleDueAlerts"
					@select-list="selectList"
					@add-list="addList"
					@rename-list="renameList"
					@remove-list="handleRemoveList"
					@undo="undo"
					@redo="redo"
				/>

				<div v-if="saveError" class="save-error d-flex align-items-start gap-2 mb-3" role="alert">
					<i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
					<span>Couldn't save your changes to this device's storage — they may be lost on refresh.</span>
				</div>

				<TodoInput @add="addTodo" />

				<TodoToolbar
					v-model:view="view"
					v-model:status-filter="statusFilter"
					v-model:search-query="searchQuery"
					v-model:sort-by="sortBy"
					:priority-filters="priorityFilters"
					:due-filters="dueFilters"
					:tag-filters="tagFilters"
					:all-tags="allTags"
					:has-active-filters="hasActiveFilters"
					@toggle-priority="togglePriorityFilter"
					@toggle-due="toggleDueFilter"
					@toggle-tag="toggleTagFilter"
					@clear-filters="clearFilters"
				/>

				<TodoList
					v-if="view === 'tasks'"
					:todos="filteredTodos"
					:total-count="totalCount"
					:remaining-count="remainingCount"
					:has-any-todos="hasAnyTodos"
					:select-mode="selectMode"
					:selected-ids="selectedIds"
					:sort-by="sortBy"
					@toggle="toggleTodo"
					@edit="editTodo"
					@set-due-date="setDueDate"
					@set-priority="setPriority"
					@set-notes="setNotes"
					@set-recurrence="setRecurrence"
					@add-tag="addTag"
					@remove-tag="removeTag"
					@add-subtask="addSubtask"
					@edit-subtask="editSubtask"
					@toggle-subtask="toggleSubtask"
					@remove-subtask="removeSubtask"
					@remove="removeTodo"
					@reorder="reorderTodo"
					@clear-completed="clearCompleted"
					@toggle-select-mode="toggleSelectMode"
					@toggle-select="toggleSelected"
					@select-all="selectAllVisible"
					@clear-selection="clearSelection"
					@bulk-complete="bulkComplete"
					@bulk-set-priority="bulkSetPriority"
					@bulk-delete="bulkDelete"
				/>
				<TodoRemovedList
					v-else-if="view === 'removed'"
					:todos="removedTodos"
					@restore="restoreTodo"
					@delete="deleteTodoPermanently"
				/>
				<TodoHistory v-else :todos="allTodos" />
			</div>
		</div>

		<DueAlertToast :toast="dueAlertToast" @dismiss="dismissDueAlertToast" />
	</div>
</template>

<style scoped>
.save-error {
	background: var(--danger-bg);
	color: var(--danger);
	border-radius: 10px;
	padding: 10px 14px;
	font-size: 0.85rem;
}

.todo-card {
	max-width: 560px;
	border-radius: 20px;
	background: var(--surface);
	transition: background 0.3s ease;
}
</style>
