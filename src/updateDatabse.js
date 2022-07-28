import readline from "readline";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Who are you?", (name) => {
  console.log(`Hey there ${name}!`);
  rl.close();
});
