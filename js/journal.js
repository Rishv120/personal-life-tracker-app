export function journalFor(state, date) {
  state.journal[date] ||= { win: "", improve: "", note: "", mood: "", quick: "" };
  return state.journal[date];
}