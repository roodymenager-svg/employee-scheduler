window.excelDate = function(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(Math.round((value - 25569) * 86400 * 1000));
  return null;
};

window.importWorkbook = function(file) {
  if (!window.XLSX) return show("La bibliothèque d'importation Excel n'a pas pu être chargée. Connectez-vous à Internet, rechargez la page et réessayez.", true);
  const reader = new FileReader();
  reader.onload = event => {
    try {
      const workbook = XLSX.read(event.target.result, { type: 'array', cellDates: true });
      if (workbook.SheetNames.length < 2) throw Error("Le classeur doit contenir une feuille d'horaire et une feuille de coordonnées des employés.");
      const contactRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]], { header: 1, defval: '' });
      const newContacts = {};
      contactRows.slice(1).forEach(row => {
        const name = String(row[0] || '').trim();
        const email = String(row[1] || '').trim();
        if (name) newContacts[name] = email;
      });
      if (!Object.keys(newContacts).length) throw Error("Aucun nom d'employé n'a été trouvé dans la deuxième feuille.");
      contacts = { ...contacts, ...newContacts };

      const grid = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: '', raw: true });
      const weekdayPattern = /lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i;
      const dayRow = grid.findIndex(row => row.some(cell => weekdayPattern.test(String(cell))));
      if (dayRow < 0) throw Error("Impossible de trouver les en-têtes des jours dans la première feuille.");
      const dateRow = dayRow + 1;
      const imported = [];
      grid[dayRow].forEach((label, column) => {
        if (!weekdayPattern.test(String(label))) return;
        const date = excelDate(grid[dateRow]?.[column + 1]) || excelDate(grid[dateRow]?.[column]);
        const dayLabel = date ? date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'short' }) : String(label);
        const people = [];
        for (let row = dateRow + 2; row < grid.length; row += 1) {
          const value = String(grid[row]?.[column] || '').trim();
          if (newContacts[value] !== undefined || contacts[value] !== undefined) people.push(value);
        }
        if (people.length) imported.push({ day: dayLabel, teams: [{ name: 'Équipe importée', people: [...new Set(people)], site: '', chauffeur: '' }] });
      });
      if (imported.length) schedule = imported;
      rebuildScheduleArchive();
      render();
      queueAutoSave();
      show(`${Object.keys(newContacts).length} coordonnée(s) d'employé et ${imported.length || schedule.length} journée(s) planifiée(s) importées.`);
    } catch (error) {
      show(`${t('importFailed')} ${error.message}`, true);
    }
  };
  reader.readAsArrayBuffer(file);
};
