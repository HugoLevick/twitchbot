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
  constructor(name, key = name) {
    this.name = name;
    this.in = false;
    this.members = [name];
    this.key = key;
  }
}

export class Draft {
  constructor(name, tier = 0, key) {
    this.name = name;
    this.in = false;
    this.tier = tier;
    this.picked = false;
    this.key = key;
  }
}
