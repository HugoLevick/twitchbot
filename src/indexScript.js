let table = document.getElementById("checkintable");

function loadTable(filter) {
  const filterRegExp = new RegExp(filter || ".*", "i");
  let checkin = [];
  fetch("/people")
    .then((response) => response.json())
    .then((people) => {
      table.innerHTML = "";
      if (people.length > 0) {
        people.forEach((person) => {
          if (person.username.match(filterRegExp)) {
            //prettier-ignore
            table.innerHTML += `<tr><td>${person.username}</td><td>${person.checkin === 1 ? "Yes" : "No"}</td><td class="d-flex align-items-center justify-content-center"><button type="button" class="btn btn-sm btn-danger text-light btn-outline-secondary fs-6" style="width: 5rem;"onclick="kickPlayer('${person.username}')"><span data-feather="user-x"></span>&nbsp;KICK</button><button type="button" class="btn btn-sm ${person.checkin ? 'btn-secondary' : 'btn-success'} text-light btn-outline-secondary fs-6" style="margin-left: 0.5rem; width: 8rem" onclick="${person.checkin === 1 ? `checkOutPlayer('${person.username}')` : `checkInPlayer('${person.username}')`}">${person.checkin === 1 ? '<span data-feather="user-minus"></span>&nbsp;CHECK OUT' : '<span data-feather="user-check"></span>&nbsp;CHECK IN'}</button><button type="button" class="btn btn-sm btn-secondary text-light btn-outline-secondary fs-6" style="margin-left: 0.5rem; width: 5rem;" onclick="ban('${person.username}')"><span data-feather="slash"></span>&nbsp;BAN</button></td></tr>`;
            checkin.push(person);
          }
        });
        feather.replace({ "aria-hidden": "true" });
      } else {
        table.innerHTML = `<tr><td>There's no one here</td><td>...</td><td class="d-flex align-items-center justify-content-center"><button type="button" class="btn btn-sm btn-danger text-light btn-outline-secondary">WHOOPS</button></td></tr>`;
      }
    });
}

function kickPlayer(username) {
  Swal.fire({
    title: `Do you really want to kick ${username}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("/people/" + username, {
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
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("/people/" + username, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ checkin: true }),
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
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("/people/" + username, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ checkin: false }),
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

async function ban(username) {
  Swal.fire({
    title: `Do you really want to ban ${username}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("/people/" + username, {
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

async function addPerson() {
  Swal.fire({
    title: "What's the username?",
    html: "<input id='addPerson' type='text'/>",
    showCloseButton: true,
    showCancelButton: true,
  }).then((result) => {
    if (result.isConfirmed) {
      const username = document.getElementById("addPerson").value;
      fetch("/people", {
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
            Swal.fire("Person added", "", "success");
            reload();
          } else {
            Swal.fire("Couldn't add person", "They might be already in the tourney", "error");
            reload();
          }
        });
    }
  });
}

async function clearList() {
  Swal.fire({
    title: `Do you really want to clear the list?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("/people", {
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

function reload(filter) {
  loadTable(filter);
  setNumberOfPeople();
}

reload();
