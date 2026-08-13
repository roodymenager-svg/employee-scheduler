window.blankDay = function(date) {
  return { day: scheduleDayLabel(date), teams: [{ name: 'Équipe 1', people: [], site: '', chauffeur: '' }, { name: 'Équipe 2', people: [], site: '', chauffeur: '' }, { name: 'Équipe 3', people: [], site: '', chauffeur: '' }] };
};

window.cloneScheduleDay = function(day) { return JSON.parse(JSON.stringify(day)); };
window.rebuildScheduleArchive = function() { scheduleArchive = new Map(schedule.map(day => [day.day, cloneScheduleDay(day)])); };

window.setCalendarPeriod = function(start, end) {
  if (!(start instanceof Date) || !(end instanceof Date) || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    show('Choisissez une date de début et une date de fin valides.', true);
    return false;
  }
  schedule.forEach(day => scheduleArchive.set(day.day, cloneScheduleDay(day)));
  const next = [];
  for (const current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    const label = scheduleDayLabel(current);
    next.push(scheduleArchive.has(label) ? cloneScheduleDay(scheduleArchive.get(label)) : blankDay(current));
  }
  schedule = next;
  $('periodStart').value = dateInputValue(start);
  $('periodEnd').value = dateInputValue(end);
  $('period').textContent = `${start.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })} - ${end.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  render();
  queueAutoSave();
  return true;
};

window.updateCalendarPeriod = function() {
  const updated = setCalendarPeriod(parseCalendarDate($('periodStart').value), parseCalendarDate($('periodEnd').value));
  if (updated) show('Période de l’horaire mise à jour.');
};
window.shiftCalendarPeriod = function(daysToMove) {
  const start = parseCalendarDate($('periodStart').value);
  const end = parseCalendarDate($('periodEnd').value);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return show('Choisissez une date de début et une date de fin valides.', true);
  start.setDate(start.getDate() + daysToMove);
  end.setDate(end.getDate() + daysToMove);
  setCalendarPeriod(start, end);
};
window.visiblePeople = function(day) { return day.teams.flatMap(team => team.people.map(person => ({ person, team: team.name, site: team.site || '', chauffeur: team.chauffeur || '' }))); };
window.addAssignment = function() {
  const choices = schedule.map((day, index) => `${index + 1}. ${day.day}`).join('\n');
  const answer = prompt(`Choisissez la journée de la nouvelle affectation :\n${choices}`, '1');
  if (answer === null) return;
  const index = Number(answer) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= schedule.length) return show('Choisissez un numéro de journée valide.', true);
  openPicker(index, schedule[index].teams.length);
};
