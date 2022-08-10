import tmi from "tmi.js";
import mysql from "mysql2";
import startServer from "./httpServer.js";
import mysqlCredentials from "../mySQLCredentials.js";
import { scheduleJob } from "node-schedule";
import { DateTime } from "luxon";
import commands from "./commands.js";
import Solo, { Team, Draft } from "./teamClass.js";

export let upcomingT = [];
export let schedules = {};

export const bottedChannel = "ElvynCalderon"; //HERE YOU TYPE THE NAME OF YOUR CHANNEL
if (bottedChannel == "h_levick") mysqlCredentials.password = "root";

const options = {
  // options: {
  //   debug: true,
  // },
  identity: {
    username: "henzzito", //HERE YOU TYPE THE USERNAME OF THE BOT
    password: "oauth:c013cz4hbrzxjwdepbpvzphxl5nl9a", //HERE YOU TYPE THE AUTH PASS FROM THE WEBSITE www.twitchapps.com/tmi
  },
  channels: [bottedChannel],
};

const client = new tmi.client(options);

const bots = [options.identity.username, "nightbot", "streamelements"];

export let utilities = {
  params: [],
  greetedPeople: [],
  client: client,
  target: {},
  commands: commands,
  checkInsAllowed: false,
  functions: {
    isOwner: isOwner,
    isModOrOwner: isModOrOwner,
    addToTourney: addToTourney,
    removeFromTourney: removeFromTourney,
    check: check,
    toggleCheckIns: toggleCheckIns,
  },
};

client.connect();

client.on("connected", () => {
  console.log("Connected to Twitch");
});

client.on("chat", (target, ctx, message) => {
  if (bots.includes(ctx.username)) return;
  utilities.target = target;
  const commandRegex = /^!\w/;

  // console.log(target);
  // console.log(ctx);
  // if (ctx.username == "aarond_") {
  //   client.say(target, "^ this kid is ass");
  //   return;
  // }

  if (message.match(commandRegex)) {
    //If its an action command (!)
    const [command, params] = stripCommand(message.trim());
    utilities.params = params;
    console.log(`${ctx.username}: ${command}`);
    commands.every((comm) => {
      if (command?.match(new RegExp(comm.trigger, "i"))) {
        if (comm.type === "action") {
          comm.action(ctx, utilities);
          return false;
        } else console.log("in progress");
      }
      return true;
    });
  }
});

function isModOrOwner(ctx) {
  return ctx.badges?.broadcaster == 1 || ctx.mod || ctx.username === "h_levick" ? true : false;
}

function isOwner(ctx) {
  return ctx.badges?.broadcaster == 1 || ctx.username === "h_levick" ? true : false;
}

function stripCommand(message) {
  const split = message.split(/\s+/);
  let command, startsAt;
  split.every((word, index) => {
    if (word.match(/!/)) {
      command = word;
      startsAt = index;
      return false;
    }
  });
  return [command, split.splice(startsAt + 1, split.length)];
}

export async function addToTourney(name, captain, members, tourneyId, tier = 0) {
  return await new Promise(async (resolve) => {
    const banned = await retrieveBanned().then((res) => {
      return res.map((p) => p.username);
    });
    if (!banned.includes(captain)) {
      const response = await new Promise(async (res, rej) => {
        let [data] = await queryDatabase("SELECT people, mode FROM tourneys WHERE id=" + tourneyId).catch((err) => {
          console.log(err);
        });
        let { people, mode } = data;
        if (people.og === undefined) {
          people.set = false;
          people.og = {};
        }
        let signedUp = people.og;
        if (isInTourney(signedUp, captain ?? name)[0]) {
          console.log("already in");
          rej(false);
          return;
        }
        if (mode === "solos") {
          let keys = Object.keys(signedUp);
          let key = keys.length > 0 ? parseInt(keys[keys.length - 1]) + 1 : 1;
          signedUp[key] = new Solo(name);
        } else if (mode === "draft") {
          let keys = Object.keys(signedUp);
          let key = keys.length > 0 ? parseInt(keys[keys.length - 1]) + 1 : 1;
          signedUp[key] = new Draft(name, tier);
        } else if (mode) {
          let keys = Object.keys(signedUp);
          let key = keys.length > 0 ? parseInt(keys[keys.length - 1]) + 1 : 1;
          signedUp[key] = new Team(name, captain, [captain, ...members], key);
        }
        queryDatabase(`UPDATE tourneys SET people=('${JSON.stringify(people)}') WHERE id=${tourneyId}`)
          .then(() => {
            res(true);
            return;
          })
          .catch((err) => {
            console.log(err);
            rej(false);
          });
      }).catch((err) => err);
      resolve([response, "normal"]);
    } else {
      resolve([false, "banned"]);
    }
  });
}

export function isInTourney(people, username) {
  let userRegex = new RegExp(`^${username}$`, "i");
  for (let team in people) {
    let key = team;
    team = people[team];
    let name;
    if (typeof team.name === "number") {
      name = team.name.toString();
    } else if (typeof team.name === "string") {
      name = team.name;
    }
    if (team.captain?.match(userRegex) || name.match(userRegex)) {
      return [true, key];
    }
    if (team.members) {
      team.members.forEach((m) => {
        if (m.match(userRegex)) return [true, key];
      });
    }
  }
  return [false, undefined];
}

export async function obtainPeople(tourneyId) {
  return new Promise(async (resolve) => {
    let [data] = await queryDatabase("SELECT people FROM tourneys WHERE id=" + tourneyId).catch((err) => {
      console.log(err);
    });
    let { people } = data;
    if (people.og === undefined) {
      people.set = false;
      people.og = {};
    }
    if (people) resolve(people);
    else resolve({});
  });
}

function toggleCheckIns() {
  utilities.checkInsAllowed = utilities.checkInsAllowed ? false : true;
  return utilities.checkInsAllowed;
}

async function check(tourneyId, username, inOrOut) {
  return await new Promise(async (resolve, reject) => {
    let [data] = await queryDatabase("SELECT people FROM tourneys WHERE id=" + tourneyId).catch((err) => {
      console.log(err);
    });
    let signedUp = data.people.og;

    const [isIn, key] = isInTourney(signedUp, username);
    if (isIn) {
      signedUp[key].in = inOrOut === "in" ? true : false;
      await queryDatabase(`UPDATE tourneys SET people=('${JSON.stringify(data.people)}') WHERE id=${tourneyId}`)
        .then(() => {
          resolve(true);
        })
        .catch((err) => {
          console.log(err);
          reject(false);
        });
    } else reject(false);
  }).catch((err) => err);
}

async function removeFromTourney(username, tourneyId) {
  return await new Promise(async (resolve, reject) => {
    let [data] = await queryDatabase("SELECT people FROM tourneys WHERE id=" + tourneyId).catch((err) => {
      console.log(err);
    });
    let signedUp = data.people.og;

    for (let team in signedUp) {
      const key = team;
      team = signedUp[key];
      if (team.captain === username || team.name === username) {
        const teamName = team?.name;
        signedUp[key] = undefined;
        await queryDatabase(`UPDATE tourneys SET people=('${JSON.stringify(data.people)}') WHERE id=${tourneyId}`)
          .then(() => {
            resolve([true, teamName]);
          })
          .catch((err) => {
            console.log(err);
            reject([false, "unexpected"]);
          });
        return;
      }
    }
    reject([false, "not-found"]);
  }).catch((err) => err);
}

async function retrieveBanned() {
  const res = await queryDatabase("SELECT * FROM banned;").catch(async (err) => {
    if (err.code === "ER_NO_SUCH_TABLE") {
      const res2 = await queryDatabase("CREATE TABLE banned (username varchar(255));");
      return await retrieveBanned();
    } else {
      console.log(err);
    }
  });
  return res;
}

async function deleteFromDatabase(table, field, value) {
  return await new Promise((res) => {
    connection.query(`DELETE FROM ${table} WHERE ${field}=${value};`, (err, result) => {
      if (err) throw err;
      if (result.affectedRows !== 0) res(true);
      else res(false);
    });
  });
}

export async function insertIntoDatabase(table, fields, values) {
  return await new Promise((res, rej) => {
    connection.query(`INSERT INTO ${table}(${fields}) VALUES(${values});`, (err, result) => {
      if (err) rej(err);
      else res(result);
    });
  });
}

async function updateDatabase(table, set, setValue, where, whereValue) {
  return await new Promise((res, rej) => {
    connection.query(`UPDATE ${table} SET ${set}=${setValue} WHERE ${where}=${whereValue};`, (err, result) => {
      if (err) rej(err);
      else res(result);
    });
  });
}

export async function queryDatabase(sql) {
  return await new Promise((res, rej) => {
    connection.query(sql, (err, result) => {
      if (err) rej(err);
      else res(result);
    });
  });
}

async function checkDbValidity() {
  return new Promise(async (resolve) => {
    let [ver] = await queryDatabase("SELECT * FROM version").catch(() => "0");
    ver = ver.version;
    if (ver != "1.2") {
      console.log("Version mismatch, updating database...");
      await queryDatabase("drop database " + bottedChannel);
      await createDatabase();

      console.log("Done");
    }
    resolve();
  });
}

export function tourneyLocalT(tourneys, type) {
  try {
    tourneys.forEach((t) => {
      const startLocal = DateTime.fromISO(t.start.toISOString(), { zone: "UTC" }).toLocal();
      const endLocal = DateTime.fromISO(t.finish.toISOString(), { zone: "UTC" }).toLocal();
      if (type === "iso") {
        t.start = startLocal.toISO();
        t.finish = endLocal.toISO();
      } else if (type === "jsdate") {
        t.start = startLocal.toJSDate();
        t.finish = endLocal.toJSDate();
      }
    });
    return tourneys;
  } catch {
    const startLocal = DateTime.fromISO(tourneys.start.toISOString(), { zone: "UTC" }).toLocal();
    const endLocal = DateTime.fromISO(tourneys.finish.toISOString(), { zone: "UTC" }).toLocal();
    if (type === "iso") {
      tourneys.start = startLocal.toISO();
      tourneys.finish = endLocal.toISO();
    } else if (type === "jsdate") {
      tourneys.start = startLocal.toJSDate();
      tourneys.finish = endLocal.toJSDate();
    }
    return tourneys;
  }
}

export async function checkTourneysStatus(id) {
  return new Promise(async (resolve, reject) => {
    console.log("Checking status of " + (id ? `tourney ${id}` : "all tourneys"));
    const now = new Date();
    let status;
    if (id) {
      const [tourney] = tourneyLocalT(await queryDatabase(`SELECT * FROM tourneys WHERE id=${id}`), "jsdate");
      status = tourney.status;

      switch (tourney.status) {
        case "pending":
          if (tourney.start <= now && tourney.finish > now) {
            status = "inprogress";
          } else if (tourney.finish < now) {
            status = "ended";
          }
          break;
        case "inprogress":
          if (tourney.finish < now) {
            status = "ended";
          } else if (tourney.start > now) {
            status = "pending";
          }
          break;
        case "ended":
          if (tourney.start > now) {
            status = "pending";
          } else if (tourney.start <= now && tourney.finish > now) {
            status = "inprogress";
          }
          break;
      }
      if (status != tourney.status) {
        queryDatabase(`UPDATE tourneys SET status='${status}' WHERE id=` + tourney.id)
          .then(() => {
            console.log("Tourney " + tourney.id + " has been set to " + status.toUpperCase());
          })
          .catch((err) => {
            reject(err);
            return;
          });
      }
    } else {
      const tourneys = tourneyLocalT(await queryDatabase("SELECT * FROM tourneys"), "jsdate");
      for (let tourney in tourneys) {
        tourney = tourneys[tourney];
        status = tourney.status;

        switch (tourney.status) {
          case "pending":
            if (tourney.start <= now && tourney.finish > now) {
              status = "inprogress";
            } else if (tourney.finish < now) {
              status = "ended";
            }
            break;
          case "inprogress":
            if (tourney.finish < now) {
              status = "ended";
            } else if (tourney.start > now) {
              status = "pending";
            }
            break;
          case "ended":
            if (tourney.start > now) {
              status = "pending";
            } else if (tourney.start <= now && tourney.finish > now) {
              status = "inprogress";
            }
            break;
        }

        if (status != tourney.status) {
          queryDatabase(`UPDATE tourneys SET status='${status}' WHERE id=` + tourney.id)
            .then(() => {
              console.log("Tourney " + tourney.id + " has been set to " + status.toUpperCase());
            })
            .catch((err) => {
              reject(err);
            });
        }
      }
    }
    resolve("Checked tourney status!");
  });
}

export async function scheduleTourneys() {
  return new Promise(async (resolve) => {
    console.log("Scheduling all tourneys");
    upcomingT = tourneyLocalT(await queryDatabase("SELECT * FROM TOURNEYS WHERE finish > NOW() ORDER BY start ASC;"), "jsdate");
    console.log(`${upcomingT.length} tourney${upcomingT.length == 1 ? "s" : ""} in the horizon!`);
    if (upcomingT.length > 0) {
      for (let tourney in upcomingT) {
        tourney = upcomingT[tourney];
        const startSchedule = scheduleJob(tourney.start, async () => {
          await queryDatabase("UPDATE tourneys SET status='inprogress' WHERE id =" + tourney.id);
          console.log(`Tourney ${tourney.name.length > 15 ? tourney.name.substring(0, 15) + "..." : tourney.name} has started!`);
        });
        const endSchedule = scheduleJob(tourney.finish, async () => {
          await queryDatabase("UPDATE tourneys SET status='ended' WHERE id =" + tourney.id);
          console.log(`Tourney ${tourney.name.length > 15 ? tourney.name.substring(0, 15) + "..." : tourney.name} has ended!`);
        });
        schedules[tourney.id] = { startSchedule: startSchedule, endSchedule: endSchedule };
      }
    }
    resolve("Scheduled!");
  });
}

const connection = mysql.createConnection({
  host: mysqlCredentials.localhost,
  user: mysqlCredentials.user,
  password: mysqlCredentials.password,
});

export default connection;

async function createDatabase() {
  return new Promise(async (resolve, reject) => {
    await queryDatabase(`USE ${bottedChannel};`).catch(async () => {
      console.log(`Creating database ${bottedChannel}...`);
      //prettier-ignore
      await queryDatabase(`CREATE DATABASE ${bottedChannel};`).catch((err)=>reject(err));
      //prettier-ignore
      await queryDatabase(`USE ${bottedChannel};`).catch((err)=>reject(err));
      //prettier-ignore
      await queryDatabase("CREATE TABLE tourneys (id INT UNSIGNED NOT NULL AUTO_INCREMENT, name VARCHAR(255) NOT NULL DEFAULT '-', start datetime NOT NULL DEFAULT NOW(), finish datetime NOT NULL DEFAULT NOW(), mode VARCHAR(15) NOT NULL DEFAULT 'solos',prize VARCHAR(50) NOT NULL DEFAULT '0', entry INT UNSIGNED NOT NULL DEFAULT 0, randomized BOOLEAN NOT NULL DEFAULT 0, link VARCHAR(511), people JSON NOT NULL DEFAULT ('{}'), status VARCHAR(10) NOT NULL DEFAULT 'pending', PRIMARY KEY(id));").catch((err)=>reject(err));

      //prettier-ignore

      await queryDatabase("CREATE TABLE banned (username VARCHAR(255) UNIQUE NOT NULL DEFAULT '-');").catch((err) => reject(err));

      await queryDatabase("CREATE TABLE version (version VARCHAR(20) NOT NULL DEFAULT '1.0');").catch((err) => reject(err));

      await queryDatabase('INSERT INTO version VALUES("1.2")');

      console.log("Database created!");
      console.log(`Using database ${bottedChannel}`);
    });
    resolve();
  });
}

connection.connect(async (err) => {
  if (err) throw err;
  console.log("Connected to database");
  await createDatabase()
    .then(async () => {
      await checkDbValidity();
      await checkTourneysStatus().catch((err) => console.log(err));
      await scheduleTourneys().catch((err) => console.log(err));
      startServer();
    })
    .catch((err) => {
      console.log(err);
    });
});
