export function addTask(state, { title, category, priority, date }) {
  state.tasks.push({ id: Date.now() + Math.random(), title, category, priority, date, done: false });
}
export function toggleTask(state, id) {
  const task = state.tasks.find(item => item.id === id);
  if (task) task.done = !task.done;
}
export function deleteTask(state, id) { state.tasks = state.tasks.filter(item => item.id !== id); }