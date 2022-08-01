let table = document.getElementById("checkintable");
let thead = document.getElementById("thead");
let selectedT = document.getElementById("selectedTourney");
let noOfPeople = document.getElementById("noOfPeople");
let noOfCheckIns = document.getElementById("noOfCheckIns");
let btnAdd = document.getElementById("btnAdd");
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

        if (tourney && tourney?.mode !== "solos") {
          //----------------------------------------------------TEAMS-----------------------------------------------------
          btnAdd.innerHTML = '<span data-feather="user-plus"></span>&nbsp;Add Team';
          thead.innerHTML =
            '<tr><th scope="col">Team Name</th><th scope="col">Captain</th><th scope="col">Checked In</th><th scope="col">Members</th><th scope="col" class="d-flex align-items-center justify-content-center">Actions</th></tr>';
          let html = "";
          let teams = [];
          for (let team in tourney.people.og) {
            team = tourney.people.og[team];
            //Set number of teams
            teams.push(team);
            //Load Table
            if (team.name.match(filterRegExp) || team.captain.match(filterRegExp)) {
              html += `<tr><td>${team.in ? '<span data-feather="check">' : ""}</span> ${team.name}</td>`; //Name
              html += `<td>${team.captain}</td>`; //Captain
              html += `<td>${team.in ? "YES" : "NO"}</td>`; //Checkin
              html += `<td>${team.members}</td>`; //Members
              html += `<td class="d-flex align-items-center justify-content-center">`; //Actions td
              //prettier-ignore
              html += `<button type="button" class="btn btn-sm btn-danger text-light btn-outline-secondary fs-6" style="width: 5rem;"onclick="kick('${team.captain}')"><span data-feather="user-x"></span>&nbsp;KICK</button>`; //Kick button
              //prettier-ignore
              html += `<button type="button" class="btn btn-sm ${team.in ? 'btn-secondary' : 'btn-success'} text-light btn-outline-secondary fs-6" style="margin-left: 0.5rem; width: 8rem" onclick="${team.in ? `check('${team.captain}', 'out')` : `check('${team.captain}', 'in')`}">${team.in ? '<span data-feather="user-minus"></span>&nbsp;CHECK OUT' : '<span data-feather="user-check"></span>&nbsp;CHECK IN'}</button>`; //Check In/Out button
              //prettier-ignore
              html += `<button type="button" class="btn btn-sm btn-secondary text-light btn-outline-secondary fs-6" style="margin-left: 0.5rem; width: 5rem;" onclick="ban('${team.captain}')"><span data-feather="slash"></span>&nbsp;BAN</button></td></tr>`; //Ban button
            }
          }
          noOfPeople.innerHTML = teams.length;
          teams = teams.filter((t) => t.in === true);
          noOfCheckIns.innerHTML = teams.length;
          table.innerHTML = html;
          feather.replace({ "aria-hidden": "true" });
        } else if (tourney) {
          //----------------------------------------------------SOLOS-----------------------------------------------------
          btnAdd.innerHTML = '<span data-feather="user-plus"></span>&nbsp;Add Person';
          let html = "";
          let people = [];
          for (let person in tourney.people.og) {
            person = tourney.people.og[person];
            //Set number of people
            people.push(person);
            //Load Table
            if (person.name.match(filterRegExp)) {
              html += `<tr><td>${person.in ? '<span data-feather="check">' : ""}</span> ${person.name}</td>`; //Name
              html += `<td>${person.in ? "YES" : "NO"}</td>`; //Checkin
              html += `<td class="d-flex align-items-center justify-content-center">`; //Actions td
              //prettier-ignore
              html += `<button type="button" class="btn btn-sm btn-danger text-light btn-outline-secondary fs-6" style="width: 5rem;"onclick="kick('${person.name}')"><span data-feather="user-x"></span>&nbsp;KICK</button>`; //Kick button
              //prettier-ignore
              html += `<button type="button" class="btn btn-sm ${person.in ? 'btn-secondary' : 'btn-success'} text-light btn-outline-secondary fs-6" style="margin-left: 0.5rem; width: 8rem" onclick="${person.in ? `check('${person.name}', 'out')` : `check('${person.name}', 'in')`}">${person.in ? '<span data-feather="user-minus"></span>&nbsp;CHECK OUT' : '<span data-feather="user-check"></span>&nbsp;CHECK IN'}</button>`; //Check In/Out button
              //prettier-ignore
              html += `<button type="button" class="btn btn-sm btn-secondary text-light btn-outline-secondary fs-6" style="margin-left: 0.5rem; width: 5rem;" onclick="ban('${person.name}')"><span data-feather="slash"></span>&nbsp;BAN</button></td></tr>`; //Ban button
            }
          }
          noOfPeople.innerHTML = people.length;
          people = people.filter((p) => p.in === true);
          noOfCheckIns.innerHTML = people.length;
          table.innerHTML = html;
          feather.replace({ "aria-hidden": "true" });
          thead.innerHTML =
            '<tr><th scope="col">Username</th><th scope="col">Checked In</th><th scope="col" class="d-flex align-items-center justify-content-center">Actions</th></tr>';
        }
      }
    });
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
              }
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

let tourney;
let params = {};
getParams();
reload();
