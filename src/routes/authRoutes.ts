import express, { Router } from "express";
import { signup, login, logout, me } from "../controllers/authController";
import { auth } from "../middleware/auth";

const router: Router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", auth, logout);
router.get("/me", auth, me);

export default router;
