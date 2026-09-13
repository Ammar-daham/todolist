<script setup>
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
	toggleTodo,
	removeTodo,
	restoreTodo,
	deleteTodoPermanently,
	clearCompleted,
	totalCount,
	remainingCount,
	progress,
	deleteTodosForList,
} = useTodos(activeListId)

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
					@toggle-theme="toggleTheme"
					@select-theme="setTheme"
					@toggle-due-alerts="toggleDueAlerts"
					@select-list="selectList"
					@add-list="addList"
					@rename-list="renameList"
					@remove-list="handleRemoveList"
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
					:has-active-filters="hasActiveFilters"
					@toggle-priority="togglePriorityFilter"
					@toggle-due="toggleDueFilter"
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
					@toggle="toggleTodo"
					@edit="editTodo"
					@set-due-date="setDueDate"
					@set-priority="setPriority"
					@set-notes="setNotes"
					@remove="removeTodo"
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
