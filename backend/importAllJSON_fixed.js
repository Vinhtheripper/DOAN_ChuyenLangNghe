const { MongoClient, ObjectId } = require('mongodb'); // Thêm ObjectId
const fs = require('fs');
const path = require('path');

const folderPath = "C:\\Users\\ADMIN\\Downloads\\Data-20250925T160236Z-1-001\\Data";
const mongoURI = "mongodb://localhost:27017";
const dbName = "mydb";

function convertIds(obj) {
  if (Array.isArray(obj)) return obj.map(convertIds);
  if (obj && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (key === '_id' && obj[key] && obj[key].$oid) {
        newObj[key] = new ObjectId(obj[key].$oid); // convert $oid sang ObjectId
      } else {
        newObj[key] = convertIds(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

async function importJSON() {
  const client = new MongoClient(mongoURI);
  try {
    await client.connect();
    console.log('MongoDB connected');
    const db = client.db(dbName);

    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(folderPath, file);
      const collectionName = path.parse(file).name.replace('ClayCoDatabase.', '');

      let data;
      try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        data = convertIds(data); // <-- convert $oid sang ObjectId
        console.log(`\nLoaded ${Array.isArray(data) ? data.length : 1} records from ${file}`);
      } catch (err) {
        console.error(`Error reading/parsing ${file}:`, err);
        continue;
      }

      const collections = await db.listCollections({ name: collectionName }).toArray();
      if (collections.length > 0) {
        await db.collection(collectionName).drop();
        console.log(`Dropped existing collection: ${collectionName}`);
      }

      if (Array.isArray(data)) {
        const res = await db.collection(collectionName).insertMany(data);
        console.log(`Inserted ${res.insertedCount} documents into collection ${collectionName}`);
      } else {
        await db.collection(collectionName).insertOne(data);
        console.log(`Inserted 1 document into collection ${collectionName}`);
      }
    }

    console.log('\nAll JSON files processed.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('MongoDB disconnected');
  }
}

importJSON();
