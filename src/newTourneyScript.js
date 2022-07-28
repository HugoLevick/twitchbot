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
