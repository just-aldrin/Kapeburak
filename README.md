# KAPEBURAK Coffee Storefront

A refined, responsive recreation of the KAPEBURAK coffee shop storefront for Iloilo City. The experience keeps the original Philippine coffee identity while adding a clearer editorial layout, product discovery, cart interactions, and a validated client-side checkout flow.

## Included

- Responsive homepage with KAPEBURAK story, featured Spanish Latte, Philippine coffee origin messaging, location, and hours.
- Product catalog for coffee, pastries, bottled brews, pantry beans, and café goods.
- Working category filters, keyword search, and cycleable featured/price sorting.
- Product detail modal with options and add-to-bag action.
- Persistent localStorage cart with quantity controls, remove actions, subtotal, pickup/delivery selection, and Iloilo delivery fee.
- Validated checkout form with pickup/delivery fields, review state, and order confirmation.
- Mobile navigation, accessible labels, keyboard-friendly controls, hover/focus states, and responsive layouts.

## Development

```bash
pnpm install
pnpm dev:static
```

The preview uses port `3000` by default. Run `pnpm check` for TypeScript diagnostics and `pnpm build:static` for a production static build.

The generated coffee photography is referenced through the project’s managed `/manus-storage/` asset paths so the managed preview can serve it without bundling large binary files into the repository.
