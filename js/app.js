window.emailFor = function(daysToSend) {
  const entries = daysToSend.flatMap(day => visiblePeople(day).map(item => ({ ...item, day: day.day })));
  const recipients = [...new Set(entries.map(item => contacts[item.person]).filter(Boolean))];
  if (!recipients.length) return show("Aucun employé planifié n'a d'adresse courriel. Ajoutez des coordonnées avant de préparer un courriel.", true);

  const byPerson = {};
  entries.forEach(entry => {
    if (!contacts[entry.person]) return;
    const details = [entry.team, entry.site && `Lieu : ${entry.site}`, entry.chauffeur && `Chauffeur : ${entry.chauffeur}`].filter(Boolean).join(' | ');
    (byPerson[entry.person] ??= []).push(`${entry.day} - ${details}`);
  });
  const body = ['Bonjour,', '', 'Voici votre horaire de travail JCL :', '', ...Object.entries(byPerson).flatMap(([name, items]) => [ `${name} :`, ...items.map(item => `- ${item}`), '' ]), 'Veuillez communiquer avec votre superviseur si vous avez des questions.', '', 'JCL Multiservices'].join('\n');
  window.location.href = `mailto:${encodeURIComponent(recipients.join(','))}?subject=${encodeURIComponent('Horaire de travail JCL')}&body=${encodeURIComponent(body)}`;
  const missing = [...new Set(entries.map(entry => entry.person).filter(person => !contacts[person]))];
  show(`Brouillon de courriel préparé pour ${recipients.length} employé(s).${missing.length ? ` Courriel manquant : ${missing.join(', ')}.` : ''}`);
};

window.prepareDay = function(index) { emailFor([schedule[index]]); };

function initApp() {
  $('sendAll').addEventListener('click', () => emailFor(schedule));
  $('importFile').addEventListener('change', event => {
    if (event.target.files[0]) importWorkbook(event.target.files[0]);
    event.target.value = '';
  });
  setCalendarPeriod(parseCalendarDate($('periodStart').value), parseCalendarDate($('periodEnd').value));
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

window.appState = function() {
  return { contacts, sites, schedule, periodStart: $('periodStart').value, periodEnd: $('periodEnd').value };
};
