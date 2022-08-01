export class Team {
  constructor(name, captain, members, key, checked = false) {
    this.name = name;
    this.captain = captain;
    this.members = members;
    this.in = checked;
    this.key = key;
  }
}

export default class Solo {
  constructor(name) {
    this.name = name;
    this.in = false;
    this.team = 0;
  }
}
