import Command from "./commandClass.js";

const actionCommands = [
  new Command("!join", "", "action", ({ username }, { client, target }) => {
    client.say(target, `Do you want to join the queue? Use !joinq @${username}`);
  }),
  new Command("!leave", "", "action", ({ username }, { client, target }) => {
    client.say(target, `Do you want to leave the queue? Use !leaveq @${username}`);
  }),
  new Command("!joinq", "", "action", ({ username }, { viewersQueue, client, target }) => {
    if (viewersQueue.isInQueue(username)) {
      client.say(target, username + " is already in queue");
    } else {
      viewersQueue.addViewer(username);
      client.say(target, username + " joined the queue on place #" + viewersQueue.length);
      console.log("Joined user " + username);
    }
  }),
  new Command("!leaveq", "", "action", ({ username }, { viewersQueue, client, target }) => {
    //prettier-ignore
    if (viewersQueue.deleteViewer(username)) 
      client.say(target, username + " left the queue");
    else
      client.say(target, username + " isn't in the queue");
    console.log("Deleted user " + username);
  }),
  new Command("!queue", "", "action", ({}, { viewersQueue, client, target }) => {
    const viewers = viewersQueue.viewers;
    let str = "";
    if (viewers.length < 1) {
      str = "No viewers in queue";
    } else if (viewers.length === 1) {
      str = `There's one lonely person in queue BibleThump : ` + viewers[0];
    } else {
      str = `There's ${viewers.length} people in queue: `;
      viewers.forEach((viewer, index) => {
        if (index !== viewers.length - 1) {
          str += `${viewer}, `;
        } else {
          str += `and ${viewer}`;
        }
      });
    }

    client.say(target, str);
    console.log("Showed queue length " + viewers.length);
  }),
  new Command("!next", "", "action", (ctx, { viewersQueue, client, target, functions }) => {
    const { username } = ctx;
    if (functions.isModOrOwner(ctx)) {
      if (viewersQueue.viewers.length === 0) {
        client.say(target, `Queue is empty ${username}`);
        console.log("Tried to do next, no one in queue");
      } else {
        const next = viewersQueue.nextViewer();
        client.say(target, `PogChamp @${next}, it's your turn to play! PogChamp`);
        console.log("Next person: " + next);
      }
    }
  }),
  new Command("!kick", "", "action", (ctx, { viewersQueue, client, target, params, functions }) => {
    const { username } = ctx;
    if (functions.isModOrOwner(ctx)) {
      if (params[0] === undefined) {
        client.say(target, "Please tell me who to kick @" + username);
        return;
      }
      if (viewersQueue.deleteViewer(params[0])) {
        client.say(target, params[0] + " was kicked from the queue");
        console.log("Deleted user " + params[0] + " by request of " + username);
      } else {
        client.say(target, `"${params[0]}" wasn't in the queue`);
        console.log("Could not delete user " + params[0] + "by request of " + username);
      }
    } else {
      console.log(username + " tried to kick, has no permissions");
    }
  }),
  new Command("!clear", "", "action", (ctx, { viewersQueue, client, target, functions }) => {
    const { username } = ctx;
    if (functions.isModOrOwner(ctx)) {
      viewersQueue.clearViewers();
      client.say(target, "Queue has been cleared @" + username);
      console.log("Cleared queue by request of " + username);
    }
  }),
  new Command("!newcomm", "", "action", (ctx, { client, target, params, functions }) => {
    const { username } = ctx;
    if (functions.isModOrOwner(ctx)) {
      const comm = params.splice(0, 1);
      functions.insertCommand(comm, params.join(" "));
      client.say(target, `Command ${comm} created successfully @${username}`);
      console.log(`Command ${comm} created successfully @${username}`);
    }
  }),
  new Command("!deletecomm", "", "action", (ctx, { client, target, params, functions }) => {
    const { username } = ctx;
    if (functions.isModOrOwner(ctx)) {
      const trigger = params[0];
      if (functions.deleteCommand(trigger)) {
        client.say(target, `Command ${trigger} deleted successfully @${username}`);
        console.log(`Command ${trigger} deleted successfully @${username}`);
      } else {
        client.say(target, `Command ${trigger} could not be deleted, it may have to be removed manueally or it doesnt exist @${username}`);
        console.log(`Failed to delete command '${trigger}' by request of @${username}`);
      }
    }
  }),
  new Command("!commands", "", "action", ({}, { commands, client, target }) => {
    let str = `Here's a list of all the commands: `;
    commands.forEach((comm, index) => {
      if (index !== commands.length - 1) {
        str += `${comm.trigger}, `;
      } else {
        str += `${comm.trigger}.`;
      }
    });
    client.say(target, str);
    console.log("Showed commands");
  }),
  new Command("!jointourney", "", "action", async ({ username }, { client, target, functions }) => {
    const res = await functions.addPersonToTourney(username).catch((err) => {
      if (err.code === "ER_DUP_ENTRY") {
        return [false, "normal"];
      }
    });
    if (res[0]) {
      client.say(target, `@${username} joined the tourney! elvyncHype`);
      console.log(`${username} joined the tourney`);
    } else {
      if (res[1] === "banned") {
        client.say(target, `@${username} is banned 💥🔨`);
        console.log(username, "is banned and tried to join tourney");
      } else {
        client.say(target, `@${username} is already in the tourney elvyncServingLs`);
        console.log(username, "was already in the tourney");
      }
    }
  }),
  new Command("!out", "", "action", async ({ username }, { client, target, functions }) => {
    const res = await functions.removePersonFromTourney(username);
    if (res) {
      client.say(target, `@${username} left the tourney! elvyncServingLs`);
      console.log(`${username} left the tourney`);
    } else {
      client.say(target, `@${username} wasnt in the tourney`);
      console.log(username, "wasnt in the tourney");
    }
  }),
  new Command("!in", "", "action", async ({ username }, { client, target, checkInsAllowed, functions }) => {
    if (checkInsAllowed) {
      const res = await functions.checkIn(username);
      if (res) {
        client.say(target, `@${username} checked In! elvyncHype`);
        console.log(`${username} checked in`);
      } else {
        client.say(target, `@${username} wasnt in the tourney`);
        console.log(username, "wasnt in the tourney and tried to check in");
      }
    } else {
      client.say(target, `@${username} check-ins are disabled`);
      console.log(username, "tried to check in (disabled)");
    }
  }),
  new Command("!togglecheckins", "", "action", (ctx, { client, target, functions }) => {
    if (functions.isOwner(ctx)) {
      const res = functions.toggleCheckIns();
      if (res) {
        client.say(target, `Check-Ins are allowed!`);
        console.log(`Toggled check-ins (allowed)`);
      } else {
        client.say(target, `Check-Ins are disabled!`);
        console.log(`Toggled check-ins (disabled)`);
      }
    }
  }),
  new Command("!henzzito", "", "action", ({}, { client, target }) => {
    client.say(target, `Henzzito is the first twitch bot developed by @h_levick, aarond is trash at RoCo!`);
  }),
  new Command("!dizzy", "", "action", ({}, { client, target }) => {
    client.say(target, `Probably too busy to play on Switch`);
  }),
];

export default actionCommands;
