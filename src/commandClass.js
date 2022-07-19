export default class Command {
  //prettier-ignore
  constructor(trigger, content, type, action = (ctx) => {doTextCommand(ctx, content);}) {
    this.trigger = trigger,
    this.content = content,
    this.type = type,
    this.action = action
  }
}
