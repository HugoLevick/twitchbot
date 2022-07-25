async function setBannedPeople() {
  fetch("/banned")
    .then((res) => res.json())
    .then((banned) => {
      let noOfBanned = document.getElementById("noOfBanned");
      noOfBanned.innerHTML = banned.length;
    });
}

async function loadTable(filter) {
  const filterRegExp = new RegExp(filter || ".*");
  let table = document.getElementById("bannedtable");
  fetch("/banned")
    .then((response) => response.json())
    .then((people) => {
      if (people.length > 0) {
        table.innerHTML = "";
        people.forEach((person) => {
          if (person.username.match(filterRegExp)) {
            //prettier-ignore
            table.innerHTML += `<tr><td>${person.username}</td><td><button type="button" class="btn btn-sm btn-danger text-light btn-outline-secondary" onclick="unban('${person.username}')">UNBAN</button></td></tr>`;
          }
        });
      } else
        table.innerHTML = `<tr><td>There's no one here</td><td class="d-flex align-items-center justify-content-center"><button type="button" class="btn btn-sm btn-danger text-light btn-outline-secondary">UNBAN</button></td></tr>`;
    });
}

async function unban(username) {
  Swal.fire({
    title: `Do you really want to unban ${username}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("/banned/" + username, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((res) => {
          if (res) {
            Swal.fire(username + " has been unbanned!", "", "success");
            reload();
          } else {
            Swal.fire("Couldn't unban " + username, "I dont know why this happened", "error");
            reload();
          }
        });
    }
  });
}

// NO COMPLETADO
async function clearList() {
  Swal.fire({
    title: `U sure dawg?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("/banned", {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((res) => {
          if (res) {
            Swal.fire("List cleared", "", "success");
            reload();
          } else {
            Swal.fire("Couldnt clear list", "There was an error clearing the list", "error");
            reload();
          }
        });
    }
  });
}

function reload() {
  setBannedPeople();
  loadTable();
}

reload();
