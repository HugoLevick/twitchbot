function select(id) {
  let url = window.location.href;
  url = url.replace("#", "");
  url = url.replace(/\?.*/, "") + "?tourneyId=" + id;
  window.location.href = url;
}
