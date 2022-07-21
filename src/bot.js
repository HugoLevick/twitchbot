import tmi from "tmi.js";
import ViewersQueue from "./viewersQueueHandler.js";
import mysql from "mysql2";
import Command from "./commandClass.js";
import actionCommands from "./commands.js";
import startServer from "./httpServer.js";

startServer();

let commands = [];

const bottedChannel = "ElvynCalderon"; //HERE YOU TYPE THE NAME OF YOUR CHANNEL

const options = {
  //   options: {
  //     debug: true,
  //   },
  identity: {
    username: "henzzito", //HERE YOU TYPE THE USERNAME OF THE BOT
    password: "oauth:c013cz4hbrzxjwdepbpvzphxl5nl9a", //HERE YOU TYPE THE AUTH PASS FROM THE WEBSITE www.twitchapps.com/tmi
  },
  channels: [bottedChannel],
};

const client = new tmi.client(options);

export let utilities = {
  viewersQueue: new ViewersQueue(),
  params: [],
  greetedPeople: [],
  client: client,
  target: {},
  commands: commands,
  checkInsAllowed: false,
  functions: {
    isOwner: isOwner,
    isModOrOwner: isModOrOwner,
    insertCommand: insertCommand,
    deleteCommand: deleteCommand,
    addPersonToTourney: addPersonToTourney,
    removePersonFromTourney: removePersonFromTourney,
    clearTourney: clearTourney,
    checkIn: checkIn,
    checkOut: checkOut,
    toggleCheckIns: toggleCheckIns,
  },
};

client.connect();

// client.on("connected", () => {
//   client.action(bottedChannel, "Henzzito is now live!");
// });

client.on("chat", (target, ctx, message) => {
  if (ctx.username === options.identity.username) return;
  utilities.target = target;

  //   console.log(target);
  //console.log(ctx);
  const commandRegex = /!\w/;

  if (!message.match(/!deletecomm/)) {
    commands.forEach((comm) => {
      const reg = new RegExp(comm.trigger, "i");
      if (message.match(reg)) client.say(target, comm.content);
    });
  }

  if (message.match(/^hi+\s?|^hi+?|^hello+\s?|^hello+|^howdy\s?/i) && !utilities.greetedPeople.includes(ctx.username)) {
    client.say(target, greet(ctx.username));
    utilities.greetedPeople.push(ctx.username);
    return;
  }

  // if (ctx.username == "aarond_") {
  //   client.say(target, "^ this kid is ass");
  //   return;
  // }

  if (message.match(commandRegex)) {
    //If its an action command (!)
    const [command, params] = stripCommand(message.trim());
    utilities.params = params;
    console.log(`${ctx.username}: ${command}`);
    commands.forEach((comm) => {
      if (comm.trigger === command) {
        if (comm.type === "action") comm.action(ctx, utilities);
        else console.log("in progress");
      }
    });
  }
});

function isModOrOwner(ctx) {
  return ctx.badges?.broadcaster == 1 || ctx.mod || ctx.username === "h_levick" ? true : false;
}

function isOwner(ctx) {
  return ctx.badges?.broadcaster == 1 || ctx.username === "h_levick" ? true : false;
}

function greet(username) {
  return "Hi! @" + username;
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

function insertCommand(command, content) {
  command = String(command).replace(/'/g, "");
  content = String(content).replace(/'/g, "");
  connection.query(`USE ${bottedChannel};`, (err) => {
    if (err) throw err;
  });
  connection.query(`INSERT INTO Commands (command, content) VALUES ('${command}', '${content}')`, (err) => {
    if (err) throw err;
  });
  commands.push({ trigger: command, content: content });
  return true;
}

function deleteCommand(trigger) {
  trigger = String(trigger).replace(/'/g, "");
  connection.query(`USE ${bottedChannel};`, (err) => {
    if (err) throw err;
  });
  let success = false;

  connection.query(`DELETE FROM Commands WHERE command = '${trigger}';`, (err) => {
    if (err) throw err;
  });

  commands.forEach((comm, index) => {
    if (comm.trigger === trigger) {
      commands.splice(index, 1);
      success = true;
    }
  });
  return success;
}

async function addPersonToTourney(username) {
  const response = await new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM check_in;`, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  }).then((people) => {
    let inList = false;
    people.every((person) => {
      if (person.username === username) {
        inList = true;
        return 0;
      }
    });
    if (!inList) {
      connection.query(`INSERT INTO check_in(username, checkin) VALUES("${username}", 0);`, (err) => {
        if (err) throw err;
      });
    }
    return inList;
  });
  return !response;
}

function toggleCheckIns() {
  utilities.checkInsAllowed = utilities.checkInsAllowed ? false : true;
  return utilities.checkInsAllowed;
}

async function checkIn(username) {
  const response = await updateDatabase("Check_In", "checkin", 1, "username", `"${username}"`);
  if (response.affectedRows > 0) return true;
  else return false;
}

async function checkOut(username) {
  const response = await updateDatabase("Check_In", "checkin", 0, "username", `"${username}"`);
  if (response.affectedRows > 0) return true;
  else return false;
}

async function removePersonFromTourney(username) {
  return await deleteFromDatabase("Check_In", "username", `"${username}"`);
}

async function clearTourney() {
  await queryDatabase("TRUNCATE check_in");
  return true;
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

async function insertIntoDatabase(table, fields, values) {
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

async function queryDatabase(sql) {
  return await new Promise((res, rej) => {
    connection.query(sql, (err, result) => {
      if (err) rej(err);
      else res(result);
    });
  });
}

function doTextCommand(trigger) {
  console.log(trigger);
}

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
});

export default connection;

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to database");
  connection.query(`USE ${bottedChannel};`, (err) => {
    if (err) {
      console.log(`Creating database ${bottedChannel}...`);
      //prettier-ignore
      connection.query(`CREATE DATABASE ${bottedChannel};`, (err) => {if (err) throw err;});
      //prettier-ignore
      connection.query(`USE ${bottedChannel};`, (err) => {if (err) throw err});
      //prettier-ignore
      connection.query("CREATE TABLE Commands (command varchar(255), content varchar(512));", (err) => {
        if (err) throw err;
      });
      //prettier-ignore
      connection.query("CREATE TABLE Tourneys (name varchar(255), start datetime, finish datetime);", (err) => {
         if (err) throw err;
      });
      //prettier-ignore
      connection.query("CREATE TABLE Check_In (username varchar(255), checkin boolean);", (err) => {
         if (err) throw err;
      });
      console.log("Database created!");
    }

    console.log(`Using database ${bottedChannel}`);

    connection.query("SELECT * FROM Commands", (err, result) => {
      if (err) throw err;
      result.forEach((comm) => {
        commands.push(new Command(comm.command, comm.content, comm.type));
      });
      actionCommands.forEach((comm) => {
        commands.push(comm);
      });
      console.log("Retrieved the following commands from database", commands);
    });
  });
});
