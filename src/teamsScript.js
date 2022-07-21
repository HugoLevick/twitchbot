async function loadPeople() {
  return await fetch("/people")
    .then((response) => response.json())
    .then((people) => people);
}

async function randomizeTeams() {
  let peoplePerTeam = parseInt(document.getElementById("peopleperteam").value);
  if (peoplePerTeam < 1) return;
  let grid = document.getElementById("teamsgrid");
  let people = await loadPeople();
  people = people.filter((person) => person.checkin);
  const numberOfPeople = people.length;
  let randomNumber;
  let currentTeam = [];
  let teamNumber = 0;
  for (let i = 0; i < numberOfPeople / peoplePerTeam; i++) {
    teamNumber++;
    currentTeam = [];
    for (let i = 0; i < peoplePerTeam; i++) {
      if (people.length > 0) {
        randomNumber = Math.floor(Math.random() * people.length);
        currentTeam.push(...people.splice(randomNumber, 1));
      } else break;
    }
    teams[i] = new Team(teamNumber, currentTeam);
  }

  let html = '<div class="row mt-4 mb-4">';
  for (let i = 0, j = 0; i < numberOfPeople / peoplePerTeam; i++, j++) {
    if (j === 3) {
      html += '</div><!--End of row--><div class="row mt-4 mb-4">';
      j = 0;
    }
    html += `<div class="col d-flex justify-content-center align-items-center">
              <div class="card" style="width: 17rem">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <p class="h3">Team ${teams[i].number}</p>
                  <button class="btn btn-outline-primary" onClick="copyText(${teams[i].number})">Copy</button>
                </div>
                <ul class="list-group list-group-flush">
                  ${listMembers(teams[i].members)}
                </ul>
              </div>
            </div><!--End of col-->`;
  }
  grid.innerHTML = html;
}

function listMembers(members) {
  let html = "";
  members.forEach((member) => {
    html += `<li class="list-group-item">${member.username}</li>`;
  });
  return html;
}
async function setNumberOfPeople() {
  let people = await loadPeople();
  let noOfPeople = document.getElementById("noOfPeople");
  people = people.filter((person) => person.checkin);
  noOfPeople.innerHTML = people.length;
}
function copyText(team) {
  let text = "";
  const members = teams[team - 1].members;

  members.forEach((member, i) => {
    if (i === members.length - 1) {
      text += member.username;
    } else {
      text += `${member.username} / `;
    }
  });
  console.log(text);
  navigator.clipboard.writeText(text);
}

class Team {
  constructor(number, members = []) {
    this.number = number;
    this.members = members;
  }
}

let teams = {};
setNumberOfPeople();
