// const { exec } = require("child_process")
const fs = require("fs");
const path = require("path");

// const p = exec(`mkdir test && cd test && touch a.txt && echo process complete!`);

// p.stdout.on("data", (data) => {
//   console.log(data.toString());
// });

// p.stderr.on("data", (data) => {
//   console.log("err")
//   console.error(data.toString());
// });

// p.on("close", (code) => {
//   console.log(`Process exited with code ${code} hahaha`);
// });



const distDirPath = path.join(__dirname, "node_modules");
const distFolderContents = fs.readdirSync(distDirPath, { recursive: true });

console.log(distFolderContents)