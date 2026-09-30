"use strict";

const STORAGE_KEY = "studyTracker.data.v1";
const THEME_KEY = "studyTracker.theme.v1";
const TOPIC_GOAL = 20;

const quotes = [
	{ text: "The secret of getting ahead is getting started.", author: "MARK TWAIN" },
	{ text: "It always seems impossible until it's done.", author: "NELSON MANDELA" },
	{ text: "The beautiful thing about learning is nobody can take it away from you.", author: "B.B. KING" },
	{ text: "Great things are done by a series of small things brought together.", author: "VINCENT VAN GOGH" },
	{ text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "MAHATMA GANDHI" },
	{ text: "An investment in knowledge pays the best interest.", author: "BENJAMIN FRANKLIN" },
	{ text: "The more that you read, the more things you will know.", author: "DR. SEUSS" }
];

const achievements = [
	{ id: "beginner", title: "Beginner Learner", detail: "Complete your first topic", icon: "book-open-check", unlocked: (stats) => stats.topics >= 1 },
	{ id: "consistent", title: "Consistent Learner", detail: "Build a 3-day streak", icon: "calendar-check-2", unlocked: (stats) => stats.longest >= 3 },
	{ id: "week", title: "7 Day Streak", detail: "Study seven days in a row", icon: "flame", unlocked: (stats) => stats.longest >= 7 },
	{ id: "month", title: "30 Day Streak", detail: "Study thirty days in a row", icon: "trophy", unlocked: (stats) => stats.longest >= 30 },
	{ id: "master", title: "Study Master", detail: "Log 100 study hours", icon: "graduation-cap", unlocked: (stats) => stats.hours >= 100 }
];

const elements = {
	date: document.getElementById("current-date"),
	quote: document.getElementById("daily-quote"),
	quoteAuthor: document.getElementById("quote-author"),
	studyForm: document.getElementById("study-form"),
	studyHours: document.getElementById("study-hours"),
	topicForm: document.getElementById("topic-form"),
	topicName: document.getElementById("topic-name"),
	topicList: document.getElementById("topic-list"),
	topicsEmpty: document.getElementById("topics-empty"),
	activityList: document.getElementById("activity-list"),
	activityEmpty: document.getElementById("activity-empty"),
	toastRegion: document.getElementById("toast-region"),
	themeToggle: document.getElementById("theme-toggle"),
	progressFill: document.getElementById("progress-fill"),
	progressTrack: document.getElementById("progress-track"),
	streakWeek: document.getElementById("streak-week"),
	achievementList: document.getElementById("achievement-list")
};

let toastTimer;
let state = loadState();

function emptyState() {
	return { sessions: [], topics: [] };
}

function loadState() {
	try {
		const stored = window.localStorage.getItem(STORAGE_KEY);
		if (!stored) return emptyState();
		const parsed = JSON.parse(stored);
		return {
			sessions: Array.isArray(parsed.sessions) ? parsed.sessions.filter(isValidSession) : [],
			topics: Array.isArray(parsed.topics) ? parsed.topics.filter(isValidTopic) : []
		};
	} catch (error) {
		console.error("Could not load saved study data.", error);
		showToast("Saved data could not be read. Your current session is still usable.", "error");
		return emptyState();
	}
}

function isValidSession(session) {
	return session && typeof session.id === "string" && Number.isFinite(session.hours) && session.hours > 0 && isDateKey(session.date);
}

function isValidTopic(topic) {
	return topic && typeof topic.id === "string" && typeof topic.name === "string" && isDateKey(topic.date);
}

function isDateKey(value) {
	return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
}

function persistState() {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		return true;
	} catch (error) {
		console.error("Could not save study data.", error);
		showToast("Could not save changes. Check your browser storage settings.", "error");
		return false;
	}
}

function localDateKey(date = new Date()) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function displayDate(dateKey, options = { month: "short", day: "numeric", year: "numeric" }) {
	const [year, month, day] = dateKey.split("-").map(Number);
	return new Intl.DateTimeFormat(undefined, options).format(new Date(year, month - 1, day));
}

function getStudyDates() {
	return new Set(state.sessions.map((session) => session.date));
}

function calculateStreaks() {
	const studyDates = getStudyDates();
	const today = localDateKey();
	let current = 0;
	const firstCurrentDate = studyDates.has(today) ? new Date() : new Date();
	if (!studyDates.has(today)) firstCurrentDate.setDate(firstCurrentDate.getDate() - 1);
	let cursor = new Date(firstCurrentDate.getFullYear(), firstCurrentDate.getMonth(), firstCurrentDate.getDate());

	while (studyDates.has(localDateKey(cursor))) {
		current += 1;
		cursor.setDate(cursor.getDate() - 1);
	}

	let longest = 0;
	let run = 0;
	let previous = null;
	const sortedDates = [...studyDates].sort();
	for (const dateKey of sortedDates) {
		const [year, month, day] = dateKey.split("-").map(Number);
		const date = new Date(year, month - 1, day);
		if (previous) {
			const difference = Math.round((date - previous) / 86400000);
			run = difference === 1 ? run + 1 : 1;
		} else {
			run = 1;
		}
		longest = Math.max(longest, run);
		previous = date;
	}
	return { current, longest };
}

function getStats() {
	const totalHours = state.sessions.reduce((sum, session) => sum + session.hours, 0);
	const todayHours = state.sessions
		.filter((session) => session.date === localDateKey())
		.reduce((sum, session) => sum + session.hours, 0);
	const streaks = calculateStreaks();
	return { totalHours, todayHours, topics: state.topics.length, ...streaks };
}

function renderDateAndQuote() {
	const now = new Date();
	elements.date.textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(now);
	const quote = quotes[now.getDay()];
	elements.quote.textContent = `“${quote.text}”`;
	elements.quoteAuthor.textContent = quote.author;
}

function renderStats() {
	const stats = getStats();
	document.getElementById("total-hours").textContent = formatHours(stats.totalHours);
	document.getElementById("today-hours").textContent = formatHours(stats.todayHours);
	document.getElementById("total-topics").textContent = String(stats.topics);
	document.getElementById("topic-count").textContent = `${stats.topics} ${stats.topics === 1 ? "topic" : "topics"}`;
	document.getElementById("current-streak").textContent = String(stats.current);
	document.getElementById("longest-streak").textContent = String(stats.longest);
	document.getElementById("side-streak").textContent = String(stats.current);
	document.getElementById("streak-badge").textContent = stats.current >= 7 ? "ON FIRE" : stats.current >= 3 ? "GOING" : stats.current > 0 ? "ACTIVE" : "NEW";

	const progress = Math.min(100, Math.round((stats.topics / TOPIC_GOAL) * 100));
	document.getElementById("progress-percent").textContent = `${progress}%`;
	document.getElementById("progress-count").textContent = String(Math.min(stats.topics, TOPIC_GOAL));
	document.getElementById("progress-remaining").textContent = `${Math.max(0, TOPIC_GOAL - stats.topics)} to go`;
	elements.progressFill.style.width = `${progress}%`;
	elements.progressTrack.setAttribute("aria-valuenow", String(progress));
}

function formatHours(hours) {
	return Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(/\.0$/, "");
}

function renderTopics() {
	elements.topicList.replaceChildren();
	const sorted = [...state.topics].sort((first, second) => second.createdAt - first.createdAt);
	for (const topic of sorted) {
		const item = document.createElement("li");
		item.className = "topic-item";

		const check = document.createElement("span");
		check.className = "topic-check";
		check.innerHTML = "<i data-lucide=\"check\"></i>";
		check.setAttribute("aria-hidden", "true");

		const title = document.createElement("span");
		title.className = "topic-title";
		title.textContent = topic.name;

		const date = document.createElement("span");
		date.className = "topic-date";
		date.textContent = displayDate(topic.date, { month: "short", day: "numeric" });

		const remove = document.createElement("button");
		remove.className = "delete-button";
		remove.type = "button";
		remove.dataset.topicId = topic.id;
		remove.setAttribute("aria-label", `Delete topic: ${topic.name}`);
		remove.title = "Delete topic";
		remove.innerHTML = "<i data-lucide=\"trash-2\"></i>";

		item.append(check, title, date, remove);
		elements.topicList.append(item);
	}
	elements.topicsEmpty.classList.toggle("visible", sorted.length === 0);
	renderIcons();
}

function renderActivity() {
	elements.activityList.replaceChildren();
	const sorted = [...state.sessions].sort((first, second) => second.createdAt - first.createdAt);
	document.getElementById("history-count").textContent = `${sorted.length} ${sorted.length === 1 ? "session" : "sessions"}`;

	for (const session of sorted.slice(0, 30)) {
		const row = document.createElement("div");
		row.className = "activity-row";

		const symbol = document.createElement("span");
		symbol.className = "activity-symbol";
		symbol.innerHTML = "<i data-lucide=\"book-open\"></i>";
		symbol.setAttribute("aria-hidden", "true");

		const description = document.createElement("div");
		description.className = "activity-description";
		const title = document.createElement("strong");
		title.textContent = "Study session";
		const date = document.createElement("span");
		date.textContent = displayDate(session.date);
		description.append(title, date);

		const hours = document.createElement("span");
		hours.className = "activity-hours";
		hours.append(document.createTextNode(formatHours(session.hours)), document.createTextNode(" "));
		const unit = document.createElement("small");
		unit.textContent = "hrs";
		hours.append(unit);

		const remove = document.createElement("button");
		remove.className = "delete-button activity-delete";
		remove.type = "button";
		remove.dataset.sessionId = session.id;
		remove.setAttribute("aria-label", `Delete ${formatHours(session.hours)} hour study session from ${displayDate(session.date)}`);
		remove.title = "Delete session";
		remove.innerHTML = "<i data-lucide=\"trash-2\"></i>";

		row.append(symbol, description, hours, remove);
		elements.activityList.append(row);
	}
	elements.activityEmpty.classList.toggle("visible", sorted.length === 0);
	renderIcons();
}

function renderStreakWeek() {
	const activeDates = getStudyDates();
	const today = new Date();
	const mondayOffset = (today.getDay() + 6) % 7;
	const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset);
	elements.streakWeek.replaceChildren();

	for (let index = 0; index < 7; index += 1) {
		const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
		const key = localDateKey(date);
		const day = document.createElement("span");
		day.className = `streak-day${activeDates.has(key) ? " done" : ""}${key === localDateKey() ? " today" : ""}`;
		day.setAttribute("aria-label", `${displayDate(key, { weekday: "long", month: "short", day: "numeric" })}: ${activeDates.has(key) ? "studied" : "no study logged"}`);
		elements.streakWeek.append(day);
	}
}

function renderAchievements() {
	const stats = getStats();
	let unlockedCount = 0;
	elements.achievementList.replaceChildren();

	for (const achievement of achievements) {
		const unlocked = achievement.unlocked(stats);
		if (unlocked) unlockedCount += 1;
		const item = document.createElement("div");
		item.className = `achievement-item${unlocked ? " unlocked" : ""}`;

		const icon = document.createElement("span");
		icon.className = "achievement-icon";
		icon.innerHTML = `<i data-lucide="${achievement.icon}"></i>`;
		icon.setAttribute("aria-hidden", "true");

		const copy = document.createElement("div");
		copy.className = "achievement-copy";
		const title = document.createElement("strong");
		title.textContent = achievement.title;
		const detail = document.createElement("span");
		detail.textContent = unlocked ? "Unlocked" : achievement.detail;
		copy.append(title, detail);

		const status = document.createElement("span");
		status.className = "achievement-state";
		status.setAttribute("aria-label", unlocked ? "Unlocked" : "Locked");
		status.innerHTML = unlocked ? "<i data-lucide=\"badge-check\"></i>" : "<i data-lucide=\"lock-keyhole\"></i>";

		item.append(icon, copy, status);
		elements.achievementList.append(item);
	}
	document.getElementById("achievement-total").textContent = `${unlockedCount}/${achievements.length}`;
	renderIcons();
}

function renderIcons() {
	if (window.lucide && typeof window.lucide.createIcons === "function") {
		window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
	}
}

function renderAll() {
	renderDateAndQuote();
	renderStats();
	renderTopics();
	renderActivity();
	renderStreakWeek();
	renderAchievements();
	renderIcons();
}

function showToast(message, type = "success") {
	if (!elements.toastRegion) return;
	window.clearTimeout(toastTimer);
	elements.toastRegion.replaceChildren();
	const toast = document.createElement("div");
	toast.className = `toast${type === "error" ? " error" : ""}`;
	const icon = document.createElement("i");
	icon.dataset.lucide = type === "error" ? "circle-alert" : "circle-check";
	const text = document.createElement("span");
	text.textContent = message;
	toast.append(icon, text);
	elements.toastRegion.append(toast);
	renderIcons();
	toastTimer = window.setTimeout(() => {
		toast.classList.add("removing");
		window.setTimeout(() => toast.remove(), 200);
	}, 3000);
}

function handleStudySubmit(event) {
	event.preventDefault();
	const hours = Number(elements.studyHours.value);
	if (!Number.isFinite(hours) || hours < 0.1 || hours > 24) {
		showToast("Enter a study duration between 0.1 and 24 hours.", "error");
		elements.studyHours.focus();
		return;
	}

	const session = { id: createId(), hours, date: localDateKey(), createdAt: Date.now() };
	state.sessions.push(session);
	if (!persistState()) {
		state.sessions.pop();
		return;
	}
	elements.studyForm.reset();
	renderAll();
	showToast(`${formatHours(hours)} study ${hours === 1 ? "hour" : "hours"} added. Nice work!`);
}

function handleTopicSubmit(event) {
	event.preventDefault();
	const name = elements.topicName.value.trim();
	if (!name) {
		showToast("Add a topic name before saving.", "error");
		elements.topicName.focus();
		return;
	}

	state.topics.push({ id: createId(), name, date: localDateKey(), createdAt: Date.now() });
	if (!persistState()) {
		state.topics.pop();
		return;
	}
	elements.topicForm.reset();
	renderAll();
	showToast(`“${name}” added to your completed topics.`);
}

function handleDelete(event) {
	const topicButton = event.target.closest("[data-topic-id]");
	if (topicButton) {
		const previous = state.topics;
		state.topics = previous.filter((topic) => topic.id !== topicButton.dataset.topicId);
		if (!persistState()) {
			state.topics = previous;
			return;
		}
		renderAll();
		showToast("Topic removed.");
		return;
	}

	const sessionButton = event.target.closest("[data-session-id]");
	if (sessionButton) {
		const previous = state.sessions;
		state.sessions = previous.filter((session) => session.id !== sessionButton.dataset.sessionId);
		if (!persistState()) {
			state.sessions = previous;
			return;
		}
		renderAll();
		showToast("Study session removed.");
	}
}

function createId() {
	return window.crypto && typeof window.crypto.randomUUID === "function"
		? window.crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function applyTheme(theme) {
	const isDark = theme === "dark";
	document.body.classList.toggle("dark-theme", isDark);
	elements.themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
	elements.themeToggle.title = `Switch to ${isDark ? "light" : "dark"} mode`;
	elements.themeToggle.innerHTML = `<i data-lucide="${isDark ? "sun" : "moon"}"></i>`;
	document.querySelector('meta[name="theme-color"]').setAttribute("content", isDark ? "#151d19" : "#f3f6f3");
	renderIcons();
}

function toggleTheme() {
	const nextTheme = document.body.classList.contains("dark-theme") ? "light" : "dark";
	try {
		window.localStorage.setItem(THEME_KEY, nextTheme);
	} catch (error) {
		console.error("Could not save theme preference.", error);
		showToast("Theme changed, but this browser could not save the preference.", "error");
	}
	applyTheme(nextTheme);
}

function loadTheme() {
	try {
		applyTheme(window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");
	} catch (error) {
		console.error("Could not read theme preference.", error);
		applyTheme("light");
	}
}

function initialize() {
	elements.studyForm.addEventListener("submit", handleStudySubmit);
	elements.topicForm.addEventListener("submit", handleTopicSubmit);
	elements.topicList.addEventListener("click", handleDelete);
	elements.activityList.addEventListener("click", handleDelete);
	elements.themeToggle.addEventListener("click", toggleTheme);
	loadTheme();
	renderAll();
}

initialize();
