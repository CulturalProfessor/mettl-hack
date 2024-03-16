import { Router } from "express";
import { generateQuestions, createUser, getInterviews } from "./controller.js";

const router = Router();
router.post("/questions", generateQuestions);
router.post("/user", createUser);
router.post("/interviews", getInterviews);

export default router;
