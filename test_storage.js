import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const storageRef = ref(storage, 'test.txt');
uploadString(storageRef, 'Hello World').then(() => {
  console.log('Upload successful');
  process.exit(0);
}).catch((error) => {
  console.error('Upload failed:', error.code, error.message);
  process.exit(1);
});
