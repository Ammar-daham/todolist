import { ref, watch, onMounted, onUnmounted } from 'vue'
import { parseDueDateTime } from '../utils/time'

const STORAGE_KEY = 'todo-app.dueAlertsEnabled'
const CHECK_INTERVAL_MS = 20_000
const REMINDER_LEAD_MS = 15 * 60 * 1000

function loadEnabled() {
	try {
		return localStorage.getItem(STORAGE_KEY) === 'true'
	} catch {
		return false
	}
}

// A short chime via WebAudio rather than an audio file, so there's nothing to
// bundle or fetch — this only ever runs from a user gesture (toggling alerts
// on), so autoplay restrictions don't block it.
function playChime() {
	try {
		const Ctx = window.AudioContext || window.webkitAudioContext
		if (!Ctx) return
		const ctx = new Ctx()
		const osc = ctx.createOscillator()
		const gain = ctx.createGain()
		osc.type = 'sine'
		osc.frequency.value = 880
		gain.gain.setValueAtTime(0.2, ctx.currentTime)
		gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
		osc.connect(gain)
		gain.connect(ctx.destination)
		osc.start()
		osc.stop(ctx.currentTime + 0.5)
	} catch {
		/* AudioContext unavailable — the toast/notification still shows */
	}
}

// This only reaches tasks that have BOTH a due date and a due time. Alerts
// only run while this tab is open (or the installed PWA is running) — there's
// no way to wake up a closed browser without a push server, so this is
// deliberately scoped to "while running," not a true background alarm.
export function useDueAlerts(todos) {
	const enabled = ref(loadEnabled())
	const permission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
	const toast = ref(null)

	// Keyed by id+date+time so rescheduling a task's due moment re-arms its
	// alerts instead of silently staying "already notified" against the old time.
	const notifiedKeys = new Set()
	const remindedKeys = new Set()
	let timer = null

	function alertKey(todo) {
		return `${todo.id}:${todo.dueDate}:${todo.dueTime}`
	}

	function fire(todo, kind) {
		const title = kind === 'due' ? 'Task due now' : 'Task due soon'
		toast.value = { id: `${alertKey(todo)}:${kind}:${Date.now()}`, title, body: todo.text }
		playChime()
		if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
			new Notification(title, { body: todo.text, tag: `${alertKey(todo)}:${kind}` })
		}
	}

	function check() {
		if (!enabled.value) return
		const now = Date.now()
		for (const todo of todos.value) {
			if (todo.done || !todo.dueDate || !todo.dueTime) continue
			const due = parseDueDateTime(todo.dueDate, todo.dueTime)
			if (due == null) continue
			const key = alertKey(todo)
			if (due <= now) {
				if (!notifiedKeys.has(key)) {
					notifiedKeys.add(key)
					fire(todo, 'due')
				}
			} else if (due - now <= REMINDER_LEAD_MS && !remindedKeys.has(key)) {
				remindedKeys.add(key)
				fire(todo, 'reminder')
			}
		}
	}

	function stopTimer() {
		if (timer) {
			clearInterval(timer)
			timer = null
		}
	}

	function startTimer() {
		stopTimer()
		check()
		timer = setInterval(check, CHECK_INTERVAL_MS)
	}

	async function enable() {
		if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
			permission.value = await Notification.requestPermission()
		}
		enabled.value = true
	}

	function disable() {
		enabled.value = false
	}

	function toggle() {
		if (enabled.value) disable()
		else enable()
	}

	function dismissToast() {
		toast.value = null
	}

	watch(enabled, (value) => {
		try {
			localStorage.setItem(STORAGE_KEY, String(value))
		} catch (err) {
			console.error('Failed to save due-alerts preference:', err)
		}
		if (value) startTimer()
		else stopTimer()
	})

	onMounted(() => {
		if (enabled.value) startTimer()
	})
	onUnmounted(stopTimer)

	return { enabled, permission, toast, toggle, dismissToast }
}
