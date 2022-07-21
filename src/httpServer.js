import http from "http";
import { promises } from "fs";
const fs = promises;
import path from "path";
import { fileURLToPath } from "url";
import connection, { utilities } from "./bot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function startServer() {
  const host = "localhost";
  const port = 8000;

  const requestListener = async function (req, res) {
    // console.log(__dirname + "/.." + (req.url === "/" ? "/index.html" : req.url));
    switch (req.method) {
      case "GET":
        switch (req.url) {
          case "/":
            fs.readFile(__dirname + "/../index.html")
              .then((contents) => {
                res.setHeader("Content-Type", "text/html");
                res.writeHead(200);
                res.end(contents);
              })
              .catch((err) => {
                console.error(`Could not read ${req.url} file: ${err}`);
              });
            break;
          case "/tourneys":
            connection.query("SELECT * FROM Tourneys;", (err, result) => {
              if (err) throw err;
              res.setHeader("Content-Type", "application/json");
              res.writeHead(200);
              res.end(JSON.stringify(result));
            });
            break;
          case "/people":
            connection.query("SELECT * FROM Check_In;", (err, result) => {
              if (err) throw err;
              res.setHeader("Content-Type", "application/json");
              res.writeHead(200);
              res.end(JSON.stringify(result));
            });
            break;
          default:
            fs.readFile(__dirname + "/.." + req.url)
              .then((contents) => {
                res.setHeader("Content-Type", "text/html");
                res.writeHead(200);
                res.end(contents);
              })
              .catch((err) => {
                console.error(`Could not read ${req.url} file: ${err}`);
              });
        }
        break;
      case "POST":
        if (req.url.match(/\/checkout\//)) {
          const url = req.url.split("/");
          const username = url[url.length - 1];
          const response = await utilities.functions.checkOut(username);
          res.setHeader("Content-Type", "application/json");
          res.writeHead(200);
          res.end(JSON.stringify(response));
        } else if (req.url.match(/\/checkin\//)) {
          const url = req.url.split("/");
          const username = url[url.length - 1];
          const response = await utilities.functions.checkIn(username);
          res.setHeader("Content-Type", "application/json");
          res.writeHead(200);
          res.end(JSON.stringify(response));
        }
        break;
      case "DELETE":
        if (req.url.match(/\/people\/\w+/)) {
          const url = req.url.split("/");
          const username = url[url.length - 1];
          const response = await utilities.functions.removePersonFromTourney(username);
          res.setHeader("Content-Type", "application/json");
          res.writeHead(200);
          res.end(JSON.stringify(response));
        } else if (req.url.match(/\/people/)) {
          const response = await utilities.functions.clearTourney();
          res.setHeader("Content-Type", "application/json");
          res.writeHead(200);
          res.end(JSON.stringify(response));
        }
        break;
    }
  };

  const server = http.createServer(requestListener);
  server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
  });
  /*
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
    */
}
