const { exec } = require("child_process");
const path = require("path");
const fs = require("fs")
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const mime = require("mime-types");

const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },     
})

const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
  console.log("Executing script.js");
  const outDirPath = path.join(__dirname, "output");
  
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
      const absolutePath = path.join(distDirPath, filePath);
      
      if (fs.lstatSync(absolutePath).isDirectory()) continue;
      else {
          const command = new PutObjectCommand({
            Bucket: "vercel-prod-bucket",
            Key: `__outputs/${PROJECT_ID}/${filePath}`,
            Body: fs.createReadStream(absolutePath),
            ContentType: mime.lookup(filePath)
          });
          
          try {
            await s3.send(command);
            console.log(`Uploaded ${filePath} to S3 successfully.`);
          } catch (err) {
            console.error(`Error uploading ${filePath}:`, err);
          }
        }
    }
    
    console.log("Done!")
    
  });
}

init();