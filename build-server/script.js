const { exec } = require("child_process");
const path = require("path");
const fs = require("fs")
const { S3Client, PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const mime = require("mime-types");

const S3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },     
})

const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
  console.log("Executing script.js");
  const outDirPath = path.join(__dirname, "out");
  
  const p = exec(`cd ${outDirPath} && npm install && npm run build`);
  p.stdout.on("data", (data) => {
    console.log(data.toString());
  });
  
  p.stderr.on("data", (data) => {
    console.error(data.toString());
  });
  
  p.on("close", async(code) => {
    console.log("Build completed");
    console.log(`Process exited with code ${code}`);
    
    const distDirPath = path.join(__dirname, "output", "dist");
    const distFolderContents = fs.readdirSync(distDirPath, { recursive: true });
    
    for (const filePath of distFolderContents) {
      if (fs.lstatSync(filePath).isDirectory()) continue;
      else {
          const command = new PutObjectCommand({
            Bucket: "",
            Key: `__outputs/${PROJECT_ID}/${filePath}`,
            Body: fs.createReadStream(filePath),
            ContentType: mime.lookup(filePath)
          });
          
          try {
            await S3Client.send(command);
            console.log(`Uploaded ${filePath} to S3 successfully.`);
          } catch (err) {
            console.error(`Error uploading ${filePath}:`, err);
          }
        }
    }
    
  });
}