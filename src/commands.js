import Command from "./commandClass.js";

const actionCommands = [
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
];

export default actionCommands;
