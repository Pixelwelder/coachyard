export const toDollars = (cents = 0) => {
  return `$${(cents / 100).toFixed(2)}`;
};
