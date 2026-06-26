import { Schema } from "../../../dist/index.js";

export interface Member {
  _id?: string;
  email: string;
  name?: string;
  verified?: boolean;
  visits?: number;
  note?: string;
}

export const memberSchema = new Schema<Member>(
  {
    _id: { type: String },
    email: { type: String, unique: true },
    name: { type: String, unique: true },
    verified: { type: Boolean, default: false },
    visits: { type: Number, default: 0 },
    note: { type: String },
  },
);