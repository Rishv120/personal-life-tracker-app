export function toggleHabit(state, date, habit) {
  state.checks[date] ||= {};
  state.checks[date][habit] = !state.checks[date][habit];
}
export function addHabit(state, habit) {
  if (!state.habits.some(item => item.toLowerCase() === habit.toLowerCase())) state.habits.push(habit);
}
export function removeHabit(state, habit) {
  state.habits = state.habits.filter(item => item !== habit);
}