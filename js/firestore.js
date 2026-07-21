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
  show('Schedule saved to Firestore.');
}

async function loadSchedulerData() {
  const userDoc = getUserDocRef();
  if (!userDoc) return;

  try {
    const snapshot = await userDoc.get();
    if (!snapshot.exists) {
      render();
      show('No saved scheduler data yet. Your changes will be stored automatically.');
      return;
    }

    const data = snapshot.data();
    contacts = data.contacts || contacts;
    sites = data.sites || [];
    schedule = data.schedule || schedule;
    if (data.periodStart) $('periodStart').value = data.periodStart;
    if (data.periodEnd) $('periodEnd').value = data.periodEnd;
    render();
    show('Scheduler data loaded from Firestore.');
  } catch (error) {
    show(`Unable to load scheduler data: ${error.message}`, true);
  }
}

async function saveSchedulerDataDebounced() {
  if (!window.auth.currentUser) return;
  try {
    await saveSchedulerData();
  } catch (error) {
    show(`Unable to save scheduler data: ${error.message}`, true);
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
      if (!confirm('Clear saved data?')) return;
      const userDoc = getUserDocRef();
      if (!userDoc) return;
      await userDoc.delete();
      show('Saved data cleared from Firestore.');
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
          if (data.periodStart) $('periodStart').value = data.periodStart;
          if (data.periodEnd) $('periodEnd').value = data.periodEnd;
          render();
          await saveSchedulerData();
          show('Backup imported and saved to Firestore.');
        } catch (error) {
          show(`Backup import failed: ${error.message}`, true);
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
