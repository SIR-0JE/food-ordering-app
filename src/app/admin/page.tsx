"use client";

import { useEffect, useMemo, useState } from "react";

type OrderRecord = {
  _id: string;
  fullName: string;
  phone: string;
  items: Array<{ name?: string; price?: number; quantity?: number }>;
  totalAmount: number;
  extraFee?: number;
  receiptUrl?: string;
  paymentConfirmed: boolean;
  createdAt: string;
  notes?: string;
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string>();
  const [error, setError] = useState<string>();

  const pendingOrders = useMemo(
    () => orders.filter((order) => !order.paymentConfirmed).length,
    [orders]
  );

  const fetchOrders = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message ?? "Unable to fetch orders");
      }
      const data = (await response.json()) as { orders: OrderRecord[] };
      setOrders(data.orders ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (id: string) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentConfirmed: true }),
      });
      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message ?? "Unable to update order");
      }

      const { order } = (await response.json()) as { order: OrderRecord };
      setOrders((prev) => prev.map((item) => (item._id === id ? order : item)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setUpdatingId(undefined);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white sm:p-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 shadow-xl sm:p-10">
          <p className="text-sm uppercase tracking-[0.4em] text-amber-400">Admin</p>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold sm:text-4xl">Orders Dashboard</h1>
              <p className="mt-1 text-slate-300">
                Monitor new payments, confirm receipts, and keep the kitchen in sync.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchOrders}
              className="rounded-full bg-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white backdrop-blur transition hover:bg-white/20"
            >
              Refresh
            </button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Total Orders" value={orders.length.toString()} />
            <StatCard label="Pending Confirmations" value={pendingOrders.toString()} />
            <StatCard
              label="Confirmed Payments"
              value={(orders.length - pendingOrders).toString()}
            />
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-50">
            {error}
          </div>
        )}

        <section className="rounded-3xl bg-white/5 p-4 shadow-inner sm:p-6">
          {loading ? (
            <p className="text-center text-slate-300">Loading latest orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-slate-300">No orders yet.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {orders.map((order) => (
                <article
                  key={order._id}
                  className="rounded-3xl border border-white/10 bg-slate-900/40 p-5 shadow"
                >
                  <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
                    <p className="text-sm uppercase tracking-wide text-amber-300">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <h2 className="text-2xl font-semibold">{order.fullName}</h2>
                    <p className="text-sm text-slate-300">{order.phone}</p>
                    <span
                      className={`mt-2 w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        order.paymentConfirmed ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-100"
                      }`}
                    >
                      {order.paymentConfirmed ? "Payment Confirmed" : "Awaiting Confirmation"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 text-sm text-slate-200">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Items</p>
                      <ul className="mt-2 space-y-2">
                        {order.items?.map((item, index) => (
                          <li
                            key={`${order._id}-item-${index}`}
                            className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2"
                          >
                            <span className="font-medium">{item.name ?? "Item"}</span>
                            <span className="text-xs text-slate-300">
                              ₦{Number(item.price ?? 0).toLocaleString()} × {item.quantity ?? 1}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl bg-white/5 px-3 py-2 text-base font-semibold">
                      Total: ₦{Number(order.totalAmount ?? 0).toLocaleString()}
                    </div>

                    {order.receiptUrl && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Receipt</p>
                        <img
                          src={order.receiptUrl}
                          alt="Payment receipt"
                          className="h-48 w-full rounded-2xl border border-white/10 object-cover"
                        />
                      </div>
                    )}
                    {order.notes && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Notes</p>
                        <p className="mt-1 rounded-2xl bg-white/5 p-3 text-sm text-slate-200">
                          {order.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={order.paymentConfirmed || updatingId === order._id}
                    onClick={() => markAsPaid(order._id)}
                    className="mt-4 w-full rounded-full bg-emerald-500 py-3 text-center text-sm font-semibold uppercase tracking-wide text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-900 disabled:text-emerald-400"
                  >
                    {order.paymentConfirmed
                      ? "Already Confirmed"
                      : updatingId === order._id
                        ? "Updating..."
                        : "Mark As Paid"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}


