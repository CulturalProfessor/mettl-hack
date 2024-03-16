import { Router } from "express";
import { generateQuestions } from "./controller.js";
import { createUser } from "./controller.js";

const router = Router();
router.post("/questions", generateQuestions);
router.post("/user", createUser);

export default router;