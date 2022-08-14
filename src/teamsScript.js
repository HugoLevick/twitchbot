let selectedT = document.getElementById("selectedTourney");
let noOfPeople = document.getElementById("noOfPeople");
let noOfCheckIns = document.getElementById("noOfCheckIns");
let randomBtn = document.getElementById("randomBtn");
let modeLabel = document.getElementById("mode");
let grid = document.getElementById("teamsgrid");
let filterOrRandom = document.getElementById("filterOrRandom");
let peoplePerTeam = document.getElementById("peopleperteam");
let inputBar = document.getElementById("inputBar");
const DateTime = luxon.DateTime;

async function loadPeople() {
  return await fetch("/people")
    .then((response) => response.json())
    .then((people) => people);
}

async function loadTeams(filter) {
  return new Promise((resolve) => {
    const filterRegExp = new RegExp(filter || ".*", "i");
    fetch("/current/tourneys")
      .then((res) => res.json())
      .then(async (nextTourneys) => {
        if (nextTourneys.length > 0) {
          selectedT.innerHTML = "<option value='' selected disabled>--SELECT A TOURNEY--</option>";
          for (let t in nextTourneys) {
            t = nextTourneys[t];
            let date = DateTime.fromISO(t.start);
            //prettier-ignore
            selectedT.innerHTML += `<option ${t.id == tourney?.id ? "selected" : ""} value="${t.id}">${t.name.length > 45 ? t.name.substring(0, 45) + "..." : t.name}   -  ${date.month}/${date.day} ${date.hour}:${date.minute}</option>`;

            if (t.id == params.tourneyId) {
              tourney = t;
              if (tourney.people.set && tourney.randomized) {
                teams = tourney.people.teams ?? {};
              } else {
                teams = tourney.people.og ?? {};
              }
            }
          }
          if (tourney && !tourney.randomized && tourney.mode !== "draft") {
            if (!tourney.people.teams) tourney.people.teams = {};
            let keys = Object.keys(teams);
            for (let key in keys) {
              key = keys[key];
              let team = teams[key];
              tourney.people.teams[key] = new Team(team.name, team.captain ?? team.name, team.members ?? [team.name], key, team.in);
            }
            teams = tourney.people.teams ?? {};
          }
        }
        if (tourney) {
          //prettier-ignore
          modeLabel.innerHTML = `${tourney.randomized ? "Randomized" : "Set"} ${tourney.mode.charAt(0).toUpperCase() + tourney.mode.slice(1)}`;
          if ((!tourney.randomized || tourney.people.set) && tourney.mode != "draft") {
            const keys = Object.keys(teams);
            const numberOfTeams = keys.length;
            let html = '<div class="row mt-4 mb-4">';
            for (let i = 0, j = 0; i < numberOfTeams; i++, j++) {
              let team = teams[keys[i]];
              let filtered = filterMembers(team.members, filterRegExp);
              if (team.in && (filtered || team.name.toString().match(filterRegExp))) {
                if (j === 3) {
                  html += '</div><!--End of row--><div class="row mt-4 mb-4">';
                  j = 0;
                }
                html += teamToHTML(team);
              }
            }
            html += "</div>";
            grid.innerHTML = html;
            if (!tourney.randomized) {
              randomBtn.disabled = true;
            }
          } else if (tourney?.mode === "draft") {
            fetch("/teams/draft")
              .then((res) => res.text())
              .then((html) => {
                teams = tourney.people.teams ?? {};
                grid.innerHTML = html;
                reloadDraft();
                feather.replace({ "aria-hidden": "true" });
              });
          }
        }
        resolve();
      });
  });
}

async function randomizeTeams() {
  const randomSelect = document.getElementById("randomSelect");
  randomSelect.innerHTML = nosearch;
  reload();
  newTeams = {};
  let teamsOf = parseInt(document.getElementById("teamsOf").value);
  let checked = parseInt(noOfCheckIns.innerHTML);
  peoplePerTeam = teamsOf;

  if (teamsOf > checked) {
    Swal.fire("Too many players", "There aren't enough people to fill a team", "error");
  } else {
    Swal.fire({
      title: "Are you sure?",
      text: "This will overwrite the previous teams",
      icon: "question",
      showConfirmButton: true,
      showCancelButton: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        let residual = checked % teamsOf;
        let answer = true;
        if (residual !== 0) {
          answer = await Swal.fire({
            title: `A team will not be full`,
            text: `A team will not be complete, continue?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes",
          }).then((result) => {
            if (result.isConfirmed) {
              return true;
            } else {
              return false;
            }
          });
        }

        let random;
        let currentTeam;
        let keys = Object.keys(newTeams);
        let key;
        let html = '<div class="row mt-4 mb-4">';
        if (answer && tourney.mode === "solos") {
          let players = [];
          for (let team in tourney.people.og) {
            team = tourney.people.og[team];
            if (team.in) {
              players.push(team);
            }
          }
          for (let i = 0, j = 0; i < checked / peoplePerTeam; i++, j++) {
            keys = Object.keys(newTeams);
            key = keys.length > 0 ? parseInt(keys[keys.length - 1]) + 1 : 1;
            currentTeam = [];
            for (let j = 0; j < peoplePerTeam; j++) {
              random = Math.floor(Math.random() * players.length);
              currentTeam.push(players.splice(random, 1)[0]);
            }
            currentTeam = currentTeam.map((p) => p?.name);
            currentTeam = new Team(key, currentTeam.join(", "), currentTeam, key, true);
            if (j === 3) {
              html += '</div><!--End of row--><div class="row mt-4 mb-4">';
              j = 0;
            }
            html += teamToHTML(currentTeam);
            newTeams[key] = currentTeam;
          }
          html += "</div>";
          grid.innerHTML = html;
        } else if (answer && tourney.mode === "draft") {
          tieredTeams = tourney.people.og;
          let tiers = {};
          let keys = Object.keys(tieredTeams);
          for (let key in keys) {
            key = keys[key];
            person = tieredTeams[key];
            if (person && person.in) {
              if (tiers[person.tier] === undefined) tiers[person.tier] = [];
              tiers[person.tier] = [...tiers[person.tier], person];
            }
          }
          let t1answer = true;
          if (tiers[Object.keys(tiers)[0]].length < checked / Object.keys(tiers).length) {
            t1answer = await Swal.fire({
              title: "Not enought Tier 1's",
              text: "Not all teams will have a T1 player, continue?",
              icon: "warning",
              showConfirmButton: true,
              showCancelButton: true,
            }).then(async (result) => {
              if (result.isConfirmed) {
                return true;
              }
            });
          }
          if (t1answer) {
            let random;
            let randomMembers = [];
            let randomTeams = {};
            for (let i = 0, j = 0; i < checked / Object.keys(tiers).length; i++, j++) {
              keys = Object.keys(tiers);
              randomMembers = [];
              for (let key in keys) {
                key = keys[key];
                let peopleInTier = tiers[key].length;
                if (peopleInTier > 0) {
                  random = Math.floor(Math.random() * peopleInTier);
                  let [randomPerson] = tiers[key].splice(random, 1);
                  randomPerson.picked = true;
                  randomMembers.push(randomPerson);
                }
              }
              teamKeys = Object.keys(randomTeams ?? {});
              teamKey = teamKeys.length > 0 ? teamKeys[teamKeys.length - 1] : ["0"];
              teamKey = parseInt(teamKey) + 1;
              randomTeams[teamKey] = new Team(
                randomMembers[0].name,
                randomMembers[0].name,
                randomMembers.map((m) => m.name),
                teamKey,
                true
              );
            }
            tourney.people.teams = { ...randomTeams };
            reloadDraft();
            savePeople();
            randomSelect.innerHTML = search;
            Swal.fire("Done!", "These will be the new teams", "success");
          }
        } else if (answer) {
          let captains = [];
          let currentMembers = [];
          let teamName = [];
          let setTeams = [];
          let html = '<div class="row mt-4 mb-4">';
          for (let team in tourney.people.og) {
            team = tourney.people.og[team];
            if (team.in) {
              setTeams.push(team);
            }
          }
          for (let i = 0, j = 0; i < checked / peoplePerTeam; i++, j++) {
            keys = Object.keys(newTeams);
            key = keys.length > 0 ? parseInt(keys[keys.length - 1]) + 1 : 1;
            currentTeam = [];
            captains = [];
            currentMembers = [];
            teamName = [];
            for (let j = 0; j < peoplePerTeam; j++) {
              random = Math.floor(Math.random() * setTeams.length);
              currentTeam.push(setTeams.splice(random, 1)[0]);
            }
            currentTeam.forEach((t) => {
              if (t) {
                teamName.push(t.name);
                captains.push(t.captain);
                currentMembers = [...currentMembers, ...t.members];
              }
            });
            teamName = teamName.join(" + ");
            captains = captains.join(", ");
            currentTeam = new Team(teamName, captains, currentMembers, key, true);
            if (j === 3) {
              html += '</div><!--End of row--><div class="row mt-4 mb-4">';
              j = 0;
            }
            html += teamToHTML(currentTeam);
            newTeams[key] = currentTeam;
          }
          html += "</div>";
          grid.innerHTML = html;
        }
        if (answer && tourney.mode !== "draft") {
          tourney.people.teams = newTeams;
          fetch(`/setteams/${tourney.id}`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ teams: newTeams }),
          })
            .then((res) => res.json())
            .then((res) => {
              if (res) {
                const randomSelect = document.getElementById("randomSelect");
                randomSelect.innerHTML = search;
                Swal.fire("Done!", "These will be the teams for this tourney!", "success");
              } else {
                Swal.fire("Oops", "Couldn't set the teams", "error");
              }
            });
        }
      }
    });
  }
}

function listMembers(members) {
  let html = "";
  members.forEach((member) => {
    if (member) html += `<li class="list-group-item">${member}</li>`;
  });
  return html;
}

function filterMembers(members, regEx) {
  for (let member in members) {
    member = members[member];
    if (member.match(regEx)) return true;
  }
  return false;
}

async function setNumberOfPeople() {
  let people = 0;
  let checked = 0;
  for (let team in tourney.people.og) {
    if (team !== "set") {
      team = tourney.people.og[team];
      people++;
      if (team.in) checked++;
    }
  }
  noOfPeople.innerHTML = people;
  noOfCheckIns.innerHTML = checked;
}

function copyText(team) {
  const btn = document.getElementById("btnteam" + team);
  const members = newTeams[team]?.members ?? tourney.people.teams[team].members;
  const name = newTeams[team]?.name ?? tourney.people.teams[team].name;
  let text = "";
  if (name) text += `(${name}) - `;
  text += members.filter((m) => m !== null && m !== undefined).join(" / ");
  navigator.clipboard.writeText(text);
  btn.style.backgroundColor = "green";
  btn.style.color = "white";
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2" viewBox="0 0 16 16">
  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
  </svg>`;
}

async function reload(filter) {
  return new Promise(async (resolve) => {
    if (filter === "/FirstReload/") {
      await loadTeams();
      if (tourney) {
        setNumberOfPeople();
        if (tourney?.mode === "draft") {
          draftTeams = { ...tourney.people.og };
        }
        nosearch = `  <option value="random">${tourney.mode === "solos" || tourney.mode === "draft" ? "Randomize" : "Fuse teams"}</option>
                    <option value="search" disabled>Cannot search</option>`;
        search = `  <option value="random">${tourney.mode === "solos" || tourney.mode === "draft" ? "Randomize" : "Fuse teams"}</option>
                  <option value="search">Search</option>`;
        if (tourney.randomized || tourney.mode === "draft") {
          filterOrRandom.innerHTML = `<div class="input-group m-0">
                  <div class="input-group-prepend">
                    <span class="input-group-text" id="labelTeamsOf" style="border-radius: 0">
                      <select style="border:0; background-color:#e9ecef;" id="randomSelect" onchange="handleSelectRandom(this.value)">
                        <option value="random">${tourney.mode === "solos" || tourney.mode === "draft" ? "Randomize" : "Fuse teams"}</option>
                        <option value="search">Search</option>
                      </select>
                    </span>
                  </div>
                  <input type="number" class="form-control"style= "max-width: 100%" id="teamsOf" min="1" value="1" ${
                    tourney.mode === "draft" ? "disabled" : ""
                  }/>
                </div>`;
        } else {
          filterOrRandom.innerHTML = `<div class="input-group m-0">
                  <div class="input-group-prepend">
                    <span class="input-group-text" id="labelFilter" style="border-radius: 0">Filter:</span>
                  </div>
                  <input type="text"class="form-control" style="max-width: 100%"id="filterTable" oninput="reload(this.value)"placeholder="Search..."/>
                </div>`;
        }
      }
    } else {
      await loadTeams(filter);
      setNumberOfPeople();
    }
    resolve();
  });
}

async function getParams() {
  new URL(window.location.href).searchParams.forEach((x, y) => {
    params[y] = x;
  });
  if (params.tourneyId) {
    [tourney] = await fetch("/tourneys/" + params.tourneyId).then((res) => res.json());
    if (tourney.people.set && tourney.randomized) {
      teams = tourney.people.teams ?? {};
    } else {
      teams = tourney.people.og ?? {};
    }
    if (tourney.status === "ended") {
      randomBtn.disabled = true;
    }
  }
}

function teamToHTML(team) {
  return `<div class="col d-flex justify-content-center align-items-center">
            <div class="card" style="width: 18rem; max-width: 18rem;">
              <div class="card-header d-flex justify-content-between align-items-center">
                <p class="h3">Team ${team.name}</p>
                <button id="btnteam${team.key}" class="btn btn-outline-primary" onClick="copyText(${team.key})">Copy</button>
              </div>
              <ul class="list-group list-group-flush">
                ${listMembers(team.members ?? [team.name])}
              </ul>
            </div>
          </div><!--End of col-->`;
}

function handleSelectRandom(value) {
  switch (value) {
    case "random":
      randomBtn.disabled = false;
      filterOrRandom.innerHTML = `<div class="input-group m-0">
                  <div class="input-group-prepend">
                    <span class="input-group-text" id="labelTeamsOf" style="border-radius: 0">
                      <select style="border:0; background-color:#e9ecef;" id="randomSelect" onchange="handleSelectRandom(this.value)">
                        <option value="random" selected>${
                          tourney.mode === "solos" || tourney.mode === "draft" ? "Randomize" : "Fuse teams"
                        }</option>
                        <option value="search">Search</option>
                      </select>
                    </span>
                  </div>
                  <input type="number" class="form-control"style= "max-width: 100%" id="teamsOf" min="1" value="1" ${
                    tourney.mode === "draft" ? "disabled" : ""
                  }/>
                </div>`;
      break;
    case "search":
      randomBtn.disabled = true;
      filterOrRandom.innerHTML = `<div class="input-group m-0">
                  <div class="input-group-prepend">
                    <span class="input-group-text" id="labelFilter" style="border-radius: 0">
                      <select style="border:0; background-color:#e9ecef;" id="randomSelect" onchange="handleSelectRandom(this.value)">
                        <option value="random">${tourney.mode === "solos" || tourney.mode === "draft" ? "Randomize" : "Fuse teams"}</option>
                        <option value="search" selected>Search</option>
                      </select>
                    </span>
                  </div>
                  <input type="text"class="form-control" style="max-width: 100%"id="filterTable" oninput="${
                    tourney.mode === "draft" ? "reloadDraft" : "reload"
                  }(this.value)"placeholder="Search..."/>
                </div>`;
  }
}

class Team {
  constructor(name, captain, members, key = 0, checked = false) {
    this.name = name;
    this.captain = captain;
    this.members = members;
    this.in = checked;
    this.key = key;
  }
}

let nosearch, search;
let tourney;
let teams = {};
let newTeams = {};
let draftTeams = {};
let params = {};
getParams();
reload("/FirstReload/");
