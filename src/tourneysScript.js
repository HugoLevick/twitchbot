let table = document.getElementById("checkintable");

function loadTable(filter) {
  const filterRegExp = new RegExp(filter || ".*", "i");
  fetch("/tourneys")
    .then((response) => response.json())
    .then((tourneys) => {
      console.log(tourneys);
      table.innerHTML = "";
      if (tourneys.length > 0) {
        tourneys.forEach((t) => {
          if (t.name.match(filterRegExp)) {
            //prettier-ignore
            table.innerHTML += `<tr><td>${t.name}</td><td>${t.entry === 0 ? 'FREE' : t.entry}</td><td>${t.start}</td><td>${t.prize}</td><td class="d-flex align-items-center justify-content-center"><button type="button"class="btn btn-sm btn-secondarytext-light btn-outline-secondary fs-6 d-flex align-items-center justify-content-center" onclick="editTourney(${t.id})"><span data-feather="edit"></span>&nbsp;Edit</button></td></tr>`;
          }
        });
      } else {
        table.innerHTML = `<tr><td>No tourneys</td><td>FREE</td><td>01/01/2000 00:00</td><td>$200</td><td class="d-flex align-items-center justify-content-center"><button type="button"class="btn btn-sm btn-secondarytext-light btn-outline-secondary fs-6 d-flex align-items-center justify-content-center"><span data-feather="edit"></span>&nbsp;Edit</button></td></tr>`;
      }
      feather.replace({ "aria-hidden": "true" });
    });
}

function newTourney() {
  window.location.replace("new");
}

async function loadTourneys() {
  return await fetch("/tourneys")
    .then((response) => response.json())
    .then((tourneys) => tourneys);
}

async function setNumberOfTourneys() {
  let tourneys = await loadTourneys();
  let noOfTourneys = document.getElementById("noOfTourneys");
  noOfTourneys.innerHTML = tourneys.length;
}

function reload(filter) {
  loadTable(filter);
  setNumberOfTourneys();
}

reload();
