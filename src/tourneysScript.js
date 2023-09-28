let table = document.getElementById("checkintable");

function loadTable(filter) {
  const filterRegExp = new RegExp(filter || ".*", "i");
  fetch("/tourneys")
    .then((response) => response.json())
    .then((tourneys) => {
      //Setting the number of Tourneys
      let noOfTourneys = document.getElementById("noOfTourneys");
      noOfTourneys.innerHTML = tourneys.length;
      //Setting the table
      table.innerHTML = "";
      if (tourneys.length > 0) {
        tourneys.forEach((t) => {
          const [date, hourData] = t.start.split("T");
          const [hour, minute] = hourData.split(":");
          if (t.name.match(filterRegExp)) {
            let html = "";
            html += `<tr><td>${t.name.length > 15 ? t.name.substring(0, 15) + "..." : t.name}</td>`; //Name
            html += `<td>${t.entry == "0" ? "FREE" : `$${t.entry}`}</td>`; //Entry
            html += `<td>${date} ${hour}:${minute}</td>`; //Date
            html += `<td>${t.prize == "0" ? "NO" : t.prize}</td>`; //Prize
            html += `<td>${t.status === "inprogress" ? "IN PROGRESS" : t.status.toUpperCase()}</td>`; //Status
            html += `<td class="d-flex align-items-center justify-content-center">`; //Buttons

            html += `<button type="button"class="btn btn-sm btn-secondarytext-light btn-outline-secondary fs-6 d-flex align-items-center justify-content-center" onclick="editTourney(${t.id})"><span data-feather="edit"></span>&nbsp;Edit</button>&nbsp;`; //Edit

            if (t.status !== "ended") {
              html += `<button type="button"class="btn btn-sm btn-dark fs-6 d-flex align-items-center justify-content-center" onclick="createBracket(${t.id})"><img src="/tourneys/challonge-logo.svg" style="width:24px; height: 24px">&nbsp;Create Bracket</button>&nbsp;`; //Create Bracket
            } else {
              html += `<button type="button"class="btn btn-sm btn-success fs-6 d-flex align-items-center justify-content-center" onclick="redirect('/teams?tourneyId=${t.id}')"><span data-feather="search"></span>&nbsp;See Teams</button>&nbsp;`; //See Teams
            }

            html += t.link
              ? `<button type="button"class="btn btn-sm btn-secondarytext-light btn-outline-secondary fs-6 d-flex align-items-center justify-content-center" onclick="window.open('${t.link}')"><span data-feather="eye"></span>&nbsp;Bracket</button>&nbsp;`
              : ""; //See bracket
            html += `<button type="button"class="btn btn-sm btn-danger text-light fs-6 d-flex align-items-center justify-content-center" onclick="deleteTourney(${t.id})">&nbsp;<span data-feather="trash"></span>&nbsp;</button></td></tr>`; //Delete
            table.innerHTML += html;
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
}

function redirect(url) {
  window.location.href = url;
}

async function createBracket(tourneyId) {
  let challongeData = await checkChallongeTokenValidity();
  if (!challongeData) return;

  if (!challongeData.challongeToken) {
    Swal.fire({
      icon: "error",
      title: "Whoops!",
      text: "You need to log into Challonge first!",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: "Log In",
    }).then((result) => {
      if (result.isConfirmed)
        redirect(
          "https://api.challonge.com/oauth/authorize?scope=me%20tournaments:read%20tournaments:write%20participants:write%20participants:read&client_id=bdde3fb0a08a807b58fd73f603780a4457cd14702cba051cce75b84ab5944eb4&redirect_uri=http://localhost:3000/challonge_auth&response_type=code"
        ); //Get Access Code
    });
  } else {
    Swal.fire({
      title: "Customize Bracket",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: "Create",
      html: `
        <form id="bracketData">
          <div class="form-check">
            <input class="form-check-input" type="radio" name="eliminationType" value="single elimination" id="singleElimRadio" checked>
            <label class="form-check-label" for="singleElimRadio">
              Single Elimination
            </label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" name="eliminationType" value="double elimination" id="doubleElimRadio">
            <label class="form-check-label" for="doubleElimRadio">
              Double Elimination
            </label>
          </div>
        </form>
      `,
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      const [tournament] = await fetch("/tourneys/" + tourneyId).then((res) => res.json());
      const bracketForm = document.getElementById("bracketData");
      const url = tournament.name.replace(/[^a-zA-Z0-9_ ]/g, "").replace(/ /g, "_"); //Only allows numbers and letters and _

      Swal.fire({
        title: "Creating your bracket...",
        allowEscapeKey: false,
        allowOutsideClick: false,
        didOpen: () => {
          swal.showLoading();
        },
      });

      var headersChallongeRequest = new Headers();
      headersChallongeRequest.append("Authorization-Type", "v2");
      headersChallongeRequest.append("Content-Type", "application/vnd.api+json");
      headersChallongeRequest.append("Accept", "application/json");
      headersChallongeRequest.append("Authorization", `Bearer ${challongeData.challongeToken}`);

      var raw = JSON.stringify({
        data: {
          type: "tournaments",
          attributes: {
            name: tournament.name,
            tournament_type: bracketForm.eliminationType.value,
            url,
          },
        },
      });

      var requestOptions = {
        method: "POST",
        headers: headersChallongeRequest,
        body: raw,
        redirect: "follow",
      };

      challongeData = await checkChallongeTokenValidity(challongeData);
      if (!challongeData) return;
      fetch("https://api.challonge.com/v2/tournaments.json", requestOptions)
        .then(async (response) => {
          const ok = response.ok;
          response = await response.json();

          if (ok) return response;
          else {
            let error;
            if (response.errors.length) [error] = response.errors;
            else error = [response.errors];

            console.log({ status: "error creating tournament", error });
            if (error.source?.pointer === "/data/attributes/url") {
              throw new Error("A tournament in Challonge already has that name, try editing it.");
            }
            throw new Error("There was a problem creating the tournament.");
          }
        })
        .then(async (result) => {
          const numberOfTeams = Object.keys(tournament.people.teams ?? {});
          if (numberOfTeams.length > 0) {
            //Add teams participating
            const participants = [];
            const teamIds = Object.keys(tournament.people.teams);
            const teams = tournament.people.teams;

            let seed = 1;
            for (const teamId of teamIds) {
              const currentTeam = teams[teamId];
              const text = `(${currentTeam.name}) - ${currentTeam.members.join(" / ")}`;
              participants.push({
                name: text,
                seed,
              });
              seed++;
            }

            let raw = JSON.stringify({
              data: {
                type: "Participant",
                attributes: {
                  participants,
                },
              },
            });

            let requestOptions = {
              method: "POST",
              headers: headersChallongeRequest,
              body: raw,
              redirect: "follow",
            };

            challongeData = await checkChallongeTokenValidity(challongeData);
            if (!challongeData) return;
            await fetch(`https://api.challonge.com/v2/tournaments/${url}/participants/bulk_add.json`, requestOptions)
              .then(async (response) => {
                if (!response.ok) {
                  console.log(participants);
                  console.log(await response.json());
                  throw new Error("Couldn't add participants");
                }
              })
              .catch((error) => {
                throw error;
              });
          }

          await fetch(`/tourneys/${tourneyId}/link`, {
            method: "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ link: result.data.attributes.fullChallongeUrl }),
          });
          reload();
          Swal.fire("Done!", "Bracket created succesfully", "success");
          window.open(result.data.attributes.fullChallongeUrl);
        })
        .catch((error) => {
          Swal.fire("Error", error.message, "error");
        });
    });
  }
}

async function checkChallongeTokenValidity(challongeData) {
  if (!challongeData)
    challongeData = {
      challongeToken: localStorage.getItem("challongeToken"),
      challongeExpires: parseInt(localStorage.getItem("challongeExpires")),
      challongeRefresh: localStorage.getItem("challongeRefresh"),
    };

  //Unix timestamp needs to be in miliseconds to compare to Date.now
  if (challongeData.challongeExpires.toString().length == 10) {
    challongeData.challongeExpires += "000";
    localStorage.setItem("challongeExpires", challongeData.challongeExpires);
    challongeData.challongeExpires = parseInt(challongeData.challongeExpires);
  }

  //If token expired, get new one
  if (Date.now() > challongeData.challongeExpires) {
    console.log("refresh");
    var formdata = new FormData();
    formdata.append("refresh_token", challongeData.challongeRefresh);
    formdata.append("client_id", "bdde3fb0a08a807b58fd73f603780a4457cd14702cba051cce75b84ab5944eb4");
    formdata.append("grant_type", "refresh_token");
    formdata.append("redirect_uri", "http://localhost:3000/challonge_auth");

    var requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow",
    };

    await fetch("https://api.challonge.com/oauth/token", requestOptions)
      .then(async (response) => {
        if (response.status == 200) return response.json();
        else {
          throw new Error("Couldn't refresh your account login, please link your Challonge account again. " + (await response.text()));
        }
      })
      .then((result) => {
        localStorage.setItem("challongeToken", result.access_token);
        localStorage.setItem("challongeRefresh", result.refresh_token);
        //Unix timestamp needs to be in miliseconds to compare to Date.now
        const expires_at = (result.created_at + result.expires_in) * 1000;
        localStorage.setItem("challongeExpires", expires_at);

        challongeData = {
          challongeToken: result.access_token,
          challongeExpires: expires_at,
          challongeRefresh: result.refresh_token,
        };
      })
      .catch((error) => {
        localStorage.removeItem("challongeToken");
        localStorage.removeItem("challongeRefresh");
        localStorage.removeItem("challongeExpires");

        Swal.fire("Error with Challonge", "Could not authenticate your Challonge account, please log in again", "error").then(
          () => (window.location.href = "/managetourneys")
        );
        return null;
      });
  }
  //Return token data, if it was changed it will return the new data
  return challongeData;
}

let params = {};
new URL(window.location.href).searchParams.forEach((x, y) => {
  params[y] = x;
});
if (params.message) {
  Swal.fire({
    icon: "success",
    title: "Done!",
    text: params.message,
  });
}

if (params.error) {
  Swal.fire({
    icon: "error",
    title: "Whoops!",
    text: params.error,
  });
}

reload();
