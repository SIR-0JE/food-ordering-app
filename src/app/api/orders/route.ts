import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongoose";
import Order from "@/models/order";
import User from "@/models/user";

type OrderItemInput = {
  name?: string;
  price?: number;
  quantity?: number;
};

type CreateOrderBody = {
  fullName?: string;
  phone?: string;
  items?: OrderItemInput[];
  totalAmount?: number;
  extraFee?: number;
  receiptUrl?: string;
  paymentConfirmed?: boolean;
  notes?: string;
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOrderBody;
    const fullName = body.fullName?.trim();
    const phone = body.phone?.trim();
    const items = body.items ?? [];
    const totalAmount = toNumber(body.totalAmount);
    const extraFee = toNumber(body.extraFee);
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

    const sanitizedItems = items.map((item) => ({
      name: item.name?.trim() ?? "Item",
      price: toNumber(item.price) ?? 0,
      quantity: toNumber(item.quantity) ?? 1,
    }));

    const order = await Order.create({
      fullName,
      phone,
      items: sanitizedItems,
      totalAmount,
      extraFee,
      receiptUrl,
      paymentConfirmed,
      notes,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Failed to create order", error);
    return NextResponse.json(
      { message: "Unable to create order. Please try again." },
      { status: 500 }
    );
  }
}


