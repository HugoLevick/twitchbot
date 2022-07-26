let table = document.getElementById("checkintable");
let thead = document.getElementById("thead");
let selectedT = document.getElementById("selectedTourney");
let title = document.getElementById("title");
const DateTime = luxon.DateTime;

function loadTable(filter) {
  return new Promise((resolve) => {
    const filterRegExp = new RegExp(filter || ".*", "i");
    fetch("/current/tourneys")
      .then((res) => res.json())
      .then((nextTourneys) => {
        if (nextTourneys.length > 0) {
          selectedT.innerHTML = "<option value='' selected disabled>--SELECT A TOURNEY--</option>";
          for (let t in nextTourneys) {
            t = nextTourneys[t];
            let date = DateTime.fromISO(t.start);
            //prettier-ignore
            selectedT.innerHTML += `<option ${t.id == tourney?.id ? "selected" : ""} value="${t.id}">${t.name.length > 45 ? t.name.substring(0, 45) + "..." : t.name}   -  ${date.month}/${date.day} ${date.hour}:${date.minute}</option>`;
            if (t.id == params.tourneyId) tourney = t;
          }
        }
        if (tourney) {
          subs = tourney.people.subs ?? {};
          let html = "";
          let tfilter;
          for (let sub in subs) {
            sub = subs[sub];
            if (selectedTier == 0 || selectedTier == undefined) {
              tfilter = true;
            } else {
              tfilter = sub.tier == selectedTier;
            }
            //Load Table
            if (sub.name.match(filterRegExp) && tfilter) {
              html += teamToHTML(sub);
            }
          }
          //prettier-ignore
          if(tourney.mode === 'draft') thead.innerHTML = `<tr><th scope="col">Username</th><th scope="col">Tier <input type="number" class="fs-5" id="personTier" name="personTier" min="0" value="${selectedTier ?? "0"}" style="max-width:15%; border:0" onchange="filterTier(this.value)"/></th><th scope="col" class="d-flex align-items-center justify-content-center">Actions</th></tr>`;
          table.innerHTML = html;
          feather.replace({ "aria-hidden": "true" });
          resolve();
        }
      });
  });
}

function addToSubs() {
  if (tourney) {
    //If there is a tourney selected
    let title,
      html = "";
    if (tourney?.mode === "draft") {
      title = "Add draft player";
      html = `<label for="username" class="form-label">Username:</label>
              <div class="input-group m-0">
                <input type="text" class="form-control" id="username" name="username" />
                <div class="input-group-prepend">
                  <span class="input-group-text" style="border-radius: 0">Tier:</span>
                </div>
                <input type="number" class="form-control" id="userTier" name="userTier" min="1" style="max-width:15%;"/>
              </div>`;
    } else {
      title = "What's the username?";
      html = "<input id='username' type='text'/>";
    }
    Swal.fire({
      title: title,
      html: html,
      showCloseButton: true,
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        const username = document.getElementById("username").value;
        let tier;
        if (tourney.mode === "draft") {
          tier = document.getElementById("userTier").value;
        }
        fetch(`/tourneys/${tourney.id}/subs`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: username || "----",
            tier: tier || "0",
          }),
        })
          .then((res) => res.json())
          .then((result) => {
            if (result) {
              Swal.fire("Done", "", "success");
              reload();
            }
          });
      }
    });
  }
}

function filterTier(value) {
  if (value.match(/^0+/)) {
    value = value.replace(/^0+/, "");
  }
  selectedTier = value;
  reload();
}

function kick(username) {
  Swal.fire({
    title: `Do you really want to kick ${username}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/tourneys/${tourney.id}/subs/${username}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((res) => {
          if (res) {
            Swal.fire(username + " has been kicked!", "", "success");
            reload();
          } else {
            Swal.fire("Couldn't kick " + username, "Could have left before being kicked", "error");
            reload();
          }
        });
    }
  });
}

async function subPerson() {
  fetch("/subs/subPick")
    .then((res) => res.text())
    .then((draft) => {
      html = draft;
      Swal.fire({
        title: "Pick a Sub For a Team",
        width: 1100,
        html: html,
        allowOutsideClick: false,
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: handleSubsPopUp,
        didDestroy: () => {
          currentTeam = {};
          toDelete = [];
          currentTeamKey = undefined;
          reload();
        },
      });
    });
}

function handleSubsPopUp() {
  const teamSelect = document.getElementById("teamSelect");
  const teams = tourney.people.teams ?? tourney.people.og;
  let teamOptions = '<option value="" selected disabled>--SELECT TEAM--</option>';
  for (let team in teams) {
    team = teams[team];
    let name = team.name;
    if (team.name.length > 10) name = name.slice(0, 10) + "...";
    teamOptions += `<option value='${team.key}'>Team ${name}</option>`;
  }
  fillSubs();
  teamSelect.innerHTML = teamOptions;
  feather.replace({ "aria-hidden": "true" });
}

function fillSubs(filter) {
  const subsList = document.getElementById("subsList");
  const filterRegex = new RegExp(filter || ".*", "i");
  let html = "";
  if (tourney.mode === "draft") {
    let tiers = {};
    let keys = Object.keys(tourney.people.subs);
    for (let key in keys) {
      key = keys[key];
      let sub = subs[key];
      if (tiers[sub.tier] === undefined) tiers[sub.tier] = [];
      tiers[sub.tier] = [...tiers[sub.tier], sub];
    }
    keys = Object.keys(tiers);
    for (let key in keys) {
      key = keys[key];
      const people = tiers[key];
      if (people.length > 0) {
        html += `<div class="card-header d-flex justify-content-between align-items-center">
                <button class="text-start p-0 border-0 align-text-bottom" style="width: 100%; background-color: unset" onclick="randomSub('${key}')">
                Tier ${key}  random <span class="align-text-bottom" data-feather="arrow-right">></span>
              </button>
            </div>`;
        people.forEach((p) => {
          if (p.name?.match(filterRegex) && !currentTeam?.members?.includes(p.name)) {
            html += subToHTML(p);
          }
        });
      }
    }
  } else {
    html += `<div class="card-header d-flex justify-content-between align-items-center">
              <button class="text-start p-0 border-0 align-text-bottom" style="width: 100%; background-color: unset" onclick="randomSub()">
                Select Random <span class="align-text-bottom" data-feather="arrow-right">></span>
              </button>
            </div>`;
    for (let sub in subs) {
      sub = subs[sub];
      if (sub.name?.match(filterRegex) && !currentTeam?.members?.includes(sub.name)) {
        html += subToHTML(sub);
      }
    }
  }
  subsList.innerHTML = html;
  feather.replace({ "aria-hidden": "true" });
}

function randomSub(tier) {
  let toSub = {};
  if (tier) {
    for (let sub in subs) {
      sub = subs[sub];
      if (!sub.in && sub.tier == tier) toSub[sub.key] = sub;
    }
  } else {
    for (let sub in subs) {
      sub = subs[sub];
      if (!sub.in) toSub[sub.key] = sub;
    }
  }
  const peopleKeys = Object.keys(toSub);
  const randomSub = peopleKeys[Math.floor(Math.random() * peopleKeys.length)];
  moveToTeam(subs[randomSub].name, "current");
  document.getElementById("info").innerHTML = subs[randomSub].name + " was selected!";
}

async function fillCurrentTeam(key, from = "code") {
  if (from === "select") {
    reload();
    currentTeamKey = key ?? currentTeamKey;
    currentTeam = tourney.people.teams[currentTeamKey];
    toDelete = [];
    fillDeleted();
  }
  const currentList = document.getElementById("currentList");
  let teamHtml = "";
  currentTeam.members?.forEach((m) => {
    teamHtml += currentToHTML(m);
  });
  currentList.innerHTML = teamHtml;
  fillSubs();
  document.getElementById("saveBtn").disabled = false;
}

function fillDeleted() {
  const deletedList = document.getElementById("deletedList");
  let deletedHTML = "";
  for (let person in toDelete) {
    person = toDelete[person];
    deletedHTML += deletedToHTML(person);
  }
  if (deletedHTML) deletedList.innerHTML = deletedHTML;
  else deletedList.innerHTML = defaultHTML;
  feather.replace({ "aria-hidden": "true" });
}

function moveToTeam(name, destination) {
  if (destination === "current") {
    const [isInSubs, key] = isInTourney(subs, name);
    if (isInSubs && currentTeam.members) {
      subs[key].in = true;
      currentTeam.members.push(subs[key].name);
    } else if (toDelete.includes(name)) {
      currentTeam.members.push(name);
      toDelete.splice(toDelete.indexOf(name), 1);
    } else {
      Swal.fire("Error", `There was an error adding ${name}, try reloading the page or select a valid team`, "error");
    }
  } else if (destination === "subs") {
    const [isIn, key] = isInTourney(subs, name);
    if (isIn) subs[key].in = false;
    currentTeam.members = currentTeam.members.filter((m) => m !== name);
  } else {
    const [deletedMember] = currentTeam.members.splice(currentTeam.members.indexOf(name), 1);
    toDelete.push(deletedMember);
  }

  fillSubs();
  fillCurrentTeam();
  fillDeleted();
}

function subToHTML(sub) {
  //prettier-ignore
  return `<li class="list-group-item">
            <button class="text-start p-0 border-0 align-text-bottom" style="width: 100%; background-color: unset" onclick="moveToTeam('${sub.name}','current')">
              ${sub.name} <span class="align-text-bottom" data-feather="arrow-right">></span>
            </button>
          </li>`;
}

function currentToHTML(name) {
  const [isIn] = isInTourney(subs, name);
  if (isIn) {
    return `<li class="list-group-item">
            <button class="text-start p-0 border-0 align-text-bottom" style="width: 100%; background-color: unset" onclick="moveToTeam('${name}','subs')">
              ${name} <span class="align-text-bottom" data-feather="arrow-left">></span>
            </button>
          </li>`;
  } else
    return `<li class="list-group-item">
            <button class="text-start p-0 border-0 align-text-bottom" style="width: 100%; background-color: unset" onclick="moveToTeam('${name}','delete')">
              ${name} <span class="align-text-bottom" data-feather="arrow-down">></span>
            </button>
          </li>`;
}

function deletedToHTML(name) {
  return `<li class="list-group-item">
            <button class="text-start p-0 border-0 align-text-bottom" style="width: 100%; background-color: unset" onclick="moveToTeam('${name}','current')">
              ${name} <span class="align-text-bottom" data-feather="arrow-up">></span>
            </button>
          </li>`;
}

function teamToHTML(team) {
  let html = `<tr><td>${team.in ? '<span data-feather="check">' : ""}</span> ${team.name}</td>`; //Name
  if (tourney.mode === "draft")
    html += `<td>
              <input type="number" value="${team.tier}" min='0' style="max-width: 20%; border:0; background-color:rgba(0,0,0,0);" onchange="changeTier('${team.name}', this.value, 'input')" id="inputTeam${team.name}"/>
              <div class="btn-group">
                <button type="button" class="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center" onclick="changeTier('${team.name}', '1')">
                  <span data-feather="chevron-up"></span>
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center" onclick="changeTier('${team.name}', '-1')">
                  <span data-feather="chevron-down"></span>
                </button>
              </div>
            </td>`; //Tier
  html += `<td class="d-flex align-items-center justify-content-center">`; //Actions td
  //prettier-ignore
  html += `<button type="button" class="btn btn-sm btn-danger text-light btn-outline-secondary fs-6" style="width: 5rem;"onclick="kick('${team.name}')"><span data-feather="user-x"></span>&nbsp;KICK</button>`; //Kick button
  return html;
}

function saveTeam() {
  if (!currentTeam.members.includes(currentTeam.captain)) {
    currentTeam.name = currentTeam.members[0];
    currentTeam.captain = currentTeam.members[0];
  }
  currentTeam.members.forEach((m) => {
    let [isIn, key] = isInTourney(subs, m);
    if (isIn) delete subs[key];
  });

  toDelete.forEach((d) => {
    let [isIn, key] = isInTourney(tourney.people.og, d);
    if (isIn && (tourney.mode === "draft" || tourney.people.set) && (!tourney.randomized || tourney.mode === "draft")) {
      tourney.people.og[key].in = false;
      tourney.people.og[key].picked = false;
    }
  });

  if (tourney.people.set || tourney.mode === "draft") tourney.people.teams[currentTeamKey] = currentTeam;
  else if (!tourney.randomized) {
    currentTeam.in = true;
    tourney.people.teams[currentTeamKey] = currentTeam;
    tourney.people.og[currentTeamKey] = currentTeam;
  } else tourney.people.og[currentTeamKey] = currentTeam;
  fetch(`/tourneys/${tourney.id}/people`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ people: tourney.people }),
  })
    .then(() => {
      Swal.fire("Success!", `Team ${currentTeam.name} has been edited`, "success");
    })
    .catch((err) => {
      Swal.fire("Oops!", `There was an error editing team ${currentTeam.name} ${err}`, "error");
    });
}

function changeTier(username, tier, from = "button") {
  if (tier.match(/^0[0-9]+/)) {
    tier = tier.replace(/^0+/, "");
  }
  const currentTier = parseInt(document.getElementById(`inputTeam${username}`).value);
  let tierSum;
  if (from === "button") {
    tier = parseInt(tier);
    tierSum = currentTier + tier;
    if (tierSum < 0) tierSum = 0;
    document.getElementById(`inputTeam${username}`).value = tierSum;
  }
  fetch(`/tourneys/${tourney.id}/subs/${username}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      edit: [{ property: "tier", value: tierSum ?? currentTier }],
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (!res) Swal.fire("ERROR", "There was an error updating the tier", "error");
      reload();
    });
}

function reload(filter) {
  loadTable(filter);
}

async function getParams() {
  new URL(window.location.href).searchParams.forEach((x, y) => {
    params[y] = x;
  });
  if (params.tourneyId) {
    [tourney] = await fetch("/tourneys/" + params.tourneyId).then((res) => res.json());
  }
}

let currentTeamKey;
let selectedTier;
let tourney;
let toDelete = [];
let currentTeam = {};
let params = {};
let teams = {};
let subs;
const defaultHTML = `<li class="list-group-item">
                        <button id="button" class="text-start p-0 border-0 align-text-bottom" style="width: 100%; background-color: unset" disabled>
                            No more players
                            <span class="align-text-bottom" data-feather="arrow-right">></span>
                        </button>
                    </li>`;
getParams();
reload();
