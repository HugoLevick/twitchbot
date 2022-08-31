let tierCount;
let draftList;
let currentList;
let saveBtn;
let tiers = {};
let currentTeam = {};
const defaultHTML = `<li class="list-group-item">
                        <button id="button" class="text-start p-0 border-0 align-text-bottom" style="width: 100%; background-color: unset" disabled>
                            No more players
                            <span class="align-text-bottom" data-feather="arrow-right">></span>
                        </button>
                    </li>`;

function fillDraftPlayers(filter) {
  tierCount = document.getElementById("tierCount");
  draftList = document.getElementById("draftList");
  const filterRegex = new RegExp(filter || ".*", "i");
  tiers = {};
  let keys = Object.keys(tourney.people.og);
  for (let key in keys) {
    key = keys[key];
    person = tourney.people.og[key];
    if (person?.in) {
      if (tiers[person.tier] === undefined) tiers[person.tier] = [];
      tiers[person.tier] = [...tiers[person.tier], person];
    }
  }
  keys = Object.keys(tiers);
  let html = "";
  let tierhtml = "";
  let quant = 0;
  for (let key in keys) {
    key = keys[key];
    people = tiers[key];
    tierhtml += `<span class="fw-bold">TIER ${key}:</span> ${people.length} players &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`;
    html += `<div class="card-header d-flex justify-content-between align-items-center">
                Tier ${key}
            </div>`;
    people.forEach((p) => {
      if (!p.picked && p.name?.match(filterRegex)) {
        html += draftToTeamHTML(p, "draft");
        quant++;
      }
    });
  }
  if (quant !== 0) draftList.innerHTML = html;
  else draftList.innerHTML = defaultHTML;
  tierCount.innerHTML = tierhtml;
  feather.replace({ "aria-hidden": "true" });
}

function fillCurrentTeam() {
  currentList = document.getElementById("currentList");
  let tiers = {};
  let keys = Object.keys(currentTeam);
  for (let key in keys) {
    key = keys[key];
    person = currentTeam[key];
    if (person) {
      if (tiers[person.tier] === undefined) tiers[person.tier] = [];
      tiers[person.tier] = [...tiers[person.tier], person];
    }
  }
  keys = Object.keys(tiers);
  let html = "";
  let quant = 0;
  for (let key in keys) {
    key = keys[key];
    people = tiers[key];
    html += `<div class="card-header d-flex justify-content-between align-items-center">
                Tier ${key}
            </div>`;
    people.forEach((p) => {
      if (p.picked) {
        html += draftToTeamHTML(p, "current");
        quant++;
      }
    });
  }
  if (quant > 0) {
    document.getElementById("saveBtn").disabled = false;
    currentList.innerHTML = html;
  } else {
    document.getElementById("saveBtn").disabled = true;
    currentList.innerHTML = defaultHTML;
  }
  feather.replace({ "aria-hidden": "true" });
}

function draftToTeamHTML(person, group = "draft") {
  //prettier-ignore
  return `<li class="list-group-item">
            <button class="text-start p-0 border-0 align-text-bottom" style="width: 100%; background-color: unset" onclick="moveToTeam('${person.name}','${group === 'draft' ? 'current': 'draft'}')">
              ${person.name} <span class="align-text-bottom" data-feather="arrow-${group === "draft" ? "right" : "left"}">></span>
            </button>
          </li>`;
}

function moveToTeam(username, group) {
  const [isIn, key] = isInTourney(group === "current" ? tourney.people.og : currentTeam, username);
  switch (group) {
    case "current":
      if (isIn) {
        let person = tourney.people.og[key];
        person.picked = true;
        currentTeam[key] = person;
      }
      break;
    case "draft":
      if (isIn) {
        let person = currentTeam[key];
        person.picked = false;
        draftTeams[key] = person;
        delete currentTeam[key];
      }
      break;
  }
  reloadDraft();
}

async function saveTeam() {
  let tiers = {};
  let keys = Object.keys(currentTeam);
  for (let key in keys) {
    key = keys[key];
    person = currentTeam[key];
    if (person) {
      if (tiers[person.tier] === undefined) tiers[person.tier] = [];
      tiers[person.tier] = [...tiers[person.tier], person];
    }
  }
  keys = Object.keys(tiers);
  let newTeamMembers = [];
  for (let key in keys) {
    key = keys[key];
    currentTier = tiers[key];
    currentTier.forEach((p) => {
      p.picked = true;
      newTeamMembers.push(p.name);
    });
  }
  keys = Object.keys(tourney.people.teams ?? {});
  key = keys.length > 0 ? keys[keys.length - 1] : ["0"];
  key = parseInt(key) + 1;
  if (!tourney.people.teams) tourney.people.teams = {};
  tourney.people.teams[key] = new Team(newTeamMembers[0], newTeamMembers[0], newTeamMembers, key, true);
  await savePeople();
  currentTeam = {};
  reloadDraft();
}

function loadDraftTeams(filter) {
  let teamRegex = new RegExp(filter || ".*", "i");
  let draftTeams = document.getElementById("draftTeams");
  let html = '<div class="row mt-4 mb-4">';
  let currentTeams = tourney.people.teams ?? {};
  let keys = Object.keys(currentTeams);
  if (keys.length > 0) {
    let j = 0;
    for (let key in keys) {
      key = keys[key];
      if (currentTeams[key].members.join(" ").match(teamRegex)) {
        html += draftToHTML(currentTeams[key]);
        j++;
      }
      if (j === 3) {
        html += '</div><!--End of row--><div class="row mt-4 mb-4">';
        j = 0;
      }
    }
    //prettier-ignore
    html += `
      <div class="text-center">
        <button class="btn btn-danger" onclick="clearTeams()" style="max-width: 18rem;" ${tourney.status === "ended" ? "disabled" : ""}>
          Clear Teams
        </button>
      </div>`;
    draftTeams.innerHTML = html;
  }
}

function savePeople() {
  return new Promise((resolve, reject) => {
    fetch(`/draft/set/${tourney.id}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ people: tourney.people }),
    })
      .then(() => {
        reload();
        resolve();
      })
      .catch((err) => reject(err));
  });
}

function clearTeams() {
  Swal.fire({
    title: "Are you sure?",
    text: "Deleting the current teams is irreversible",
    icon: "question",
    showCancelButton: true,
  }).then(async (result) => {
    if (result.isConfirmed) {
      for (let person in tourney.people.og) {
        person = tourney.people.og[person];
        person.picked = false;
        console.log(person);
      }
      tourney.people.teams = {};
      await savePeople();
      reload();
    }
  });
}

function dissolveTeam(teamKey) {
  let dissolvedTeam = tourney.people.teams[teamKey];
  Swal.fire({
    title: "Are you sure?",
    text: `Do you want to dissolve team "${dissolvedTeam.name}"`,
    icon: "question",
    showCancelButton: true,
  }).then(async (result) => {
    if (result.isConfirmed) {
      dissolvedTeam.members.forEach((p) => {
        const [isIn, key] = isInTourney(tourney.people.og, p);
        if (isIn) {
          tourney.people.og[key].picked = false;
        }
      });
      delete tourney.people.teams[teamKey];
      await savePeople();
      reloadDraft();
      Swal.fire("Done!", "", "success");
    }
  });
}

function draftToHTML(team) {
  return `
  <div class="col d-flex justify-content-center align-items-center">
    <div class="card" style="width: 18rem; max-width:18rem;">
        <div class="card-header d-flex justify-content-between align-items-center">
        <p class="h3">Team ${team.name.length > 8 ? team.name.slice(0, 9) + "..." : team.name}</p>
        <div class="btn-group">
            <button id="btnteam${team.key}" class="btn btn-outline-primary" onClick="copyText(${team.key})">Copy</button>
            <button type="button" class="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center" onclick="dissolveTeam(${
              team.key
            })" ${tourney.status === "ended" ? "disabled" : ""}>
                <span data-feather="x">X</span>
            </button>
        </div>
        </div>
        <ul class="list-group list-group-flush">
        ${listMembers(team.members)}
        </ul>
    </div>
  </div><!--End of col-->`;
}

function expand() {
  let tierOptions = "";
  for (let tier in tiers) {
    tierOptions += `<option value="${tier}">Tier ${tier}</option>`;
  }
  const selectHTML = `<select id="tierExpand" class="form-select" style="width:8rem; display:inline;" onchange="handleExpandPopUp()">${tierOptions}</select>`;
  Swal.fire({
    title: "Tiers available: " + selectHTML,
    width: window.screen.width * 0.6,
    html: "<div id='expand' class='d-flex justify-content-center align-items-center'></div>",
    allowOutsideClick: false,
    showConfirmButton: false,
    showCloseButton: true,
    didOpen: handleExpandPopUp,
  });
}

function handleExpandPopUp() {
  const expandHTML = document.getElementById("expand");
  const selectedTier = document.getElementById("tierExpand").value;
  let tableContent = "";
  for (let person in tiers[selectedTier]) {
    person = tiers[selectedTier][person];
    if (!person.picked) {
      tableContent += `
    <tr>
      <th class="font-weight-normal">${person.name}</th>
    </tr>
    `;
    }
  }
  let table = `
  <table class="table table-striped" style="max-width: 30rem">
    <thead>
      <tr>
        <th scope="col">Tier ${selectedTier}</th>
      </tr>
    </thead>
    <tbody>
      ${tableContent}
    </tbody>
  </table>`;
  expandHTML.innerHTML = table;
}

function reloadDraft(filter) {
  if (tourney.status !== "ended") {
    fillCurrentTeam();
    fillDraftPlayers();
  }
  loadDraftTeams(filter);
}
