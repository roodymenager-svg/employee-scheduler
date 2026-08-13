window.openPicker = function(dayIndex, teamIndex = 0) {
  const day = schedule[dayIndex];
  const teams = day.teams.map(team => team.name);
  const isNew = teamIndex >= teams.length;
  const active = day.teams[teamIndex] || { people: [], site: '', chauffeur: '' };
  const names = Object.keys(contacts).sort((a, b) => a.localeCompare(b));
  const picker = $('picker');
  const siteChoices = [...new Set([...sites, ...day.teams.map(team => team.site), active.site].filter(Boolean))];

  picker.classList.remove('hidden');
  picker.innerHTML = `<div class="modal"><h2>Affecter les membres</h2><p>${esc(day.day)} — ${esc(active.name || 'Nouvelle équipe')}</p><div class="picker-controls"><label>Équipe <select id="pickerTeam">${teams.map((name, index) => `<option ${index === teamIndex ? 'selected' : ''}>${esc(name)}</option>`).join('')}<option value="__new" ${isNew ? 'selected' : ''}>Nouvelle équipe</option></select></label></div><div class="picker-controls"><label>Lieu <select id="pickerSite"><option value="">Sélectionnez un lieu</option>${siteChoices.map(site => `<option value="${esc(site)}" ${site === active.site ? 'selected' : ''}>${esc(site)}</option>`).join('')}<option value="__new">Ajouter un lieu</option></select></label></div><div class="picker-controls"><label>Chauffeur <select id="pickerChauffeur"><option value="">Sélectionnez un chauffeur</option>${names.map(name => `<option value="${esc(name)}" ${name === active.chauffeur ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label></div><div class="member-picker">${names.map((name, index) => `<label><input type="checkbox" value="${index}" ${active.people.includes(name) ? 'checked' : ''}> ${esc(name)}</label>`).join('')}</div><div class="modal-actions"><button class="alt" onclick="closePicker()">Annuler</button><button onclick="savePicker(${dayIndex})">Enregistrer l'équipe</button></div></div>`;
  window.pickerNames = names;
  picker.querySelector('#pickerTeam').onchange = event => {
    const team = day.teams.find(item => item.name === event.target.value) || { people: [], site: '', chauffeur: '' };
    picker.querySelectorAll('input').forEach(input => input.checked = team.people.includes(names[Number(input.value)]));
    picker.querySelector('#pickerSite').value = team.site || '';
    picker.querySelector('#pickerChauffeur').value = team.chauffeur || '';
  };
};

window.closePicker = function() {
  $('picker').classList.add('hidden');
  $('picker').innerHTML = '';
};

window.savePicker = function(dayIndex) {
  let teamName = $('pickerTeam').value;
  let site = $('pickerSite').value;
  const chauffeur = $('pickerChauffeur').value;
  if (teamName === '__new') {
    teamName = prompt("Nom de la nouvelle équipe :", `Équipe ${schedule[dayIndex].teams.length + 1}`);
    if (!teamName || !teamName.trim()) return;
    teamName = teamName.trim();
  }
  if (site === '__new') {
    site = prompt('Nom du lieu :');
    if (!site || !site.trim()) return;
    site = site.trim();
    if (!sites.includes(site)) sites.push(site);
  }
  const selected = [...document.querySelectorAll('#picker input:checked')].map(input => window.pickerNames[Number(input.value)]);
  const day = schedule[dayIndex];
  let team = day.teams.find(item => item.name === teamName);
  if (!team) {
    team = { name: teamName, people: [], site: '', chauffeur: '' };
    day.teams.push(team);
  }
  day.teams.forEach(item => { if (item !== team) item.people = item.people.filter(person => !selected.includes(person)); });
  team.people = selected;
  team.site = site;
  team.chauffeur = chauffeur;
  closePicker();
  render();
  queueAutoSave();
  show(`${selected.length} membre(s), le lieu et le chauffeur ont été enregistrés pour ${day.day}.`);
};
