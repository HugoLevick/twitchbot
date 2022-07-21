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
          table.innerHTML += `<tr><td>${person.username}</td><td>${person.checkin === 1 ? "Yes" : "No"}</td><td>
                    <button type="button" class="btn btn-sm btn-danger text-light btn-outline-secondary" onclick="kickPlayer('${person.username}')">KICK</button></td></tr>`;
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
            loadTable();
          } else {
            Swal.fire("Couldn't kick " + username, "Could have left before being kicked", "error");
            loadTable();
          }
        });
    }
  });
}

loadTable();
