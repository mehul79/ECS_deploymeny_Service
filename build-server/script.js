const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const redis = require("ioredis");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const dotenv = require("dotenv");

dotenv.config();

const PROJECT_ID = process.env.PROJECT_ID;
const publisher = new redis(process.env.REDIS);

function publishLog(log) {
  publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify(log));
}

const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

async function init() {
  console.log("Executing script.js");
  publishLog(`Build Started....`);
  const outDirPath = path.join(__dirname, "output");

  const p = exec(`cd ${outDirPath} && npm install && npm run build`);
  p.stdout.on("data", (data) => {
    publishLog(data.toString());
    console.log(data.toString());
  });

  p.stderr.on("data", (data) => {
    publishLog(`error: `, data.toString());
    console.error(data.toString());
  });

  p.on("close", async (code) => {
    console.log("Build completed");
    publishLog("Build completed");
    console.log(`Process exited with code ${code}`);

    const distDirPath = path.join(__dirname, "output", "dist");
    const distFolderContents = fs.readdirSync(distDirPath, { recursive: true });

    for (const filePath of distFolderContents) {
      const absolutePath = path.join(distDirPath, filePath);

      if (fs.lstatSync(absolutePath).isDirectory()) continue;
      
      console.log(`Uploading ${filePath} to S3...`);
      publishLog(`Uploading ${filePath} to S3...`);
      
      const command = new PutObjectCommand({
        Bucket: "vercel-prod-bucket",
        Key: `__outputs/${PROJECT_ID}/${filePath}`,
        Body: fs.createReadStream(absolutePath),
        ContentType: mime.lookup(filePath),
      });

      try {
        await s3.send(command);
        console.log(`Uploaded ${filePath} to S3 successfully.`);
        publishLog(`Uploaded ${filePath} to S3 successfully.`);
      } catch (err) {
        console.error(`Error uploading ${filePath}:`, err);
      }
    }
    
    publishLog("Deployment: Your project is live at " + `http://${PROJECT_ID}.localhost:8000`);
    console.log("Closing resources...");
    console.log("Done!");
    process.exit(0)
  });
}

init();

