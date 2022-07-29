let params = {};
new URL(window.location.href).searchParams.forEach((x, y) => {
  params[y] = x;
});

const form = document.querySelector(".needs-validation");

fetch("/tourneys/" + params.id)
  .then((res) => res.json())
  .then(([tourney]) => {
    form.tourneyName.innerHTML = tourney.name;
    form.startDate.value = tourney.start.replace(/:[0-9][0-9].[0-9][0-9][0-9]Z/, "");
    form.endDate.value = tourney.finish.replace(/:[0-9][0-9].[0-9][0-9][0-9]Z/, "");
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
    form.selectedMode.value = tourney.mode;
    form.tourneyLink.value = tourney.link;
    form.action = "/tourneys/" + params.id;
    form.id.value = params.id;
    console.log(form.action);
  });

function cancelEdit() {
  window.location.replace("/managetourneys/");
}

function confirmEdit() {
  console.log("hola");
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
