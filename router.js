import { Router } from "express";
import {
  generateQuestions,
  createUser,
  getInterviews,
  submitAnswer,
  totalScore,
  stats,
  getUsers,
  badge,
} from "./controller.js";

const router = Router();
router.post("/questions", generateQuestions);
router.post("/user", createUser);
router.post("/interviews", getInterviews);
router.post("/submit", submitAnswer);
router.post("/total", totalScore);
router.post("/stats", stats);
router.get("/users", getUsers);
router.post("/badge", badge);

export default router;
