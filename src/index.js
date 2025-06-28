import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parse } from 'url';
import { parse as parseQuery } from 'querystring';
import fs from 'fs';
import initSocket from './socket.js';
import { getDb, initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;


const parseBody = (req, res, cb) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk;
    });

    req.on('end', () => {
        cb(body);
    });

    req.on('error', (err) => {
        console.error('Помилка під час зчитування body:', err);
        res.writeHead(500);
        res.end();
    });
}

const server = http.createServer(async (req, res) => {
    try {
        const parsedUrl = parse(req.url);
        req.query = parseQuery(parsedUrl.query);
        const db = await getDb();

        if (req.method === "GET" && parsedUrl.pathname === "/api/messages") {
            const offset = req.query.offset || 0;

            const messages = await db.all(`
                SELECT * FROM messages ORDER BY date DESC LIMIT 20 OFFSET ${offset}
            `);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                messages: messages.reverse()
            }));

            

            return;
        }



        const filePath = path.join(__dirname, '../', 'public', req.url === '/' ? 'index.html' : req.url);

        fs.exists(filePath, (exists) => {
            if (!exists) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
                return;
            }

            const extname = path.extname(filePath);
            let contentType = 'application/octet-stream'; // Default
            switch (extname) {
                case '.html':
                    contentType = 'text/html';
                    break;
                case '.css':
                    contentType = 'text/css';
                    break;
                case '.js':
                    contentType = 'text/javascript';
                    break;
                case '.json':
                    contentType = 'application/json';
                    break;
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.jpg':
                    contentType = 'image/jpeg';
                    break;
            }
            res.writeHead(200, { 'Content-Type': contentType });

            const readStream = fs.createReadStream(filePath);
            readStream.pipe(res);

            readStream.on('error', (err) => {
                console.error('Error reading file:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            });
        });
    } catch (err) {
        console.log(err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error', err);
    }
});


await initDb();
initSocket(server);

server.listen(PORT, () => {
    console.log(`Server running`);
});