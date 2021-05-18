// eslint-disable-next-line import/prefer-default-export
export const toDollars = (cents = 0) => `$${(cents / 100).toFixed(2)}`;
