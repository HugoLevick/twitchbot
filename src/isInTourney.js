function isInTourney(people, username) {
  let userRegex = new RegExp(`^${username}$`);
  for (let team in people) {
    let key = team;
    team = people[team];
    let name, members;
    if (team.members) {
      members = team.members.filter((m) => m !== undefined && m !== null);
      members = members.join(" ");
    } else members = "";
    if (typeof team.name === "number") {
      name = team.name.toString();
    } else if (typeof team.name === "string") {
      name = team.name;
    }
    if (team.captain?.match(userRegex) || name.match(userRegex) || members.match(userRegex)) {
      return [true, key];
    }
  }
  return [false, undefined];
}
