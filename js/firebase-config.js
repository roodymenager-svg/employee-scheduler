const firebaseConfig = {
  apiKey: 'AIzaSyBQ5r7ji5PUCx8AzdbAFzRLBfa720-VhrE',
  authDomain: 'jcl-employee-scheduler.firebaseapp.com',
  projectId: 'jcl-employee-scheduler',
  storageBucket: 'jcl-employee-scheduler.firebasestorage.app',
  messagingSenderId: '292858237866',
  appId: '1:292858237866:web:57df5703a29f21ee4351d3'
};

firebase.initializeApp(firebaseConfig);
window.auth = firebase.auth();
window.db = firebase.firestore();
window.firebaseConfig = firebaseConfig;
