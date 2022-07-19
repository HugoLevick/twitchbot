import http from "http";
import { promises } from "fs";
const fs = promises;
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function startServer() {
  const host = "localhost";
  const port = 8000;

  const requestListener = function (req, res) {
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end(indexFile);
  };

  const server = http.createServer(requestListener);

  let indexFile;

  fs.readFile(__dirname + "/../index.html")
    .then((contents) => {
      indexFile = contents;
      server.listen(port, host, () => {
        console.log(`Server is running on http://${host}:${port}`);
      });
    })
    .catch((err) => {
      console.error(`Could not read index.html file: ${err}`);
      process.exit(1);
    });
}
