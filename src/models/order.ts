import { Model, Schema, Types, model, models } from "mongoose";

export interface OrderDocument {
  fullName: string;
  phone: string;
  items: Types.Array<unknown>;
  totalAmount: number;
  extraFee?: number;
  receiptUrl?: string;
  paymentConfirmed?: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderSchema = new Schema<OrderDocument>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    items: {
      type: [Schema.Types.Mixed],
      required: true,
      validate: {
        validator: (value: unknown[]) => Array.isArray(value) && value.length > 0,
        message: "Items cannot be empty",
      },
    },
    totalAmount: { type: Number, required: true },
    extraFee: { type: Number, default: 100 },
    receiptUrl: { type: String },
    paymentConfirmed: { type: Boolean, default: false },
    notes: { type: String },
  },
  { timestamps: true }
);

const OrderModel: Model<OrderDocument> =
  (models.Order as Model<OrderDocument>) || model<OrderDocument>("Order", OrderSchema);

export default OrderModel;


