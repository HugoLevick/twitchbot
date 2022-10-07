const alertPlaceholder = document.getElementById("liveAlertPlaceholder");
let displayingAlert = false;

const alert = (message, type) => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible" role="alert" style="margin-top:2rem; margin: 1rem 1rem 0 1rem;">`,
    `   <div>${message}</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" onclick="closeAlert()"></button>',
    "</div>",
  ].join("");

  alertPlaceholder.append(wrapper);
};

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

setInterval(() => {
  if (!displayingAlert) showAlerts();
}, 5000);

function showAlerts() {
  fetch(`/alerts/`)
    .then((res) => res.json())
    .then(async (alerts) => {
      console.log(alerts);
      if (alerts.length > 0) {
        displayingAlert = true;
        a = alerts[0];
        let audio = new Audio("/sound/pop.mp3");
        audio.volume = 0.05;
        audio.play();
        alert(`<strong>${a.username} says:</strong> ${a.content}`, "success");
      }
    });
}

function closeAlert() {
  fetch(`/alerts/${a.id}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ acknowledged: true }),
  });
  displayingAlert = false;
}

showAlerts();
