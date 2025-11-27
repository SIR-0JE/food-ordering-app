import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/order";
import User from "@/models/user";

type OrderRequestBody = {
  fullName?: string;
  phone?: string;
  items?: unknown[];
  totalAmount?: number;
  extraFee?: number;
  receiptUrl?: string;
  paymentConfirmed?: boolean;
  notes?: string;
};

const buildNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber)) return asNumber;
  }
  return undefined;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderRequestBody;
    const fullName = body.fullName?.trim();
    const phone = body.phone?.trim();
    const items = body.items;
    const totalAmount = buildNumber(body.totalAmount);
    const extraFee = buildNumber(body.extraFee);
    const receiptUrl = body.receiptUrl?.trim();
    const paymentConfirmed =
      typeof body.paymentConfirmed === "boolean" ? body.paymentConfirmed : undefined;
    const notes = body.notes?.trim();

    if (!fullName || !phone) {
      return NextResponse.json(
        { message: "fullName and phone are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "items must be a non-empty array" },
        { status: 400 }
      );
    }

    if (typeof totalAmount !== "number") {
      return NextResponse.json(
        { message: "totalAmount must be a valid number" },
        { status: 400 }
      );
    }

    await connectDB();

    await User.findOneAndUpdate(
      { phone },
      { fullName, phone },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const orderPayload: Record<string, unknown> = {
      fullName,
      phone,
      items,
      totalAmount,
    };

    if (typeof extraFee === "number") orderPayload.extraFee = extraFee;
    if (receiptUrl) orderPayload.receiptUrl = receiptUrl;
    if (typeof paymentConfirmed === "boolean") {
      orderPayload.paymentConfirmed = paymentConfirmed;
    }
    if (notes) orderPayload.notes = notes;

    const order = await Order.create(orderPayload);

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Failed to create order", error);
    return NextResponse.json(
      { message: "Unable to create order. Please try again." },
      { status: 500 }
    );
  }
}


