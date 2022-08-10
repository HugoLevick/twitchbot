async function getChannelName() {
  return await fetch("/current/channel")
    .then((res) => res.json())
    .then((channel) => channel);
}
