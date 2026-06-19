/**
 * Firebase Service – Firestore operations
 */

let db = null;

export function initFirebase(firebaseConfig, needsFirebase) {
  if (!needsFirebase || !firebaseConfig.apiKey) {
    console.log('[FirebaseService] Firebase not needed');
    return null;
  }
  if (typeof firebase === 'undefined') {
    console.error('[FirebaseService] Firebase library missing');
    return null;
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore ? firebase.firestore() : null;
  return db;
}

export function getFirestore() { return db; }

export async function saveBooking(bookingData) {
  if (!db) throw new Error('Firebase not initialized');
  const docRef = await db.collection('bookings').add({
    ...bookingData,
    status: 'pending',
    created_at: firebase.firestore.FieldValue.serverTimestamp()
  });
  return docRef;
}

export async function getBookings() {
  if (!db) throw new Error('Firebase not initialized');
  const snapshot = await db.collection('bookings')
    .orderBy('created_at', 'desc')
    .get();
  const bookings = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    data.id = doc.id;
    bookings.push(data);
  });
  return bookings;
}

export function listenToBookings(onData, onError) {
  if (!db) {
    if (onError) onError(new Error('Firebase not initialized'));
    return () => {};
  }
  return db.collection('bookings')
    .orderBy('created_at', 'desc')
    .onSnapshot(snapshot => {
      const bookings = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        bookings.push(data);
      });
      if (onData) onData(bookings);
    }, error => {
      if (onError) onError(error);
    });
}

export async function updateBookingStatus(bookingId, status) {
  if (!db) throw new Error('Firebase not initialized');
  await db.collection('bookings').doc(bookingId).update({ status });
}

export async function deleteBooking(bookingId) {
  if (!db) throw new Error('Firebase not initialized');
  await db.collection('bookings').doc(bookingId).delete();
}