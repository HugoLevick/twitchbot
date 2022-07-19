export default class ViewersQueue {
  constructor() {
    this.queue = [];
  }

  addViewer(viewer) {
    this.queue.push(viewer);
    return true;
  }

  nextViewer() {
    return this.queue.pop();
  }

  deleteViewer(viewer) {
    viewer = viewer.replace("@", "");
    let deleted = false;
    this.queue.forEach((element, index) => {
      if (element.match(new RegExp(viewer, "i"))) {
        this.queue.splice(index, 1);
        deleted = true;
      }
    });
    return deleted;
  }

  isInQueue(viewer) {
    let inQueue = false;
    this.queue.forEach((element) => {
      if (element === viewer) inQueue = true;
    });
    return inQueue;
  }

  clearViewers() {
    this.queue = [];
    return true;
  }

  get viewers() {
    return this.queue;
  }

  get length() {
    return this.queue.length;
  }
}
