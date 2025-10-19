import express from "express";
import auth from "../middleware/auth.js";
import { recordMood, getMoodsByChild } from "../controllers/moodController.js";

const router = express.Router();

router.post("/record", auth, recordMood);
router.get("/:childId", auth, getMoodsByChild);

export default router;
