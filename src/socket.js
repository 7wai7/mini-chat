import WebSocket, { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs/promises';
import { getDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export default function initSocket(server) {
    const wss = new WebSocketServer({
        server
        /* port: 3001,
        host: '0.0.0.0' */
    })

    wss.on('connection', async ws => {
        ws.id = Date.now().toString() + "_" + Math.floor(Math.random() * 1e7);
        const db = await getDb();

        ws.on('message', async raw => {
            try {
                let msg;
                try {
                    msg = JSON.parse(raw.toString());
                } catch (err) {
                    console.error('Invalid JSON:', raw);
                    return;
                }

                if (msg.type === "send message") {
                    console.log("Нове повідомлення:", msg.text);
                    
                    const newMessage = {
                        id: Date.now().toString() + "_" + Math.floor(Math.random() * 1e7),
                        sender: msg.name,
                        text: msg.text,
                        date: new Date().toISOString()
                    }


                    await db.query(
                        `INSERT INTO messages (id, sender, text, date) VALUES ($1, $2, $3, $4)`,
                        [newMessage.id, newMessage.sender, newMessage.text, newMessage.date]
                    );

                    // Розсилка після успішного збереження
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: "new message",
                                message: newMessage
                            }));
                        }
                    });
                }
            } catch (err) {
                console.error('Помилка в обробці повідомлення:', err);

                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Сталася помилка на сервері'
                }));
            }
        })

        ws.on('close', () => {
            console.log(`Зʼєднання з клієнтом ${ws.id} закрито`);
        });

        ws.on('error', err => {
            console.error('WebSocket помилка:', err);
        });

        
        
        const messages = await db.query(`
            SELECT * FROM messages ORDER BY date DESC LIMIT 20
        `);

        ws.send(JSON.stringify({
            type: "get messages",
            id: ws.id,
            messages: messages.reverse()
        }))

    })
}