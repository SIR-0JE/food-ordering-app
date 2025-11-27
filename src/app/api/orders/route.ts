import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/order";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch orders", error);
    return NextResponse.json(
      { message: "Unable to fetch orders. Please try again." },
      { status: 500 }
    );
  }
}


