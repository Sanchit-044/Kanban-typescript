import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICard extends Document {
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  dueDate?: Date;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const cardSchema: Schema<ICard> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    dueDate: { type: Date },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Card: Model<ICard> = mongoose.model<ICard>("Card", cardSchema);
export default Card;
