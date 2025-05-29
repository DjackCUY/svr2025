import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = 'svr-2025';

export default async function handler(req, res) {
const client = new MongoClient(uri);

try {
    await client.connect();
    const db = client.db(dbName);
    const data = await db.collection('form_daftar').find().toArray();

    res.status(200).json(data);
} catch (err) {
    console.error('MongoDB error:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
} finally {
    await client.close();
}
}