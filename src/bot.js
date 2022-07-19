import tmi from "tmi.js";
import ViewersQueue from "./viewersQueueHandler.js";
import mysql from "mysql2";
import Command from "./commandClass.js";
import actionCommands from "./commands.js";
import startServer from "./httpServer.js";

startServer();
/*
let commands = [];

const bottedChannel = "the_henzz"; //HERE YOU TYPE THE NAME OF YOUR CHANNEL

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

let utilities = {
  viewersQueue: new ViewersQueue(),
  params: [],
  greetedPeople: [],
  client: client,
  target: {},
  commands: commands,
  functions: {
    isModOrOwner: isModOrOwner,
    insertCommand: insertCommand,
    deleteCommand: deleteCommand,
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
    console.log(command);
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

function doTextCommand(trigger) {
  console.log(trigger);
}

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
});

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

*/
