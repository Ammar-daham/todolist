import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createApp, ref } from 'vue'
import { useDueAlerts } from '../../src/composables/useDueAlerts'

// useDueAlerts relies on onMounted/onUnmounted, so it needs a real component
// instance around it — calling it bare would skip those lifecycle hooks.
function withSetup(composable) {
	let result
	const app = createApp({
		setup() {
			result = composable()
			return () => null
		},
	})
	app.mount(document.createElement('div'))
	return [result, app]
}

function todoDueIn(minutesFromNow, now) {
	const due = new Date(now + minutesFromNow * 60_000)
	const pad = (n) => String(n).padStart(2, '0')
	return {
		id: 1,
		text: 'Ship the report',
		done: false,
		dueDate: `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`,
		dueTime: `${pad(due.getHours())}:${pad(due.getMinutes())}`,
	}
}

beforeEach(() => {
	localStorage.clear()
	vi.useFakeTimers()
	vi.setSystemTime(new Date(2024, 0, 15, 10, 0, 0))
})

afterEach(() => {
	vi.useRealTimers()
})

describe('useDueAlerts', () => {
	it('starts disabled and does not persist a stale toast', () => {
		const [state, app] = withSetup(() => useDueAlerts(ref([])))
		expect(state.enabled.value).toBe(false)
		expect(state.toast.value).toBeNull()
		app.unmount()
	})

	it('fires an in-app reminder toast once a task is within the lead window', async () => {
		const now = Date.now()
		const todos = ref([todoDueIn(10, now)]) // due in 10 minutes, inside the 15-minute lead
		const [state, app] = withSetup(() => useDueAlerts(todos))

		await state.toggle() // enable() -> requests permission (skipped, jsdom has no Notification) -> enabled = true
		await vi.advanceTimersByTimeAsync(0) // let the `enabled` watcher run and start the check timer

		expect(state.toast.value).not.toBeNull()
		expect(state.toast.value.title).toBe('Task due soon')

		app.unmount()
	})

	it('does not re-fire the same reminder on subsequent checks', async () => {
		const now = Date.now()
		const todos = ref([todoDueIn(10, now)])
		const [state, app] = withSetup(() => useDueAlerts(todos))

		await state.toggle()
		await vi.advanceTimersByTimeAsync(0)
		const firstToastId = state.toast.value.id
		state.dismissToast()

		await vi.advanceTimersByTimeAsync(20_000) // one more polling tick, task hasn't newly crossed a threshold
		expect(state.toast.value).toBeNull()
		expect(firstToastId).toBeTruthy()

		app.unmount()
	})

	it('fires a due-now toast once the due moment passes, then stops polling on disable', async () => {
		const now = Date.now()
		const todos = ref([todoDueIn(1, now)]) // due in 1 minute
		const [state, app] = withSetup(() => useDueAlerts(todos))

		await state.toggle()
		await vi.advanceTimersByTimeAsync(0) // immediate reminder toast
		state.dismissToast()

		await vi.advanceTimersByTimeAsync(60_000) // cross the due moment
		expect(state.toast.value?.title).toBe('Task due now')

		await state.toggle() // was enabled, so this disables and stops the poll timer
		await vi.advanceTimersByTimeAsync(0)
		state.dismissToast()
		await vi.advanceTimersByTimeAsync(60_000)
		expect(state.toast.value).toBeNull() // polling stopped, nothing new fires

		app.unmount()
	})

	it('never alerts on a task that is already done', async () => {
		const now = Date.now()
		const todo = { ...todoDueIn(1, now), done: true }
		const todos = ref([todo])
		const [state, app] = withSetup(() => useDueAlerts(todos))

		await state.toggle()
		await vi.advanceTimersByTimeAsync(0)
		expect(state.toast.value).toBeNull()

		app.unmount()
	})

	it('persists the enabled preference to localStorage', async () => {
		const [state, app] = withSetup(() => useDueAlerts(ref([])))
		await state.toggle()
		await vi.advanceTimersByTimeAsync(0)

		expect(localStorage.getItem('todo-app.dueAlertsEnabled')).toBe('true')
		app.unmount()
	})
})
