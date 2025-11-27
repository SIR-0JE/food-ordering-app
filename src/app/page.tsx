"use client";

import { useMemo, useState } from "react";

const EXTRA_FEE = 100;
const BANK_DETAILS = {
  accountName: "Go Chow Foods",
  bank: "GTBank",
  accountNumber: "0123456789",
};

type ItemInput = {
  name: string;
  price: string;
  quantity: string;
};

const emptyItem = (): ItemInput => ({
  name: "",
  price: "",
  quantity: "1",
});

export default function Home() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<ItemInput[]>([emptyItem()]);
  const [receiptData, setReceiptData] = useState<string>();
  const [receiptPreview, setReceiptPreview] = useState<string>();
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({
    type: "idle",
  });
  const [submitting, setSubmitting] = useState(false);

  const itemsTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + price * quantity;
    }, 0);
  }, [items]);

  const grandTotal = useMemo(() => itemsTotal + EXTRA_FEE, [itemsTotal]);

  const updateItemAt = (index: number, key: keyof ItemInput, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleReceiptUpload = (file?: File) => {
    if (!file) {
      setReceiptData(undefined);
      setReceiptPreview(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString();
      setReceiptData(result);
      setReceiptPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setItems([emptyItem()]);
    setReceiptData(undefined);
    setReceiptPreview(undefined);
    setNotes("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "idle" });

    try {
      const filteredItems = items.filter(
        (item) => item.name.trim() && Number(item.price) > 0 && Number(item.quantity) > 0
      );

      if (!fullName.trim() || !phone.trim()) {
        throw new Error("Please enter your full name and phone number.");
      }

      if (filteredItems.length === 0) {
        throw new Error("Add at least one food item with price and quantity.");
      }

      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        items: filteredItems.map((item) => ({
          name: item.name.trim(),
          price: Number(item.price),
          quantity: Number(item.quantity),
        })),
        totalAmount: grandTotal,
        extraFee: EXTRA_FEE,
        receiptUrl: receiptData,
        notes: notes.trim() || undefined,
      };

      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message ?? "Unable to submit order");
      }

      setStatus({ type: "success", message: "Order received! We will confirm payment soon." });
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      setStatus({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 px-4 py-10 font-sans text-slate-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-wide text-amber-600">Go Chow Foods</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Place Your Order</h1>
          <p className="mt-2 text-sm text-slate-500">
            Fill in your details, upload proof of payment, and we’ll start preparing your meal.
          </p>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-lg md:p-10">
          <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                Full Name
                <input
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none ring-amber-500 focus:bg-white focus:ring-2"
                  placeholder="Ada Lovelace"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Phone Number
                <input
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none ring-amber-500 focus:bg-white focus:ring-2"
                  placeholder="0801 234 5678"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                />
              </label>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-slate-900">Food Items</p>
                  <p className="text-sm text-slate-500">Add every meal you want us to prepare.</p>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  + Add Item
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {items.map((item, index) => (
                  <div
                    key={`item-${index}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm sm:p-5"
                  >
                    <div className="grid gap-4 sm:grid-cols-3">
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-amber-500 focus:bg-white focus:ring-2"
                        placeholder="Meal name"
                        value={item.name}
                        onChange={(event) => updateItemAt(index, "name", event.target.value)}
                        required
                      />
                      <input
                        type="number"
                        min="0"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-amber-500 focus:bg-white focus:ring-2"
                        placeholder="Price (₦)"
                        value={item.price}
                        onChange={(event) => updateItemAt(index, "price", event.target.value)}
                        required
                      />
                      <input
                        type="number"
                        min="1"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-amber-500 focus:bg-white focus:ring-2"
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={(event) => updateItemAt(index, "quantity", event.target.value)}
                        required
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="mt-3 text-xs font-semibold text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                Payment Receipt (image or PDF)
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 file:hidden"
                  onChange={(event) => handleReceiptUpload(event.target.files?.[0])}
                />
                {receiptPreview && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold text-slate-500">Preview</p>
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="mt-2 h-40 w-full rounded-xl object-cover"
                    />
                  </div>
                )}
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Notes (optional)
                <textarea
                  className="min-h-[154px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none ring-amber-500 focus:bg-white focus:ring-2"
                  placeholder="Extra spice, dietary info, delivery instructions..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>
            </div>

            <div className="rounded-3xl bg-slate-900 px-5 py-6 text-white sm:px-8">
              <p className="text-sm uppercase tracking-wide text-slate-300">
                Payment Information
              </p>
              <div className="mt-3 flex flex-col gap-2 text-lg font-semibold sm:flex-row sm:items-center sm:gap-6">
                <span>{BANK_DETAILS.accountName}</span>
                <span>{BANK_DETAILS.bank}</span>
                <span className="font-mono text-xl">{BANK_DETAILS.accountNumber}</span>
              </div>
              <div className="mt-5 grid gap-2 text-base">
                <div className="flex items-center justify-between">
                  <span>Items Total</span>
                  <span className="font-semibold">₦{itemsTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-amber-200">
                  <span>Service Fee</span>
                  <span className="font-semibold">₦{EXTRA_FEE.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/20 pt-3 text-xl font-bold">
                  <span>Amount to Pay</span>
                  <span>₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {status.message && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  status.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-amber-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
            >
              {submitting ? "Submitting..." : "Submit Order"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
