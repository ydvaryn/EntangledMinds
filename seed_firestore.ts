import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seed() {
  console.log("Seeding Firestore (Client SDK)...");

  const categories = [
    { name: 'Algorithms', slug: 'algorithms', description: 'Efficiency of computing.' },
    { name: 'Data Structures', slug: 'data-structures', description: 'Organizing information.' }
  ];

  for (const cat of categories) {
    await setDoc(doc(db, 'categories', cat.slug), cat);
  }

  const tutorials = [
    {
      title: 'Big O Notation',
      slug: 'big-o-notation',
      content: '# Understanding Big O\n\nBig O notation is used to describe the efficiency of an algorithm...',
      excerpt: 'Learn how to measure performance in computing.',
      category_id: 'algorithms',
      author_id: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  for (const tut of tutorials) {
    await setDoc(doc(db, 'tutorials', tut.slug), tut);
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
