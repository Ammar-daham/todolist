<script setup>
import { PRIORITIES, PRIORITY_ORDER } from '../constants/priorities'

defineProps({
	modelValue: { type: String, required: true },
})
defineEmits(['update:modelValue'])
</script>

<template>
	<div class="d-flex flex-wrap gap-2 mb-3 priority-filter" role="group">
		<button
			type="button"
			class="btn"
			:class="modelValue === 'all' ? 'btn-accent' : 'btn-surface text-muted'"
			@click="$emit('update:modelValue', 'all')"
		>
			All
		</button>
		<button
			v-for="key in PRIORITY_ORDER"
			:key="key"
			type="button"
			class="btn d-flex align-items-center justify-content-center gap-1"
			:class="[`badge-${PRIORITIES[key].badge}`, { 'priority-active': modelValue === key }]"
			@click="$emit('update:modelValue', key)"
		>
			<span class="priority-dot" :style="{ background: modelValue === key ? '#fff' : PRIORITIES[key].color }"></span>
			{{ PRIORITIES[key].label }}
		</button>
	</div>
</template>

<style scoped>
.btn-accent {
	background: var(--accent);
	border-color: var(--accent);
	color: var(--accent-contrast);
}
.btn-accent:hover,
.btn-accent:focus {
	background: var(--accent-strong);
	border-color: var(--accent-strong);
	color: var(--accent-contrast);
}

.btn-surface {
	background: var(--surface-alt);
	border-color: var(--surface-alt);
}
.btn-surface:hover {
	background: var(--surface-alt-hover);
	border-color: var(--surface-alt-hover);
}

.priority-filter .btn {
	border: none;
	border-radius: 10px !important;
	font-weight: 500;
	font-size: 0.85rem;
}

.badge-danger {
	background: var(--danger-bg);
	color: var(--danger);
}
.badge-warning {
	background: var(--warning-bg);
	color: var(--warning);
}
.badge-success {
	background: var(--success-bg);
	color: var(--success);
}

.badge-danger.priority-active {
	background: var(--danger);
	color: #fff;
}
.badge-warning.priority-active {
	background: var(--warning);
	color: #fff;
}
.badge-success.priority-active {
	background: var(--success);
	color: #fff;
}

.priority-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	display: inline-block;
}
</style>
