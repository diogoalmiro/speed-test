const http = require("http");
const { createReadStream } = require("fs");
const Database = require("better-sqlite3");

let port = parseInt(process.env.PORT);
if( !port ) throw new Error("Invalid PORT");

const db = new Database("speed.db");

const selectStm = db.prepare(`SELECT start, end, duration, filesize, (filesize / duration) AS speed FROM speed ORDER BY id DESC LIMIT :limit OFFSET :offset`);
const perPage = 100;

http.createServer((req, res) => {
    let url = new URL(req.url, "http://localhost");
    try{
    if( url.pathname === "/" || url.pathname === "/index.html") {
        createReadStream("index.html").pipe(res);
    }
    else if( url.pathname === "/results") {
        const page = parseInt(url.searchParams.get("page") || "1");
        const results = selectStm.all({
            limit: perPage,
            offset: page * perPage,
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(results));
    }
    else {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 Not Found</h1>");
    }
    } catch (error) {
        console.error(url.pathname, error);
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end("<h1>500 Internal Server Error</h1>");
    }
}).listen(port, () => {
    console.log(`Server is running on port ${port}`);
});