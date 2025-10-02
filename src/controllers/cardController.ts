import { Request, Response } from "express";
import mongoose from "mongoose";
import Card, { ICard } from "../models/cards";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const createCard = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Unauthorized", 401);

  const { title, description, status, dueDate } = req.body;

  const card: ICard = new Card({
    title,
    description,
    status,
    dueDate,
    owner: req.user._id,
  });

  await card.save();
  res.status(201).json({ message: "Card created", card });
});

export const getCards = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Unauthorized", 401);

  const cards: ICard[] = await Card.find({ owner: req.user._id });
  res.json(cards);
});

export const updateCard = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Unauthorized", 401);

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid card ID", 400);
  }

  const card = await Card.findOneAndUpdate(
    { _id: id, owner: req.user._id },
    req.body,
    { new: true }
  );

  if (!card) throw new AppError("Card not found or not yours", 404);

  res.json(card);
});

export const deleteCard = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Unauthorized", 401);

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid card ID", 400);
  }

  const card = await Card.findOneAndDelete({ _id: id, owner: req.user._id });
  if (!card) throw new AppError("Card not found or not yours", 404);

  res.json({ message: "Card deleted" });
});
