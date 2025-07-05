import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // потрібне для Render
    }
});

export async function getDb() {
    return pool;
}

export async function initDb() {
    const db = await getDb();
    await db.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            sender TEXT,
            text TEXT,
            date TEXT
        );
    `);
}
