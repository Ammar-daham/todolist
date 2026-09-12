<script setup>
import ThemeToggle from './ThemeToggle.vue'
import ThemePicker from './ThemePicker.vue'
import DueAlertsToggle from './DueAlertsToggle.vue'
import TodoListSwitcher from './TodoListSwitcher.vue'

defineProps({
	remainingCount: { type: Number, required: true },
	totalCount: { type: Number, required: true },
	progress: { type: Number, required: true },
	isDark: { type: Boolean, required: true },
	presets: { type: Array, required: true },
	themeKey: { type: String, required: true },
	dueAlertsEnabled: { type: Boolean, required: true },
	dueAlertsPermission: { type: String, required: true },
	lists: { type: Array, required: true },
	activeListId: { type: String, required: true },
})
defineEmits([
	'toggle-theme',
	'select-theme',
	'toggle-due-alerts',
	'select-list',
	'add-list',
	'rename-list',
	'remove-list',
])
</script>

<template>
	<div class="header-bar">
		<div class="d-flex align-items-center gap-2">
			<div class="app-icon flex-shrink-0">
				<i class="bi bi-check2-square"></i>
			</div>
			<div class="header-info flex-grow-1">
				<TodoListSwitcher
					class="header-title"
					:lists="lists"
					:active-list-id="activeListId"
					@select="$emit('select-list', $event)"
					@add="$emit('add-list', $event)"
					@rename="(id, name) => $emit('rename-list', id, name)"
					@remove="$emit('remove-list', $event)"
				/>
				<p class="header-subtitle mb-0 text-truncate">
					<template v-if="totalCount">
						<strong class="text-body-emphasis">{{ remainingCount }}</strong> of {{ totalCount }} left &middot; {{ progress }}%
					</template>
					<template v-else>Stay organized, stay focused.</template>
				</p>
			</div>
			<!-- Grouped so the three controls can never overlap the title on a narrow card — see CLAUDE-guided mobile layout redesign. -->
			<div class="icon-toolbar flex-shrink-0">
				<DueAlertsToggle
					:enabled="dueAlertsEnabled"
					:permission="dueAlertsPermission"
					@toggle="$emit('toggle-due-alerts')"
				/>
				<ThemePicker :presets="presets" :active-key="themeKey" @select="$emit('select-theme', $event)" />
				<ThemeToggle :is-dark="isDark" @toggle="$emit('toggle-theme')" />
			</div>
		</div>

		<div v-if="totalCount" class="progress header-progress mt-3">
			<div
				class="progress-bar bg-accent"
				role="progressbar"
				:style="{ width: progress + '%' }"
				:aria-valuenow="progress"
				aria-valuemin="0"
				aria-valuemax="100"
			></div>
		</div>
	</div>
</template>

<style scoped>
.header-bar {
	margin-bottom: 20px;
}

.app-icon {
	width: 40px;
	height: 40px;
	border-radius: 12px;
	background: linear-gradient(135deg, var(--accent), var(--accent-strong));
	color: var(--accent-contrast);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.1rem;
}

.header-info {
	min-width: 0;
}

.header-title {
	font-size: 1.1rem;
	font-weight: 700;
	line-height: 1.25;
}

.header-subtitle {
	font-size: 0.8rem;
	color: var(--text-done);
	line-height: 1.3;
}

.icon-toolbar {
	display: flex;
	gap: 2px;
	background: var(--surface-alt);
	border-radius: 12px;
	padding: 2px;
}

.header-progress {
	height: 6px;
	border-radius: 999px;
	background: var(--surface-alt);
}
.bg-accent {
	background: var(--accent) !important;
}
</style>
