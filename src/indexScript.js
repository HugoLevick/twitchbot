let table = document.getElementById("checkintable");
function loadTable() {
  table.innerHTML = "";
  let checkin = [];
  fetch("/people")
    .then((response) => response.json())
    .then((people) => {
      if (people.length > 0) {
        people.forEach((person) => {
          //prettier-ignore
          table.innerHTML += `<tr><td>${person.username}</td><td>${person.checkin === 1 ? "Yes" : "No"}</td><td class="d-flex align-items-center justify-content-center"><button type="button" class="btn btn-sm btn-danger text-light btn-outline-secondary" onclick="kickPlayer('${
          person.username}')">KICK</button><button type="button" class="btn btn-sm ${person.checkin ? 'btn-secondary' : 'btn-success'} text-light btn-outline-secondary" style="margin-left: 0.5rem; width: 7rem" onclick="${person.checkin === 1 ? `checkOutPlayer('${person.username}')` : `checkInPlayer('${person.username}')`}">${person.checkin === 1 ? 'CHECK OUT' : 'CHECK IN'}</button></td></tr>`;
          checkin.push(person);
        });
      }
    });
}

function kickPlayer(username) {
  Swal.fire({
    title: `Do you really want to kick ${username}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
    denyButtonText: `Don't save`,
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("localhost/people/" + username, {
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

async function checkInPlayer(username) {
  Swal.fire({
    title: `Do you really want to check in ${username}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("localhost/people/checkin/" + username, {
        method: "POST",
      })
        .then((response) => response.json())
        .then((res) => {
          if (res) {
            Swal.fire(username + " has been checked in!", "", "success");
            reload();
          } else {
            Swal.fire("Couldn't check in " + username, "Could have left before being checked in", "error");
            reload();
          }
        });
    }
  });
}

async function checkOutPlayer(username) {
  Swal.fire({
    title: `Do you really want to check out ${username}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("localhost/people/checkout/" + username, {
        method: "POST",
      })
        .then((response) => response.json())
        .then((res) => {
          if (res) {
            Swal.fire(username + " has been checked out!", "", "success");
            reload();
          } else {
            Swal.fire("Couldn't check out " + username, "Could have left before being checked out", "error");
            reload();
          }
        });
    }
  });
}

async function clearList() {
  Swal.fire({
    title: `U sure dawg?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("localhost/people/", {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((res) => {
          if (res) {
            Swal.fire("List cleared", "", "success");
            reload();
          } else {
            Swal.fire("Couldnt clear list", "error");
            reload();
          }
        });
    }
  });
}

async function loadPeople() {
  return await fetch("/people")
    .then((response) => response.json())
    .then((people) => people);
}

async function setNumberOfPeople() {
  let people = await loadPeople();
  let noOfPeople = document.getElementById("noOfPeople");
  let noOfCheckIns = document.getElementById("noOfCheckIns");
  noOfPeople.innerHTML = people.length;
  people = people.filter((person) => person.checkin);
  noOfCheckIns.innerHTML = people.length;
}

function reload() {
  loadTable();
  setNumberOfPeople();
}

reload();
