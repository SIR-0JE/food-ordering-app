import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongoose";
import Order from "@/models/order";

type Params = {
  params: { id: string };
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();

    const update: Record<string, unknown> = {};
    if (typeof body.paymentConfirmed === "boolean") {
      update.paymentConfirmed = body.paymentConfirmed;
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ message: "No valid fields provided" }, { status: 400 });
    }

    const order = await Order.findByIdAndUpdate(id, update, { new: true });

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("Failed to update order", error);
    return NextResponse.json(
      { message: "Unable to update order. Please try again." },
      { status: 500 }
    );
  }
}


