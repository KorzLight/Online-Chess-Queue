import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server} from 'socket.io';  

const app = express();
const server = createServer(app);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(__dirname, 'frontend')));

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
