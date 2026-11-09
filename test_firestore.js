import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

getDocs(collection(db, 'textures')).then(() => {
  console.log('Read successful');
  process.exit(0);
}).catch((error) => {
  console.error('Read failed:', error.code, error.message);
  process.exit(1);
});
