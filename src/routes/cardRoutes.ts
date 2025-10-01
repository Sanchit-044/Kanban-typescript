import express, { Router } from "express";
import { createCard, getCards, updateCard, deleteCard } from "../controllers/cardController";
import { auth } from "../middleware/auth";

const router: Router = express.Router();

router.post("/", auth, createCard);
router.get("/", auth, getCards);
router.put("/:id", auth, updateCard);
router.delete("/:id", auth, deleteCard);

export default router;
