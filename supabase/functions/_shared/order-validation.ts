export type OrderItem = {
  productId: string;
  option: string | null;
  quantity: number;
};

export type CreateOrderBody = {
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    note?: string;
  };
  fulfillment: "Pickup" | "Delivery";
  items: OrderItem[];
};

export function isCreateOrderBody(value: unknown): value is CreateOrderBody {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  const customer = body.customer;
  if (!customer || typeof customer !== "object") return false;
  const fields = customer as Record<string, unknown>;
  if (
    typeof fields.name !== "string" ||
    fields.name.trim().length < 2 ||
    fields.name.length > 120 ||
    typeof fields.email !== "string" ||
    fields.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()) ||
    typeof fields.phone !== "string" ||
    fields.phone.trim().length < 7 ||
    fields.phone.length > 24 ||
    (fields.address !== undefined &&
      (typeof fields.address !== "string" || fields.address.length > 400)) ||
    (fields.note !== undefined &&
      (typeof fields.note !== "string" || fields.note.length > 500))
  ) {
    return false;
  }
  if (
    (body.fulfillment !== "Pickup" && body.fulfillment !== "Delivery") ||
    (body.fulfillment === "Delivery" &&
      (typeof fields.address !== "string" || fields.address.trim().length < 5)) ||
    !Array.isArray(body.items) ||
    body.items.length < 1 ||
    body.items.length > 20
  ) {
    return false;
  }

  return body.items.every((item) => {
    if (!item || typeof item !== "object") return false;
    const line = item as Record<string, unknown>;
    return (
      typeof line.productId === "string" &&
      line.productId.length > 0 &&
      line.productId.length <= 100 &&
      (line.option === null ||
        (typeof line.option === "string" && line.option.length <= 80)) &&
      Number.isInteger(line.quantity) &&
      Number(line.quantity) >= 1 &&
      Number(line.quantity) <= 20
    );
  });
}
