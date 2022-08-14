let table = document.getElementById("checkintable");
let thead = document.getElementById("thead");
let selectedT = document.getElementById("selectedTourney");
let noOfPeople = document.getElementById("noOfPeople");
let noOfCheckIns = document.getElementById("noOfCheckIns");
let btnAdd = document.getElementById("btnAdd");
let title = document.getElementById("title");
const DateTime = luxon.DateTime;

function loadTable(filter) {
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

        if (tourney?.mode === "solos") {
          //----------------------------------------------------SOLOS-----------------------------------------------------
          title.innerHTML = "Sign Up - Solos";
          btnAdd.innerHTML = '<span data-feather="user-plus"></span>&nbsp;Add Person';
          let html = "";
          let people = [];
          for (let person in tourney.people.og) {
            person = tourney.people.og[person];
            //Set number of people
            people.push(person);
            //Load Table
            if (person.name.match(filterRegExp)) {
              html += teamToHTML(person, "solos");
            }
          }
          noOfPeople.innerHTML = people.length;
          people = people.filter((p) => p.in === true);
          noOfCheckIns.innerHTML = people.length;
          table.innerHTML = html;
          feather.replace({ "aria-hidden": "true" });
        } else if (tourney?.mode === "draft") {
          //----------------------------------------------------DRAFT-----------------------------------------------------
          title.innerHTML = "Sign Up - Draft";
          btnAdd.innerHTML = '<span data-feather="user-plus"></span>&nbsp;Add Person';
          let html = "";
          let teams = [];
          for (let team in tourney.people.og) {
            team = tourney.people.og[team];
            //Set number of teams
            teams.push(team);
            //Load Table
            let tfilter;
            if (selectedTier == 0 || selectedTier == undefined) {
              tfilter = true;
            } else {
              tfilter = team.tier == selectedTier;
            }
            if ((team.name.match(filterRegExp) || team.captain?.match(filterRegExp)) && tfilter) {
              html += teamToHTML(team, "draft");
            }
          }
          noOfPeople.innerHTML = teams.length;
          teams = teams.filter((t) => t.in === true);
          noOfCheckIns.innerHTML = teams.length;
          table.innerHTML = html;
          feather.replace({ "aria-hidden": "true" });
        } else if (tourney) {
          //----------------------------------------------------TEAMS-----------------------------------------------------
          title.innerHTML = "Sign Up - " + tourney.mode;
          btnAdd.innerHTML = '<span data-feather="user-plus"></span>&nbsp;Add Team';
          let html = "";
          let teams = [];
          for (let team in tourney.people.og) {
            team = tourney.people.og[team];
            //Set number of teams
            teams.push(team);
            //Load Table
            if (team.name.match(filterRegExp) || team.captain.match(filterRegExp)) {
              html += teamToHTML(team);
            }
          }
          noOfPeople.innerHTML = teams.length;
          teams = teams.filter((t) => t.in === true);
          noOfCheckIns.innerHTML = teams.length;
          table.innerHTML = html;
          feather.replace({ "aria-hidden": "true" });
        }
      }
    });
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
      fetch(`/people/${tourney.id}/${username}`, {
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

async function check(username, inOrOut) {
  Swal.fire({
    title: `Do you really want to check ${inOrOut} ${username}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/check/${tourney.id}/${username}/`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ check: inOrOut }),
      })
        .then((response) => response.json())
        .then((res) => {
          if (res) {
            Swal.fire(`${username} has been checked ${inOrOut}!`, "", "success");
            reload();
          } else {
            Swal.fire(`Couldn't check ${inOrOut} ${username}, could have left before being checked in`, "error");
            reload();
          }
        });
    }
  });
}

async function ban(username) {
  Swal.fire({
    title: `Do you really want to ban ${username}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/people/${tourney.id}/${username}`, {
        method: "DELETE",
      }).then(() => {
        fetch("/banned", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: username }),
        })
          .then((response) => response.json())
          .then((res) => {
            if (res) {
              Swal.fire("BONK! 💥🔨", username + " has been banned!", "success");
              reload();
            } else {
              Swal.fire("Couldn't ban " + username, "I actually dont know why this happened", "error");
              reload();
            }
          });
      });
    }
  });
}

async function addToTourney() {
  if (tourney) {
    //If there is a tourney selected
    fetch(`/tourneys/${tourney.id}`)
      .then((res) => res.json())
      .then(([tourney]) => {
        let title,
          html = "";
        if (tourney?.mode === "solos") {
          title = "What's the username?";
          html = "<input id='addPerson' type='text'/>";
        } else if (tourney?.mode === "draft") {
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
          title = "Add Team";
          html += `<div class="container mb-3"><label for="teamName" class="form-label">Team Name:</label><input class="form-control" id="teamName" name="teamName">`;
          html += `<div class="container mb-3"><label for="teamCaptain" class="form-label">Captain:</label><input class="form-control" id="teamCaptain" name="teamCaptain">`;
          html += `<div class="container mb-1"><label for="teamMembers" class="form-label">Members:</label><textarea rows=3 class="form-control" id="teamMembers" name="teamMembers"></textarea><div id="membersHelp" class="form-text">One per line, exclude captain. This is a ${tourney.mode} tourney</div>`;
        }
        Swal.fire({
          title: title,
          html: html,
          showCloseButton: true,
          showCancelButton: true,
        }).then((result) => {
          if (result.isConfirmed) {
            if (tourney.mode === "solos") {
              const username = document.getElementById("addPerson").value;
              fetch("/people", {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: username,
                  captain: username,
                  members: [username],
                  id: tourney.id,
                }),
              })
                .then((res) => res.json())
                .then((res) => {
                  if (res[0]) {
                    Swal.fire("Person added", "", "success");
                    reload();
                  } else {
                    Swal.fire("Couldn't add person", "They might be already in the tourney", "error");
                    reload();
                  }
                });
            } else if (tourney.mode === "draft") {
              const username = document.getElementById("username").value;
              const tier = parseInt(document.getElementById("userTier").value || "0");
              fetch("/people", {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: username,
                  id: tourney.id,
                  tier: tier !== NaN ? tier : "0",
                }),
              })
                .then((res) => res.json())
                .then((res) => {
                  if (res[0]) {
                    Swal.fire("Person added", "", "success");
                    reload();
                  } else {
                    Swal.fire("Couldn't add person", "They might be already in the tourney", "error");
                    reload();
                  }
                });
            } else {
              let teamSize;
              let teamName = document.getElementById("teamName").value;
              let teamCaptain = document.getElementById("teamCaptain").value;
              let teamMembers = document.getElementById("teamMembers").value;
              teamMembers = teamMembers.split("\n");

              switch (tourney.mode) {
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

              if (teamName.match(/\w+/) && teamCaptain.match(/\w+/) && teamMembers.length === teamSize - 1) {
                fetch("/people", {
                  method: "POST",
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    name: teamName,
                    captain: teamCaptain,
                    members: teamMembers,
                    id: tourney.id,
                  }),
                })
                  .then((res) => res.json())
                  .then((res) => {
                    if (res[0]) Swal.fire("Added!", `${teamName} has entered the tourney`, "success");
                    else Swal.fire("Error", `There was a problem creating the team, the captain may already have a team `, "error");
                    reload();
                  })
                  .catch((err) => {
                    console.log(err);
                    reload();
                  });
              } else
                Swal.fire(
                  "Could not add team",
                  "Check your inputs. Names should not have special characters and members should be typed one per line excluding the captain",
                  "error"
                );
            }
          }
        });
      });
  }
}

async function clearList() {
  Swal.fire({
    title: `Do you really want to clear the list?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/people/${tourney.id}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((res) => {
          if (res) {
            Swal.fire("List cleared", "", "success");
            reload();
          } else {
            Swal.fire("Couldnt clear list", "", "error");
            reload();
          }
        });
    }
  });
}

function teamToHTML(team, mode = "team") {
  let html = `<tr><td>${team.in ? '<span data-feather="check">' : ""}</span> ${team.name}</td>`; //Name
  switch (mode) {
    case "solos":
      html += `<td>${team.in ? "YES" : "NO"}</td>`; //Checkin
      break;
    case "draft":
      html += `<td>${team.in ? "YES" : "NO"}</td>`; //Checkin
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
      break;
    //prettier-ignore
    default:
      html += `<td>${team.captain}</td>`  //Captain
      html += `<td>${team.in ? "YES" : "NO"}</td>`; //Checkin
      html += `<td>${team.members}</td>`; //Members
  }
  html += `<td class="d-flex align-items-center justify-content-center">`; //Actions td
  //prettier-ignore
  html += `<button type="button" class="btn btn-sm btn-danger text-light btn-outline-secondary fs-6" style="width: 5rem;"onclick="kick('${team.name}')"><span data-feather="user-x"></span>&nbsp;KICK</button>`; //Kick button
  //prettier-ignore
  html += `<button type="button" class="btn btn-sm ${team.in ? 'btn-secondary' : 'btn-success'} text-light btn-outline-secondary fs-6" style="margin-left: 0.5rem; width: 8rem" onclick="${team.in ? `check('${team.name}', 'out')` : `check('${team.name}', 'in')`}">${team.in ? '<span data-feather="user-minus"></span>&nbsp;CHECK OUT' : '<span data-feather="user-check"></span>&nbsp;CHECK IN'}</button>`; //Check In/Out button
  //prettier-ignore
  html += `<button type="button" class="btn btn-sm btn-secondary text-light btn-outline-secondary fs-6" style="margin-left: 0.5rem; width: 5rem;" onclick="ban('${team.name}')"><span data-feather="slash"></span>&nbsp;BAN</button></td></tr>`; //Ban button
  return html;
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
  fetch(`/tourneys/${tourney.id}/people/${username}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      edit: [{ property: "tier", value: tierSum ?? (currentTier || 0) }],
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (!res) Swal.fire("ERROR", "There was an error updating the tier", "error");
    });
}

async function reload(filter) {
  new URL(window.location.href).searchParams.forEach((x, y) => {
    params[y] = x;
  });
  if (params.tourneyId) {
    [tourney] = await fetch("/tourneys/" + params.tourneyId).then((res) => res.json());
  }

  if (filter === "/FirstReload/") {
    loadTable();
    switch (tourney?.mode) {
      case "solos":
        thead.innerHTML =
          '<tr><th scope="col">Username</th><th scope="col">Checked In</th><th scope="col" class="d-flex align-items-center justify-content-center">Actions</th></tr>';
        break;
      case "draft":
        //prettier-ignore
        thead.innerHTML =
            `<tr><th scope="col">Username</th><th scope="col">Checked In</th><th scope="col">Tier <input type="number" class="fs-5" id="personTier" name="personTier" min="0" value="${selectedTier ?? '0'}" style="max-width:15%; border:0" onchange="filterTier(this.value)"/></th><th scope="col" class="d-flex align-items-center justify-content-center">Actions</th></tr>`;
        break;
      default:
        thead.innerHTML =
          '<tr><th scope="col">Team Name</th><th scope="col">Captain</th><th scope="col">Checked In</th><th scope="col">Members</th><th scope="col" class="d-flex align-items-center justify-content-center">Actions</th></tr>';
    }
  } else loadTable(filter);
}

let selectedTier;
let tourney;
let params = {};
reload("/FirstReload/");

setInterval(() => {
  reload(document.getElementById("filterTable").value);
}, 2000);
