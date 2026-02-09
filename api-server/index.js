const express = require("express");
const { generateSlug } = require("random-word-slugs");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const cors = require("cors");
const dotenv = require("dotenv")

dotenv.config()

const app = express();
app.use(cors({
  origin: "*",
}));

const ecs_client = new ECSClient(
  { region: "ap-south-1" },
  {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },
);

const config = {
  cluster: process.env.CLUSTER,
  task: process.env.TASK
}

app.use(express.json());

app.post("/project", async(req, res) => {
  const { gitURL, slug } = req.body;
  const projectSlug = slug ? slug : generateSlug()

  console.log("spin ecs container");
  const command = new RunTaskCommand({
    cluster: config.cluster,
    taskDefinition: config.task,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: [""],
        securityGroups: [""],
        assignPublicIp: "ENABLED",
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: "docker-image",
          environment: [
            { name: "GIT_REPOSITORY__URL", value: gitURL },
            { name: "PROJECT_ID", value: projectSlug },
          ],
        },
      ],
    },
  });

  await ecs_client.send(command)
    .then(() => {
      res.json({ status: "queued", data: {projectSlug, url: `http://${projectSlug}.localhost:8000`} });
    })
    .catch((err) => {
      console.error("Error running ECS task:", err);
      res.status(500).json({ error: "Failed to start project" });
    });
  
});

const PORT = 9000;
app.listen(PORT, () => {
  console.log(`API Server is running on port ${PORT}`);
});
