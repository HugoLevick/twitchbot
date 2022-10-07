import { isInTourney, obtainPeople, upcomingT } from "./bot.js";
import Command from "./commandClass.js";
import { addToTourney, queryDatabase } from "./bot.js";
import { addToSubs, removeFromSubs } from "./httpServer.js";

const commands = [
  new Command("!jointourney", "", "action", async ({ username }, { params, client, target }) => {
    const nextT = upcomingT[0];
    let teamName;
    let res = [false];
    if (nextT?.mode === "solos" || nextT?.mode === "draft") {
      res = await addToTourney(username, username, [username], nextT.id);
    } else if (nextT?.mode) {
      let teamSize = 4;
      switch (nextT.mode) {
        case "duos":
          teamSize = 2;
          break;
        case "trios":
          teamSize = 3;
          break;
        case "squads":
          teamSize = 4;
          break;
      }
      if (params.length === teamSize) {
        [teamName] = params.splice(0, 1);
        if (teamName.length > 10) {
          res = [false, "too-long"];
        } else {
          res = await addToTourney(teamName, username, params, nextT.id);
        }
      } else {
        res = [false, "bad"];
      }
    } else {
      res = [false, "no-tourney"];
    }
    if (res[0]) {
      if (nextT.mode === "solos" || nextT.mode === "draft") {
        client.say(target, `@${username} joined the tourney! elvyncHype`);
        console.log(`${username} joined the tourney`);
      } else {
        client.say(target, `${teamName} joined the tourney! elvyncHype`);
        console.log(`${teamName} joined the tourney, captain: ${username}`);
      }
    } else {
      switch (res[1]) {
        case "banned":
          client.say(target, `@${username} is banned 💥🔨`);
          console.log(username, "is banned and tried to join tourney");
          break;
        case "bad":
          client.say(target, `@${username} command data is incorrect, type !signhelp for help`);
          console.log("Bad request to create team from " + username);
          break;
        case "no-tourney":
          client.say(target, `@${username} there aren't any tourneys open for registration`);
          console.log(username, "Tried to join tourney, there's any");
          break;
        case "too-long":
          client.say(target, `@${username} team name can't be longer than 10 caharacters`);
          console.log(username + " tried to sign a team up, name was too long (>10 ch)");
          break;
        case "normal":
          client.say(target, `@${username} is already in the tourney elvyncServingLs`);
          console.log(username, "was already in the tourney");
          break;
        default:
          client.say(target, `@${username} error trying to join the tourney`);
          console.log("Someone tried to join the tourney and something weird happened, whoops");
      }
    }
  }),
  new Command("!out", "", "action", async ({ username }, { client, target, functions }) => {
    const nextT = upcomingT[0];
    if (nextT) {
      //If theres a tourney
      let res = false;
      res = await functions.removeFromTourney(username, nextT.id);
      if (res[0]) {
        client.say(target, `${res[1] === username ? "@" : ""}${res[1]} left the tourney! elvyncServingLs`);
        console.log(`${res[1]} left the tourney`);
      } else {
        switch (res[1]) {
          case "not-found":
            client.say(target, `@${username} wasnt in the tourney`);
            console.log(username, "wasnt in the tourney");
            break;
          case "unexpected":
            client.say(target, `@${username} something unexpected happened... Try again`);
            console.log("Unexpected error " + username);
            break;
          default:
            client.say(target, `@${username} error trying to leave the tourney`);
            console.log("Someone tried to join the tourney and something weird happened, whoops");
        }
      }
    } else {
      client.say(target, `@${username} there is not a tourney in progress`);
      console.log(`${username} tried to join a tourney when there wasnt one`);
    }
  }),
  new Command("!in", "", "action", async (ctx, { client, target, checkInsAllowed, functions, params }) => {
    if (checkInsAllowed && upcomingT[0]) {
      let username = "";
      if (params[0] && functions.isModOrOwner(ctx)) username = params[0].replace(/@/g, "");
      else username = ctx.username;
      console.log(username, params[0]);
      const nextT = upcomingT[0];
      const res = await functions.check(nextT.id, username, "in");
      if (res) {
        client.say(target, `@${username} checked In! elvyncHype`);
        console.log(`${username} checked in`);
      } else {
        client.say(target, `@${username} wasnt in the tourney`);
        console.log(username, "wasnt in the tourney and tried to check in");
      }
    } else if (upcomingT[0]) {
      client.say(target, `@${username} check-ins are disabled`);
      console.log(username, "tried to check in (disabled)");
    } else {
      client.say(target, `@${username} there aren't any tourneys open for registration`);
      console.log(username, "Tried to check in tourney, there's any");
    }
  }),
  new Command("!checkin", "", "action", async (ctx, { client, target, params, functions }) => {
    if (functions.isModOrOwner(ctx)) {
      const nextT = upcomingT[0];
      const username = params[0].replace("@", "");
      const res = await functions.check(nextT.id, username, "in");
      if (res) {
        client.say(target, `@${username} checked In! elvyncHype`);
        console.log(`${username} checked in by request of ${ctx.username}`);
      } else {
        client.say(target, `@${ctx.username} user ${username} wasnt in the tourney`);
        console.log(username, "wasnt in the tourney and tried to check in by request of " + ctx.username);
      }
    }
  }),
  new Command("!checkout", "", "action", async (ctx, { client, target, params, functions }) => {
    if (functions.isModOrOwner(ctx)) {
      const nextT = upcomingT[0];
      const username = params[0].replace("@", "");
      const res = await functions.check(nextT.id, username, "out");
      if (res) {
        client.say(target, `@${username} checked out! elvyncServingLs`);
        console.log(`${username} checked in by request of ${ctx.username}`);
      } else {
        client.say(target, `@${ctx.username} user ${username} wasnt in the tourney`);
        console.log(username, "wasnt in the tourney and tried to check out by request of " + ctx.username);
      }
    }
  }),
  new Command("!togglecheckins", "", "action", (ctx, { client, target, functions }) => {
    if (functions.isModOrOwner(ctx)) {
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
  new Command("!checkteam", "", "action", async (ctx, { client, target, params }) => {
    let username = "";
    if (params[0]) username = params[0].replace(/@/g, "");
    else username = ctx.username;
    const nextT = upcomingT[0];
    const people = await obtainPeople(nextT.id);
    const teams = nextT.randomized || nextT.mode === "draft" ? people.teams : people.og;
    const [isIn, key] = isInTourney(teams, username); //returns [true/false, key]
    if (isIn) {
      const inTeam = teams[key];
      if (inTeam.members && inTeam.in) {
        inTeam.members = inTeam.members.filter((m) => m !== undefined && m !== null);
        client.say(target, `@${ctx.username} Team ${inTeam.name} - ${inTeam.members?.join(" / ")}`);
      } else if (inTeam.in) {
        client.say(target, `@${ctx.username} Team ${key}`);
      } else {
        client.say(target, `@${ctx.username} you're not checked-in`);
      }
      console.log(`${username} is in team ${key}`);
    } else {
      const [isIn, key] = isInTourney(people.og, username); //returns [true/false, key]
      if (isIn) {
        client.say(target, `${username} is not in a team yet`);
        console.log(`${username} was not in a team (tried to see team)`);
      } else {
        client.say(target, `${username} is not in the tourney`);
        console.log(`${username} was not in the torney (tried to see team)`);
      }
    }
  }),
  new Command("!signhelp", "", "action", ({ username }, { client, target }) => {
    const nextT = upcomingT[0];
    let message = `@${username} This is a `;
    switch (nextT.mode) {
      case "solos":
        message += "solos tourney, to join type !jointourney. Remember to do !in when check-ins start!";
        break;
      case "duos":
        message +=
          "duos tourney, to join type !jointourney TEAM_NAME MEMBER1. Whoever creates the team is the captain and they have to check in for the team. Captain is automatically added as a member and doesn't have to be typed";
        break;
      case "trios":
        message +=
          "trios tourney, to join type !jointourney TEAM_NAME MEMBER1 MEMBER2. Whoever creates the team is the captain and they have to check in for the team. Captain is automatically added as a member and doesn't have to be typed";
        break;
      case "squads":
        message +=
          "squads tourney, to join type !jointourney TEAM_NAME MEMBER1 MEMBER2 MEMBER3. Whoever creates the team is the captain and they have to check in for the team. Captain is automatically added as a member and doesn't have to be typed";
        break;
      case "draft":
        message += "draft tourney, to join type !jointourney. Remember to check in when Elvyn starts!";
        break;
    }
    client.say(target, message);
  }),
  new Command("!changetier", "", "action", async (ctx, { client, target, params, functions }) => {
    const nextT = upcomingT[0];
    if (functions.isModOrOwner(ctx) && nextT.mode === "draft") {
      const username = params[0].replace("@", "");
      const tier = params[1];
      const people = await obtainPeople(nextT.id);
      const [isIn, key] = isInTourney(people.og, username);
      if (isIn) {
        people.og[key].tier = tier;
        await queryDatabase(`UPDATE tourneys SET people=('${JSON.stringify(people)}') WHERE id=${nextT.id}`)
          .then(() => {
            client.say(target, `@${ctx.username} updated tier of ${username}`);
            console.log(`Updated tier of ${username} by request of ${ctx.username}`);
            return true;
          })
          .catch((err) => {
            client.say(target, `@${ctx.username} could not update tier of ${username}`);
            console.log("Could not update tier of " + username, err);
            return false;
          });
      } else {
        client.say(target, `@${ctx.username} user ${username} wasn't in the tourney`);
        console.log(`${ctx.username} tried updating tier of ${username} but wasn't in the tourney`);
      }
    }
  }),
  new Command("!sub", "", "action", async ({ username }, { client, target }) => {
    const nextT = upcomingT[0];
    return addToSubs(username, "0", nextT.id)
      .then((res) => {
        if (res[0]) {
          client.say(target, `@${username} was added as a sub KomodoHype`);
          console.log(`${username} joined the sub list`);
        }
      })
      .catch((err) => {
        switch (err[1]) {
          case "already-in":
            client.say(target, `@${username} is already a sub elvyncServingLs`);
            console.log(username, "is already in and tried to join sub list");
            break;
          case "banned":
            client.say(target, `@${username} is banned 💥🔨`);
            console.log(username, "is banned and tried to join sub list");
            break;
          case "unexpected":
            client.say(target, `@${username} an unexpected error ocurred`);
            console.log(`${username} tried joining the sub list, an error ocurred`);
            break;
        }
      });
  }),
  new Command("!subout", "", "action", async ({ username }, { client, target }) => {
    const nextT = upcomingT[0];
    return removeFromSubs(username, nextT.id)
      .then((res) => {
        if (res[0]) {
          client.say(target, `@${username} left the sub list! BibleThump`);
          console.log(`${username} left the sub list`);
        }
      })
      .catch((err) => {
        switch (err[1]) {
          case "not-in":
            client.say(target, `@${username} is not in the sub list elvyncServingLs`);
            console.log(username, "is not in the sub list");
            break;
          case "unexpected":
            client.say(target, `@${username} an unexpected error ocurred`);
            console.log(`${username} tried joining the sub list, an error ocurred`);
            break;
        }
      });
  }),
  new Command("!tourneykick", "", "action", async (ctx, { client, target, params, functions }) => {
    const nextT = upcomingT[0];
    if (functions.isModOrOwner(ctx)) {
      const username = params[0].replace("@", "");
      const people = await obtainPeople(nextT.id);
      const [isIn, key] = isInTourney(people.og, username);
      if (isIn) {
        delete people.og[key];
        await queryDatabase(`UPDATE tourneys SET people=('${JSON.stringify(people)}') WHERE id=${nextT.id}`)
          .then(() => {
            client.say(target, `@${ctx.username} kicked ${username}`);
            console.log(`Kicked ${username} by request of ${ctx.username}`);
            return true;
          })
          .catch((err) => {
            client.say(target, `@${ctx.username} couldn't kick ${username}`);
            console.log("couldn't kick " + username, err);
            return false;
          });
      } else {
        client.say(target, `@${ctx.username} player ${username} wasn't in the tourney`);
        console.log(`${ctx.username} tried kicking ${username} but wasn't in the tourney`);
      }
    }
  }),

  new Command("!tourneyalert", "", "action", async (ctx, { client, target, params, functions }) => {
    if (functions.isModOrOwner(ctx) && params.length > 0) {
      addAlert(ctx.username, params.join(" "));
      client.say(target, `@${ctx.username} alert queued!`);
      console.log(`${ctx.username} queued an alert`);
    }
  }),

  new Command("!henzzito", "", "action", ({}, { client, target }) => {
    client.say(target, `Henzzito is the first twitch bot developed by @h_levick`);
  }),
];

export default commands;

export function addAlert(username, message) {
  queryDatabase(`INSERT INTO alerts (username, content) VALUES ('${username}', '${message}')`);
}
