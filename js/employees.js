window.editEmployeeEmail = function(index) {
  const name = window.contactNames[index];
  const email = prompt(`Adresse courriel de ${name} :`, contacts[name] || '');
  if (email === null) return;
  if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return show('Saisissez une adresse courriel valide ou laissez le champ vide.', true);
  contacts[name] = email.trim();
  render();
  queueAutoSave();
  show(`Adresse courriel mise à jour pour ${name}.`);
};

window.addEmployee = function() {
  const name = prompt("Nom complet de l'employé :");
  if (!name || !name.trim()) return;
  const email = prompt("Adresse courriel de l'employé (facultative) :", '');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return show('Saisissez une adresse courriel valide ou laissez le champ vide.', true);
  contacts[name.trim()] = email.trim();
  render();
  queueAutoSave();
  show(`${name.trim()} a été ajouté à la liste des employés.`);
};

window.addSite = function() {
  const site = prompt('Nom du lieu :');
  if (!site || !site.trim()) return;
  const name = site.trim();
  if (sites.includes(name)) return show(`Le lieu « ${name} » existe déjà.`, true);
  sites.push(name);
  queueAutoSave();
  show(`Le lieu « ${name} » a été ajouté. Vous pouvez maintenant le sélectionner dans une affectation.`);
};
