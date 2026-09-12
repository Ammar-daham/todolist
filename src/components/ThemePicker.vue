<script setup>
import { computed } from 'vue'

const props = defineProps({
	presets: { type: Array, required: true },
	activeKey: { type: String, required: true },
})
defineEmits(['select'])

const groups = computed(() => [
	{ label: 'Colors', items: props.presets.filter((t) => !t.image) },
	{ label: 'Background images', items: props.presets.filter((t) => t.image) },
])
</script>

<template>
	<div class="dropdown theme-picker">
		<button
			type="button"
			class="btn btn-sm btn-icon theme-picker-toggle"
			data-bs-toggle="dropdown"
			aria-expanded="false"
			aria-label="Choose a background theme"
		>
			<i class="bi bi-palette2"></i>
		</button>
		<ul class="dropdown-menu theme-picker-menu">
			<template v-for="(group, index) in groups" :key="group.label">
				<li v-if="index > 0"><hr class="dropdown-divider" /></li>
				<li class="dropdown-header">{{ group.label }}</li>
				<li v-for="theme in group.items" :key="theme.key">
					<button
						type="button"
						class="dropdown-item d-flex align-items-center gap-2"
						:class="{ active: theme.key === activeKey }"
						@click="$emit('select', theme.key)"
					>
						<span
							class="theme-swatch"
							:style="{ background: `linear-gradient(135deg, ${theme.swatch[0]}, ${theme.swatch[1]}, ${theme.swatch[2]})` }"
						></span>
						{{ theme.label }}
						<i v-if="theme.key === activeKey" class="bi bi-check-lg ms-auto"></i>
					</button>
				</li>
			</template>
		</ul>
	</div>
</template>

<style scoped>
.btn-icon {
	border: none;
	background: transparent;
	transition: opacity 0.15s ease, color 0.15s ease;
}

.theme-picker {
	position: absolute;
	top: 16px;
	right: 62px;
}

.theme-picker-toggle {
	font-size: 1.2rem;
	width: 38px;
	height: 38px;
	border-radius: 50%;
	color: var(--accent);
}
.theme-picker-toggle:hover {
	color: var(--accent-strong) !important;
}

.theme-picker-menu {
	background: var(--surface);
	border-color: var(--border);
	border-radius: 12px;
	padding: 6px;
	min-width: 190px;
	max-height: 340px;
	overflow-y: auto;
}

.dropdown-header {
	font-size: 0.72rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: var(--text-done);
	padding: 6px 10px 2px;
}

.dropdown-divider {
	border-color: var(--border);
	margin: 6px 4px;
}

.dropdown-item {
	border-radius: 8px;
	font-size: 0.9rem;
	color: inherit;
}
.dropdown-item:hover,
.dropdown-item:focus {
	background: var(--surface-alt-hover);
	color: inherit;
}
.dropdown-item.active {
	background: var(--accent-soft);
	color: var(--accent-strong);
}

.theme-swatch {
	width: 20px;
	height: 20px;
	border-radius: 50%;
	flex-shrink: 0;
	border: 1px solid var(--border);
}
</style>
