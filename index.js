require('dotenv').config();
const isDevelopment = (process.env.NODE_ENV === 'development');
const express = require('express');
const app = express();
const fs = require('fs');

let options = {};
if (isDevelopment) {
    options = {
        key: fs.readFileSync('./localhost.key'),
        cert: fs.readFileSync('./localhost.crt')
    };
}

const server = require(isDevelopment ? 'https' : 'http').Server(options, app);
const port = process.env.PORT || 443;
const protocol = isDevelopment ? 'https' : 'http';

app.use(express.static('public'));

server.listen(port, () => {
    const url = `${protocol}://localhost:${port}`;
    console.log(`App listening on port:${port} (${url})`);
});