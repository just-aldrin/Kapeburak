import { describe, expect, it } from "vitest";
import { isCreateOrderBody } from "../supabase/functions/_shared/order-validation";

const validOrder = {
  customer: {
    name: "Kapeburak Guest",
    email: "guest@example.com",
    phone: "+639123456789",
  },
  fulfillment: "Pickup",
  items: [{ productId: "spanish-latte", option: "Iced", quantity: 2 }],
};

describe("guest order request validation", () => {
  it("accepts a valid pickup order", () => {
    expect(isCreateOrderBody(validOrder)).toBe(true);
  });

  it("requires a delivery address for delivery orders", () => {
    expect(isCreateOrderBody({ ...validOrder, fulfillment: "Delivery" })).toBe(false);
    expect(
      isCreateOrderBody({
        ...validOrder,
        fulfillment: "Delivery",
        customer: { ...validOrder.customer, address: "Iloilo City, Philippines" },
      }),
    ).toBe(true);
  });

  it("rejects invalid quantities and empty carts", () => {
    expect(
      isCreateOrderBody({
        ...validOrder,
        items: [{ productId: "spanish-latte", option: "Iced", quantity: 0 }],
      }),
    ).toBe(false);
    expect(isCreateOrderBody({ ...validOrder, items: [] })).toBe(false);
  });

  it("rejects invalid customer email addresses", () => {
    expect(
      isCreateOrderBody({
        ...validOrder,
        customer: { ...validOrder.customer, email: "not-an-email" },
      }),
    ).toBe(false);
  });
});
