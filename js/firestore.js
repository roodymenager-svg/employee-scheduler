const DATA_COLLECTION = 'schedulerData';

function getUserDocRef() {
  const user = window.auth.currentUser;
  if (!user) return null;
  return window.db.collection(DATA_COLLECTION).doc(user.uid);
}

async function saveSchedulerData() {
  const userDoc = getUserDocRef();
  if (!userDoc) return;

  const payload = {
    contacts,
    sites,
    schedule,
    periodStart: $('periodStart').value,
    periodEnd: $('periodEnd').value,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  await userDoc.set(payload, { merge: true });
  show('Horaire enregistré dans Firestore.');
}

async function loadSchedulerData() {
  const userDoc = getUserDocRef();
  if (!userDoc) return;

  try {
    const snapshot = await userDoc.get();
    if (!snapshot.exists) {
      render();
      show("Aucune donnée enregistrée pour l'instant. Vos changements seront sauvegardés automatiquement.");
      return;
    }

    const data = snapshot.data();
    contacts = data.contacts || contacts;
    sites = data.sites || [];
    schedule = data.schedule || schedule;
    rebuildScheduleArchive();
    if (data.periodStart) $('periodStart').value = data.periodStart;
    if (data.periodEnd) $('periodEnd').value = data.periodEnd;
    render();
    show('Données du planificateur chargées depuis Firestore.');
  } catch (error) {
    show(`Impossible de charger les données du planificateur : ${error.message}`, true);
  }
}

async function saveSchedulerDataDebounced() {
  if (!window.auth.currentUser) return;
  try {
    await saveSchedulerData();
  } catch (error) {
    show(`Impossible d'enregistrer les données du planificateur : ${error.message}`, true);
  }
}

window.saveSchedulerDataDebounced = saveSchedulerDataDebounced;

function bindFirestoreAutosave() {
  ['addEmployee', 'addAssignment', 'updatePeriod', 'previousPeriod', 'nextPeriod', 'importFile'].forEach((id) => {
    const el = $(id);
    if (el) {
      el.addEventListener('click', () => setTimeout(() => saveSchedulerDataDebounced(), 300));
    }
  });

  const saveButton = $('saveData');
  if (saveButton) {
    saveButton.onclick = () => saveSchedulerDataDebounced();
  }

  const loadButton = $('loadData');
  if (loadButton) {
    loadButton.onclick = () => loadSchedulerData();
  }

  const clearButton = $('clearData');
  if (clearButton) {
    clearButton.onclick = async () => {
      if (!confirm('Effacer les données enregistrées ?')) return;
      const userDoc = getUserDocRef();
      if (!userDoc) return;
      await userDoc.delete();
      contacts = { ...seedContacts };
      sites = [];
      const start = parseCalendarDate($('periodStart').value);
      const end = parseCalendarDate($('periodEnd').value);
      schedule = [];
      scheduleArchive = new Map();
      for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        schedule.push(blankDay(new Date(date)));
      }
      rebuildScheduleArchive();
      render();
      show('Données enregistrées effacées de Firestore.');
    };
  }

  const exportButton = $('exportBackup');
  if (exportButton) {
    exportButton.onclick = () => {
      const blob = new Blob([JSON.stringify({ contacts, sites, schedule, periodStart: $('periodStart').value, periodEnd: $('periodEnd').value }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'JCL-Schedule.json';
      a.click();
    };
  }

  const importBackup = $('importBackup');
  if (importBackup) {
    importBackup.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const data = JSON.parse(reader.result);
          contacts = data.contacts || contacts;
          sites = data.sites || [];
          schedule = data.schedule || schedule;
          rebuildScheduleArchive();
          if (data.periodStart) $('periodStart').value = data.periodStart;
          if (data.periodEnd) $('periodEnd').value = data.periodEnd;
          render();
          await saveSchedulerData();
          show('Sauvegarde importée et enregistrée dans Firestore.');
        } catch (error) {
          show(`Échec de l'importation de la sauvegarde : ${error.message}`, true);
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    };
  }
}

window.addEventListener('DOMContentLoaded', () => {
  bindFirestoreAutosave();
});
