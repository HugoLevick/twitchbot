let params = {};
let tourney;
let previous = {};
new URL(window.location.href).searchParams.forEach((x, y) => {
  params[y] = x;
});
const DateTime = luxon.DateTime;

const form = document.querySelector(".needs-validation");
const randomized = document.getElementById("randomized");
const mode = document.getElementById("selectMode");

fetch("/tourneys/" + params.id)
  .then((res) => res.json())
  .then(([t]) => {
    tourney = t;
    form.tourneyName.innerHTML = tourney.name;
    form.startDate.value = tourney.start.replace(/:[0-9][0-9].[0-9][0-9][0-9]-[0-9][0-9]:[0-9][0-9]/, "");
    form.endDate.value = tourney.finish.replace(/:[0-9][0-9].[0-9][0-9][0-9]-[0-9][0-9]:[0-9][0-9]/, "");
    if (tourney.prize === "no") {
      form.tourneyPrize.value = 0;
    } else {
      [form.tourneyPrize.value, form.radiosPrize.value] = tourney.prize.split(" ");
    }
    form.entryFee.value = tourney.entry ?? 0;
    if (tourney.entry === 0) {
      form.entryFee.disabled = true;
      form.freeEntry.checked = true;
    }
    form.randomized.checked = tourney.randomized;
    previous.randomized = tourney.randomized;
    form.selectedMode.value = tourney.mode;
    previous.mode = tourney.mode;
    form.tourneyLink.value = tourney.link;
    form.action = "/tourneys/" + params.id;
    form.id.value = params.id;
  });

function cancelEdit() {
  window.location.replace("/managetourneys/");
}

function confirmEdit() {
  let start = DateTime.fromISO(form.startDate.value);
  let end = DateTime.fromISO(form.endDate.value);
  if (start > end) {
    Swal.fire("Bad Dates", "End date is greater than start date", "error");
    return;
  }
  if (previous.randomized != form.randomized.checked || previous.mode !== form.selectedMode.value) {
    Swal.fire({
      title: "Warning",
      text: "These changes will erase the current people signed up, continue?",
      icon: "question",
      showConfirmButton: true,
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        form._resetPeople.value = "1";
        if (form.checkValidity()) form.submit();
        else Swal.fire("Some fields are not valid", "Check your information", "error");
      }
    });
  } else {
    if (form.checkValidity()) form.submit();
    else Swal.fire("Some fields are not valid", "Check your information", "error");
  }
}

function handleChange(value) {
  const span = document.getElementById("basic-addon1");
  let desc;
  switch (value) {
    case "dollars":
      desc = "$";
      break;
    case "in-game":
      desc = "RB";
      break;
    default:
      desc = "?";
  }

  span.innerHTML = desc;
}

function toggleEntry(checked) {
  const inputEntry = document.getElementById("entryFee");
  if (checked) {
    inputEntry.disabled = true;
    inputEntry.value = 0;
  } else {
    inputEntry.disabled = false;
    inputEntry.value = 1;
  }
}
