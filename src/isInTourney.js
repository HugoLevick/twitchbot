function isInTourney(people, username) {
  let RegExpString = username
    .replace(/\*/i, "\\*")
    .replace(/\./i, "\\.")
    .replace(/\^/i, "\\^")
    .replace(/\$/i, "\\$")
    .replace(/\[/i, "\\[")
    .replace(/\]/i, "\\]");
  console.log(RegExpString);
  let userRegex = new RegExp(`^${RegExpString}$`, "i");
  for (let team in people) {
    let key = team;
    team = people[team];
    let name;
    if (typeof team.name === "number") {
      name = team.name.toString();
    } else if (typeof team.name === "string") {
      name = team.name;
    }
    if (team.captain?.match(userRegex) || name.match(userRegex)) {
      return [true, key];
    }
    if (team.members) {
      for (let m in team.members) {
        m = team.members[m];
        if (m.match(userRegex)) return [true, key];
      }
    }
  }
  return [false, undefined];
}
