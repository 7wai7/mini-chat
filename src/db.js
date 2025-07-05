import { Sequelize } from 'sequelize';

const isRender = process.env.RENDER === "true";

let sequelize;


export async function getDb() {
    return sequelize;
}

export async function initDb() {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ...(isRender && {
                ssl: {
                    rejectUnauthorized: false
                }
            })
        }
    });
    
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
