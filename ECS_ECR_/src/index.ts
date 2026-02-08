import express, { Request, Response } from "express";
import apiRouter from "./router/route";
const app = express();
app.use(express.json());

app.use("/api", apiRouter)
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

app.get("/pro", (req: Request, res: Response) => {
  res.send("This is the /pro endpoint");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

