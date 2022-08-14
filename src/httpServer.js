import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connection, {
  addToTourney,
  bottedChannel,
  checkTourneysStatus,
  isInTourney,
  queryDatabase,
  scheduleTourneys,
  tourneyLocalT,
  utilities,
} from "./bot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import bodyParser from "body-parser";
import Solo, { Draft } from "./teamClass.js";

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

  app.get("/teams/draft", function (req, res) {
    res.sendFile(path.join(__dirname, "/../teams/draft.html"));
  });

  app.get("/subs", function (req, res) {
    res.sendFile(path.join(__dirname, "/../subs/subs.html"));
  });

  app.get("/subs/subPick", function (req, res) {
    res.sendFile(path.join(__dirname, "/../subs/subPick.html"));
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
      if (result.length > 0) {
        tourneyLocalT(result, "iso");
        res.send(JSON.stringify(result));
      } else res.send(JSON.stringify([]));
    });
  });

  app.get("/current/tourneys", async function (req, res) {
    queryDatabase("SELECT * FROM tourneys WHERE finish > NOW() ORDER BY start DESC")
      .then((result) => {
        for (let t in result) {
          t = result[t];
          t = tourneyLocalT(t, "iso");
        }
        res.send(JSON.stringify(result));
      })
      .catch((err) => {
        console.log(err);
        res.send(JSON.stringify([]));
      });
  });

  app.get("/current/channel", async function (req, res) {
    res.send(JSON.stringify(bottedChannel));
  });

  app.get("/tourneys/:id", async function (req, res) {
    queryDatabase("SELECT * FROM Tourneys WHERE id=" + req.params.id)
      .then((result) => {
        if (result.length > 0) {
          tourneyLocalT(result, "iso");
          res.send(JSON.stringify(result));
        } else res.send(JSON.stringify([]));
      })
      .catch((err) => {
        console.log(err);
        res.send(JSON.stringify(false));
      });
  });

  app.get("/edit/tourney/", function (req, res) {
    res.sendFile(path.join(__dirname, "/../tourneys/edit/editTourney.html"));
  });

  app.put("/check/:id/:name", async function (req, res) {
    if (req.body.check === "in") {
      res.send(await utilities.functions.check(req.params.id, req.params.name, "in"));
    } else {
      res.send(await utilities.functions.check(req.params.id, req.params.name, "out"));
    }
  });

  app.put("/tourneys/:id/people/:name", async function (req, res) {
    res.send(await editPerson(req.params.name, req.params.id, req.body.edit));
  });

  app.put("/tourneys/:id/subs/:name", async function (req, res) {
    res.send(await editSub(req.params.name, req.params.id, req.body.edit));
  });

  app.post("/people", async function (req, res) {
    res.send(await addToTourney(req.body.name, req.body.captain, req.body.members, req.body.id, req.body.tier));
  });

  app.post("/setteams/:id", async function (req, res) {
    let [people] = await queryDatabase("SELECT people FROM tourneys WHERE id=" + req.params.id);
    people = people.people;
    people.set = true;
    people.teams = req.body.teams;
    res.send(
      await queryDatabase(`UPDATE tourneys SET people=('${JSON.stringify(people)}') WHERE id=${req.params.id}`)
        .then(() => {
          console.log("Randomized teams of tourney " + req.params.id);
          return true;
        })
        .catch((err) => {
          console.log(`Could not set random teams of tourney ${req.params.id}`, err);
          return false;
        })
    );
  });

  app.post("/draft/set/:id", async function (req, res) {
    const people = req.body.people;
    res.send(
      await queryDatabase(`UPDATE tourneys SET people=('${JSON.stringify(people)}') WHERE id=${req.params.id}`)
        .then(() => {
          console.log("Set teams of draft tourney " + req.params.id);
          return true;
        })
        .catch((err) => {
          console.log(`Could not set teams of draft tourney ${req.params.id}`, err);
          return false;
        })
    );
  });

  app.post("/tourneys", async function (req, res) {
    const { tourneyName, tourneyPrize, radiosPrize, freeEntry, entryFee, selectedMode, randomized, tourneyLink } = req.body;
    const [startDate, startHours] = req.body.startDate.split("T");
    const [endDate, endHours] = req.body.endDate.split("T");

    //prettier-ignore
    queryDatabase(`INSERT INTO tourneys (name, start, finish, mode, prize, entry, randomized${tourneyLink ?', link':''}) VALUES ('${tourneyName}', '${startDate} ${startHours}', '${endDate} ${endHours}', '${selectedMode}', '${tourneyPrize == 0 ? '0' : `${tourneyPrize} ${radiosPrize}`}', ${freeEntry === 'on' ? '0' : entryFee}, ${randomized === 'on' ? '1' : '0'}${tourneyLink ? `, '${tourneyLink}'` : ''})`)
    .then(()=>{
      console.log('Created tourney ' + tourneyName);
      checkTourneysStatus(req.params.id);
      scheduleTourneys();
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
      queryDatabase(`UPDATE tourneys SET name='${tourneyName}', prize='${tourneyPrize == 0? '0' : `${tourneyPrize} ${radiosPrize}`}', entry=${freeEntry === 'on' ? '0' : entryFee}, mode='${selectedMode}', link='${tourneyLink}', randomized=${randomized === 'on' ? 1 : 0}, start='${startDate} ${startHours}', finish='${endDate} ${endHours}'${req.body._resetPeople == 1 ? `, people=('{}')`:''} WHERE id=${id};`)
      .then(()=> {
        checkTourneysStatus(req.params.id);
        scheduleTourneys();
        res.redirect('/managetourneys/?success=1');
      })
      .catch((err) => {
        console.log(err);
      })
    }
  });

  app.post("/tourneys/:id/people", async function (req, res) {
    const people = req.body.people;
    res.send(
      await queryDatabase(`UPDATE tourneys SET people=('${JSON.stringify(people)}') WHERE id=${req.params.id}`)
        .then(() => {
          console.log("Saved teams of tourney " + req.params.id);
          return true;
        })
        .catch((err) => {
          console.log(`Could not save teams of tourney ${req.params.id}`, err);
          return false;
        })
    );
  });

  app.post("/tourneys/:id/subs", async function (req, res) {
    res.send(await addToSubs(req.body.name, req.body.tier, req.params.id));
  });

  app.post("/banned", async function (req, res) {
    queryDatabase(`INSERT INTO banned(username) VALUES('${req.body.username}')`)
      .then((response) => {
        if (response.affectedRows > 0) res.send(JSON.stringify(true));
        else res.send(JSON.stringify(false));
      })
      .catch(async (err) => {
        switch (err.code) {
          case "ER_DUP_ENTRY":
            res.send(JSON.stringify(false));
            break;
          default:
            console.log(err);
        }
      });
  });

  app.delete("/people/:id", async function (req, res) {
    res.send(
      await queryDatabase("UPDATE tourneys SET people=('{}') WHERE id=" + req.params.id)
        .then(() => {
          return true;
        })
        .catch((err) => {
          console.log(err);
          return false;
        })
    );
  });

  app.delete("/people/:id/:name", async function (req, res) {
    res.send(await utilities.functions.removeFromTourney(req.params.name, req.params.id));
  });

  app.delete("/subs/:id", async function (req, res) {
    let [people] = await queryDatabase(`SELECT people FROM tourneys WHERE id=${req.params.id}`);
    people = people.people;
    people.subs = {};
    res.send(
      await queryDatabase(`UPDATE tourneys SET people=('${JSON.stringify(people)}') WHERE id=${req.params.id}`)
        .then(() => true)
        .catch(() => false)
    );
  });

  app.delete("/tourneys/:id/subs/:name", async function (req, res) {
    res.send(await removeFromSubs(req.params.name, req.params.id));
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
        console.log("Deleted tourney " + req.params.id);
        scheduleTourneys();
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

async function editPerson(username, tourneyId, properties = []) {
  let [people] = await queryDatabase("SELECT people FROM tourneys WHERE id=" + tourneyId);
  people = people.people;
  if (people.og === undefined) {
    people.og = {};
    people.set = false;
    people.teams = {};
  }
  const signedUp = people.og;
  const [isIn, key] = isInTourney(signedUp, username);
  if (isIn) {
    let person = signedUp[key];
    properties.forEach((p) => {
      person[p.property] = p.value;
    });
    await queryDatabase(`UPDATE tourneys SET people=('${JSON.stringify(people)}') WHERE id=${tourneyId}`);
    console.log("Updated tier of " + username);
    return true;
  } else {
    return false;
  }
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

async function addToSubs(name, tier = "0", tourneyId) {
  return new Promise(async (resolve, reject) => {
    let [data] = await queryDatabase("SELECT people, mode FROM tourneys WHERE id=" + tourneyId);
    let { people, mode } = data;
    if (!people.subs) people.subs = {};
    let subs = people.subs;
    let keys = Object.keys(subs);
    let key = keys.length > 0 ? parseInt(keys[keys.length - 1]) + 1 : 1;
    if (mode === "draft") subs[key] = new Draft(name, tier, key);
    else subs[key] = new Solo(name, key);
    queryDatabase(`UPDATE tourneys SET people=('${JSON.stringify(people)}') WHERE id=${tourneyId}`)
      .then(() => resolve(true))
      .catch((err) => reject(err));
  });
}

async function removeFromSubs(name, tourneyId) {
  return new Promise(async (resolve, reject) => {
    let [data] = await queryDatabase("SELECT people FROM tourneys WHERE id=" + tourneyId);
    let { people } = data;
    if (!people.subs) people.subs = {};
    let subs = people.subs;
    const [isIn, key] = isInTourney(subs, name);
    if (isIn) {
      delete subs[key];
    } else {
      reject(false);
    }
    queryDatabase(`UPDATE tourneys SET people=('${JSON.stringify(people)}') WHERE id=${tourneyId}`)
      .then(() => resolve(true))
      .catch((err) => reject(err));
  });
}

async function editSub(username, tourneyId, properties = []) {
  return new Promise(async (resolve, reject) => {
    let [data] = await queryDatabase("SELECT people FROM tourneys WHERE id=" + tourneyId);
    let subs = data.people.subs;
    const [isIn, key] = isInTourney(subs, username);
    if (isIn) {
      let person = subs[key];
      properties.forEach((p) => {
        person[p.property] = p.value;
      });
      await queryDatabase(`UPDATE tourneys SET people=('${JSON.stringify(data.people)}') WHERE id=${tourneyId}`)
        .then(() => resolve(true))
        .catch((err) => reject(err));
      console.log("Updated tier of sub " + username);
    } else {
      resolve(false);
    }
  });
}
