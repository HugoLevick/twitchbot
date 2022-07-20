console.log("Hola");
let table = document.getElementById("checkintable");
table.innerHTML = "";

for (let index = 0; index < 10; index++) {
  table.innerHTML += `<tr><td>Name ${index}</td><td>No</td></tr>`;
}

// const connection = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "root",
// });

// connection.connect((err) => {
//   if (err) throw err;
//   console.log("Connected to database");
//   connection.query(`USE ${bottedChannel};`, (err) => {
//     if (err) {
//       console.log(`Creating database ${bottedChannel}...`);
//       //prettier-ignore
//       connection.query(`CREATE DATABASE ${bottedChannel};`, (err) => {if (err) throw err;});
//       //prettier-ignore
//       connection.query(`USE ${bottedChannel};`, (err) => {if (err) throw err});
//       //prettier-ignore
//       connection.query("CREATE TABLE Commands (command varchar(255), content varchar(512));", (err) => {
//         if (err) throw err;
//       });
//       console.log("Database created!");
//     }

//     console.log(`Using database ${bottedChannel}`);

//     connection.query("SELECT * FROM Commands", (err, result) => {
//       if (err) throw err;
//       result.forEach((comm) => {
//         commands.push(new Command(comm.command, comm.content, comm.type));
//       });
//       actionCommands.forEach((comm) => {
//         commands.push(comm);
//       });
//       console.log("Retrieved the following commands from database", commands);
//     });
//   });
// });
