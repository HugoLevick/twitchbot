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
          const [date, hourData] = t.start.split("T");
          const [hour, minute] = hourData.split(":");
          if (t.name.match(filterRegExp)) {
            //prettier-ignore
            table.innerHTML += `<tr><td>${t.name.length > 15 ? t.name.substring(0, 15) + '...' : t.name}</td><td>${t.entry === 0 ? 'FREE' : `$${t.entry}`}</td><td>${date} ${hour}:${minute}</td><td>${t.prize == '0' ? 'NO' : t.prize}</td><td class="d-flex align-items-center justify-content-center"><button type="button"class="btn btn-sm btn-secondarytext-light btn-outline-secondary fs-6 d-flex align-items-center justify-content-center" onclick="editTourney(${t.id})"><span data-feather="edit"></span>&nbsp;Edit</button>&nbsp;<button type="button"class="btn btn-sm btn-danger text-light fs-6 d-flex align-items-center justify-content-center" onclick="deleteTourney(${t.id})">&nbsp;<span data-feather="trash"></span>&nbsp;</button></td></tr>`;
          }
        });
      } else {
        table.innerHTML = `<tr><td>No tourneys</td><td>FREE</td><td>01/01/2000 00:00</td><td>$200</td><td class="d-flex align-items-center justify-content-center"><button type="button"class="btn btn-sm btn-secondarytext-light btn-outline-secondary fs-6 d-flex align-items-center justify-content-center"><span data-feather="edit"></span>&nbsp;Edit</button></td></tr>`;
      }
      feather.replace({ "aria-hidden": "true" });
    });
}

function newTourney() {
  window.location.replace("/managetourneys/new");
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

function editTourney(id) {
  window.location.replace("/edit/tourney/?id=" + id);
}

function deleteTourney(id) {
  Swal.fire({
    title: `Do you really want to delete this tourney?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("/tourneys/" + id, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((res) => {
          if (res) {
            Swal.fire({
              icon: "success",
              title: "Done!",
              text: "Tourney has been deleted",
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Ooops...",
              text: "Tourney couldn't be deleted",
            });
          }
        });
      reload();
    }
  });
}

function reload(filter) {
  loadTable(filter);
  setNumberOfTourneys();
}

let params = {};
new URL(window.location.href).searchParams.forEach((x, y) => {
  params[y] = x;
});
if (params.success) {
  Swal.fire({
    icon: "success",
    title: "Done!",
    text: "Tourney has been edited",
  });
}

reload();
