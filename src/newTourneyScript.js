const form = document.querySelector(".needs-validation");
const DateTime = luxon.DateTime;

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

function createTourney() {
  let start = DateTime.fromISO(form.startDate.value);
  let end = DateTime.fromISO(form.endDate.value);
  if (start > end) {
    Swal.fire("Bad Dates", "End date is greater than start date", "error");
    return;
  } else {
    if (form.checkValidity()) form.submit();
    else Swal.fire("Some fields are not valid", "Check your information", "error");
  }
}
