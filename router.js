import { Router } from "express";
import {
  generateQuestions,
  createUser,
  getInterviews,
  submitAnswer,
  totalScore,
} from "./controller.js";

const router = Router();
router.post("/questions", generateQuestions);
router.post("/user", createUser);
router.post("/interviews", getInterviews);
router.post("/submit", submitAnswer);
router.post("/total", totalScore);

export default router;
