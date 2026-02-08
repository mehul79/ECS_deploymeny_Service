import { Router } from "express";

const router = Router();

// Define your routes here
router.get("/health", (req, res) => {
  throw new Error("Intentional error for testing error handling");  
  res.status(200).json({ status: "OK", message: "Server is healthy" }); 
});



export default router;