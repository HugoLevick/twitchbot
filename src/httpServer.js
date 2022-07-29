import path from "path";
import { fileURLToPath } from "url";
import connection, { insertIntoDatabase, queryDatabase, utilities } from "./bot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express, { query } from "express"; //EXPRESS
import bodyParser from "body-parser";
import { link } from "fs";
import { start } from "repl";
const app = express();

export default function startServer() {
  app.use(bodyParser.urlencoded({ extended: false })); //DEPENDENCIA PARA MANIPULAR DATOS DE POST
  app.use(bodyParser.json());
  app.use(express.static(__dirname + "/../"));

  app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "/../index.html"));
  });

  app.get("/managetourneys", function (req, res) {
    res.sendFile(path.join(__dirname, "/../tourneys/managetourneys.html"));
  });

  app.get("/managetourneys/new", function (req, res) {
    res.sendFile(path.join(__dirname, "/../tourneys/new/newtourney.html"));
  });

  app.get("/teams", function (req, res) {
    res.sendFile(path.join(__dirname, "/../teams/teams.html"));
  });

  app.get("/bannedpeople", function (req, res) {
    res.sendFile(path.join(__dirname, "/../banned/banned.html"));
  });

  app.get("/people", function (req, res) {
    connection.query("SELECT * FROM Check_In;", (err, result) => {
      if (err) throw err;
      res.send(JSON.stringify(result));
    });
  });

  app.get("/banned", async function (req, res) {
    queryDatabase("SELECT * FROM banned;")
      .then((result) => res.send(JSON.stringify(result)))
      .catch((err) => {
        if (err.code === "ER_NO_SUCH_TABLE") {
          queryDatabase("CREATE TABLE banned (username varchar(255));").then(async () => {
            const result = await queryDatabase("SELECT * FROM banned;");
            res.send(JSON.stringify(result));
          });
        } else throw err;
      });
  });

  app.get("/tourneys", function (req, res) {
    connection.query("SELECT * FROM Tourneys ORDER BY start DESC;", (err, result) => {
      if (err) throw err;
      res.send(JSON.stringify(result));
    });
  });

  app.get("/tourneys/:id", function (req, res) {
    connection.query("SELECT * FROM Tourneys WHERE id=" + req.params.id, (err, result) => {
      if (err) throw err;
      res.send(JSON.stringify(result));
    });
  });

  app.get("/edit/tourney/", function (req, res) {
    res.sendFile(path.join(__dirname, "/../tourneys/edit/editTourney.html"));
  });

  app.put("/people/:id", async function (req, res) {
    if (req.body.checkin) {
      res.send(await utilities.functions.checkIn(req.params.id));
    } else {
      res.send(await utilities.functions.checkOut(req.params.id));
    }
  });

  app.post("/people", async function (req, res) {
    insertIntoDatabase("check_in", "username", `"${req.body.username}"`)
      .then((response) => {
        if (response.affectedRows > 0) res.send(JSON.stringify(true));
        else res.send(JSON.stringify(false));
      })
      .catch(async (err) => {
        switch (err.code) {
          case "ER_NO_SUCH_TABLE":
            queryDatabase("CREATE TABLE banned (username varchar(255) unique);").then(async () => {
              res.send(JSON.stringify([]));
            });
            break;
          case "ER_DUP_ENTRY":
            res.send(JSON.stringify(false));
            break;
          default:
            console.log(err);
        }
      });
  });

  app.post("/tourneys", async function (req, res) {
    const { tourneyName, tourneyPrize, radiosPrize, freeEntry, entryFee, selectedMode, randomized, tourneyLink } = req.body;
    const [startDate, startHours] = req.body.startDate.split("T");
    const [endDate, endHours] = req.body.endDate.split("T");

    //prettier-ignore
    queryDatabase(`INSERT INTO tourneys (name, start, finish, mode, prize, entry, randomized${tourneyLink ?', link':''}) VALUES ('${tourneyName}', '${startDate} ${startHours}', '${endDate} ${endHours}', '${selectedMode}', '${tourneyPrize !== ''? `${tourneyPrize} ${radiosPrize}` : `no`}', ${freeEntry === 'on' ? '0' : entryFee}, ${randomized === 'on' ? '1' : '0'}${tourneyLink ? `, '${tourneyLink}'` : ''})`)
    .then(()=>{
      console.log('Created tourney ' + tourneyName);
      res.redirect("/managetourneys");
    })
    .catch((err)=>{
      console.log('--------------ERROR WHEN CREATING TOURNEY ' + tourneyName + '------------------');
      console.log(err);
      res.redirect('/');
    })
  });

  app.post("/tourneys/:id", (req, res) => {
    if (req.body._method === "PUT") {
      const { tourneyName, tourneyPrize, radiosPrize, freeEntry, entryFee, selectedMode, randomized, tourneyLink, id } = req.body;
      const [startDate, startHours] = req.body.startDate.split("T");
      const [endDate, endHours] = req.body.endDate.split("T");
      //prettier-ignore
      queryDatabase(`UPDATE tourneys SET name='${tourneyName}', prize='${tourneyPrize == 0? '0' : `${tourneyPrize} ${radiosPrize}`}', entry=${freeEntry === 'on' ? '0' : entryFee}, mode='${selectedMode}', link='${tourneyLink}', randomized=${randomized === 'on' ? 1 : 0}, start='${startDate} ${startHours}', finish='${endDate} ${endHours}' WHERE id=${id};`)
      .then(()=> {
        res.redirect('/managetourneys/?success=1');
      })
      .catch((err) => {
        console.log(err);
      })
    }
  });

  app.post("/banned", async function (req, res) {
    insertIntoDatabase("banned", "username", `"${req.body.username}"`)
      .then((response) => {
        if (response.affectedRows > 0) res.send(JSON.stringify(true));
        else res.send(JSON.stringify(false));
      })
      .catch(async (err) => {
        switch (err.code) {
          case "ER_NO_SUCH_TABLE":
            queryDatabase("CREATE TABLE banned (username varchar(255));").then(async () => {
              res.send(JSON.stringify([]));
            });
            break;
          case "ER_DUP_ENTRY":
            res.send(JSON.stringify(false));
            break;
          default:
            console.log(err);
        }
      });
  });

  app.delete("/people", async function (req, res) {
    res.send(await utilities.functions.clearTourney());
  });

  app.delete("/people/:username", async function (req, res) {
    res.send(await utilities.functions.removePersonFromTourney(req.params.username));
  });

  app.delete("/banned", async function (req, res) {
    const response = await unbanEveryone();
    res.send(JSON.stringify(response));
  });

  app.delete("/banned/:username", async function (req, res) {
    res.send(await unbanPerson(req.params.username));
  });

  app.delete("/tourneys/:id", async function (req, res) {
    queryDatabase("DELETE FROM tourneys WHERE id=" + req.params.id)
      .then((resp) => {
        res.send(JSON.stringify(resp));
      })
      .catch((err) => {
        res.send(JSON.stringify(err));
      });
  });

  app.listen(3000, () => {
    console.log("Server initialized on port 3000(localhost:3000)");
  });
}

async function unbanPerson(username) {
  return await new Promise((res) => {
    connection.query(`DELETE FROM banned WHERE username="${username}";`, (err, result) => {
      if (err) console.log(err);
      if (result.affectedRows !== 0) res(true);
      else res(false);
    });
  });
}

async function unbanEveryone() {
  return await new Promise((res) => {
    connection.query(`TRUNCATE banned;`, (err) => {
      if (err) {
        console.log(err);
        res(false);
      }
      res(true);
    });
  });
}
