export const toDollars = (cents = 0) => `$${(cents / 100).toFixed(2)}`;
