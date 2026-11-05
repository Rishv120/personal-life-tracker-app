import { loadState, saveState, exportBackup, localDate } from "./storage.js";
import { addTask, toggleTask, deleteTask } from "./tasks.js";
import { toggleHabit, addHabit, removeHabit } from "./habits.js";
import { journalFor } from "./journal.js";

const state = loadState();
let selectedDate = localDate();
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
const labelDate = value => new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday:"short", day:"numeric", month:"short", year:"numeric" });
const checksForDay = () => state.checks[selectedDate] || {};
function persist() { saveState(state); render(); }
function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1700);
}
function showPage(page) {
  document.querySelectorAll(".page").forEach(section => section.classList.toggle("active", section.id === page));
  document.querySelectorAll(".nav button").forEach(button => button.classList.toggle("active", button.dataset.page === page));
  render(); window.scrollTo(0, 0);
}
function shiftDate(amount) {
  const date = new Date(`${selectedDate}T12:00:00`); date.setDate(date.getDate() + amount);
  selectedDate = localDate(date); render();
}
function taskMarkup(task) {
  return `<div class="row ${task.done ? "done" : ""}">
    <input class="check" type="checkbox" data-task-toggle="${task.id}" ${task.done ? "checked" : ""}>
    <div class="itemtext"><div>${escapeHTML(task.title)}</div><div class="tiny">${escapeHTML(task.category)} · ${escapeHTML(task.priority)} priority</div></div>
    <button class="btn ghost danger" data-task-delete="${task.id}" aria-label="Delete task">×</button></div>`;
}
function habitMarkup(habit) {
  const checked = Boolean(checksForDay()[habit]);
  return `<div class="row ${checked ? "done" : ""}">
    <input class="check" type="checkbox" data-habit="${escapeHTML(habit)}" ${checked ? "checked" : ""}>
    <div class="itemtext">${escapeHTML(habit)}</div><span class="pill">${checked ? "DONE" : "DAILY"}</span></div>`;
}
function render() {
  const tasks = state.tasks.filter(task => task.date === selectedDate);
  const completedTasks = tasks.filter(task => task.done).length;
  const completedHabits = state.habits.filter(habit => checksForDay()[habit]).length;
  const total = tasks.length + state.habits.length;
  const completed = completedTasks + completedHabits;
  const score = total ? Math.round(completed / total * 100) : 0;
  $("todayLabel").textContent = labelDate(selectedDate).toUpperCase();
  $("taskStat").textContent = `${completedTasks}/${tasks.length}`;
  $("habitStat").textContent = `${completedHabits}/${state.habits.length}`;
  $("scoreStat").textContent = `${score}%`;
  $("progressLabel").textContent = `${score}% complete`;
  $("progressBar").style.width = `${score}%`;
  $("homeTasks").innerHTML = tasks.length ? tasks.slice(0,4).map(taskMarkup).join("") : '<div class="empty">No tasks planned. Add one small priority.</div>';
  $("homeHabits").innerHTML = state.habits.map(habitMarkup).join("") || '<div class="empty">Add your first habit.</div>';
  ["taskDate","habitDate","journalDate"].forEach(id => $(id).textContent = labelDate(selectedDate));
  const open = tasks.filter(task => !task.done), done = tasks.filter(task => task.done);
  $("openTasks").innerHTML = open.length ? open.map(taskMarkup).join("") : '<div class="empty">No open tasks for this day.</div>';
  $("doneTasks").innerHTML = done.length ? done.map(taskMarkup).join("") : '<div class="empty">Completed tasks will appear here.</div>';
  $("openCount").textContent = open.length; $("doneCount").textContent = done.length;
  $("habitCount").textContent = `${completedHabits}/${state.habits.length}`;
  $("habitList").innerHTML = state.habits.map(habitMarkup).join("") || '<div class="empty">No habits yet.</div>';
  $("manageHabits").innerHTML = state.habits.map(habit => `<div class="row"><div class="itemtext">${escapeHTML(habit)}</div><button class="btn ghost danger" data-habit-remove="${escapeHTML(habit)}">Remove</button></div>`).join("");
  const journal = journalFor(state, selectedDate);
  [["quickJournal","quick"],["journalWin","win"],["journalImprove","improve"],["journalNote","note"],["mood","mood"]].forEach(([id,key]) => {
    if (document.activeElement !== $(id)) $(id).value = journal[key] || "";
  });
}
function bindEvents() {
  document.querySelectorAll("[data-page]").forEach(button => button.addEventListener("click", () => showPage(button.dataset.page)));
  document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => showPage(button.dataset.go)));
  ["task","habit","journal"].forEach(prefix => {
    $(`${prefix}Prev`).addEventListener("click", () => shiftDate(-1));
    $(`${prefix}Next`).addEventListener("click", () => shiftDate(1));
  });
  $("addTaskBtn").addEventListener("click", () => {
    const title = $("taskInput").value.trim(); if (!title) return $("taskInput").focus();
    addTask(state, { title, category:$("taskCategory").value, priority:$("taskPriority").value, date:selectedDate });
    $("taskInput").value = ""; persist(); toast("Task added");
  });
  $("taskInput").addEventListener("keydown", event => { if (event.key === "Enter") $("addTaskBtn").click(); });
  $("addHabitBtn").addEventListener("click", () => {
    const value = $("habitInput").value.trim(); if (!value) return;
    if (state.habits.some(item => item.toLowerCase() === value.toLowerCase())) return toast("Habit already exists");
    addHabit(state, value); $("habitInput").value = ""; persist(); toast("Habit added");
  });
  $("habitInput").addEventListener("keydown", event => { if (event.key === "Enter") $("addHabitBtn").click(); });
  document.addEventListener("change", event => {
    const target = event.target;
    if (target.matches("[data-task-toggle]")) { toggleTask(state, Number(target.dataset.taskToggle)); persist(); }
    if (target.matches("[data-habit]")) { toggleHabit(state, selectedDate, target.dataset.habit); persist(); }
    if (target.id === "mood") { journalFor(state, selectedDate).mood = target.value; saveState(state); toast("Mood saved"); }
  });
  document.addEventListener("click", event => {
    const del = event.target.closest("[data-task-delete]");
    if (del) { deleteTask(state, Number(del.dataset.taskDelete)); persist(); }
    const remove = event.target.closest("[data-habit-remove]");

    if (remove && confirm(`Remove "${remove.dataset.habitRemove}" from your habit list? Past check-ins remain saved.`)) {
    removeHabit(state, remove.dataset.habitRemove);
    persist();
    }
  });
  [["quickJournal","quick"],["journalWin","win"],["journalImprove","improve"],["journalNote","note"]].forEach(([id,key]) => {
    $(id).addEventListener("input", event => { journalFor(state, selectedDate)[key] = event.target.value; saveState(state); });
  });
  $("exportBtn").addEventListener("click", () => { exportBackup(state); toast("Backup exported"); });
  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", event => {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported.tasks) || !Array.isArray(imported.habits)) throw new Error("Invalid backup");
        if (confirm("Import this backup? It will replace the data currently on this device.")) {
          state.tasks = imported.tasks; state.habits = imported.habits; state.journal = imported.journal || {}; state.checks = imported.checks || {};
          persist(); toast("Backup imported");
        }
      } catch { alert("This file is not a valid Life OS backup."); }
      event.target.value = "";
    };
    reader.readAsText(file);
  });
}
bindEvents(); render();
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(error => console.warn("Offline setup unavailable:", error)));
}