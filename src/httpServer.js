import path from "path";
import { fileURLToPath } from "url";
import connection, { utilities } from "./bot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from "express"; //EXPRESS
import bodyParser from "body-parser";
const app = express();

export default function startServer() {
  app.use(bodyParser.urlencoded({ extended: false })); //DEPENDENCIA PARA MANIPULAR DATOS DE POST
  app.use(bodyParser.json());
  app.use(express.static(__dirname + "/../"));

  app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "/../index.html"));
  });

  app.get("/teams", function (req, res) {
    res.sendFile(path.join(__dirname, "/../teams/teams.html"));
  });

  app.get("/people", function (req, res) {
    connection.query("SELECT * FROM Check_In;", (err, result) => {
      if (err) throw err;
      res.send(JSON.stringify(result));
    });
  });

  app.get("/tourneys", function (req, res) {
    connection.query("SELECT * FROM Tourneys;", (err, result) => {
      if (err) throw err;
      res.send(JSON.stringify(result));
    });
  });

  app.post("/people/:id", async function (req, res) {
    if (req.body.checkin) {
      res.send(await utilities.functions.checkIn(req.params.id));
    } else {
      res.send(await utilities.functions.checkOut(req.params.id));
    }
  });

  app.delete("/people/:username", async function (req, res) {
    res.send(await utilities.functions.removePersonFromTourney(req.params.username));
  });

  app.listen(3000, () => {
    console.log("El servidor está inicializado en el puerto 3000");
  });
}
