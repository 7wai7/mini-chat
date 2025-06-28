import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const dbDir = '/var/data';
const dbPath = path.join(dbDir, 'chat.db');

// Створити директорію, якщо її немає
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

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
