import { Router } from "express";
import { generateQuestions } from "./controller.js";
import { createUser } from "./controller.js";

const router = Router();
router.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the Mixtral API" });
});
router.post("/questions", generateQuestions);
router.post("/user", createUser);

export default router;