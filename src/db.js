import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join('/var/data', 'chat.db');

export async function getDb() {
    return open({
        filename: dbPath,
        driver: sqlite3.Database
    });
}

export async function initDb() {
    const db = await getDb();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            sender TEXT,
            text TEXT,
            date TEXT
        );
    `);
}
