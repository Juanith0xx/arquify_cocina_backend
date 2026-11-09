import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

addDoc(collection(db, 'textures'), { test: true }).then(() => {
  console.log('Write successful');
  process.exit(0);
}).catch((error) => {
  console.error('Write failed:', error.code, error.message);
  process.exit(1);
});
