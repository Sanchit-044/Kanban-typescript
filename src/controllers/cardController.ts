import { Request, Response } from "express";
import Card, { ICard } from "../models/cards";

export const createCard = async (req: Request, res: Response) => {
  try {
    const { title, description, status, dueDate } = req.body;
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const card: ICard = new Card({
      title,
      description,
      status,
      dueDate,
      owner: req.user._id
    });
    await card.save();
    res.status(201).json(card);
  } catch (err: any) {
    console.error("createCard error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getCards = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const cards: ICard[] = await Card.find({ owner: req.user._id });
    res.json(cards);
  } catch (err: any) {
    console.error("getCards error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateCard = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const card = await Card.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json(card);
  } catch (err: any) {
    console.error("updateCard error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteCard = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const card = await Card.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json({ message: "Card deleted" });
  } catch (err: any) {
    console.error("deleteCard error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
