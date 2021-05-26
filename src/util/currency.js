// eslint-disable-next-line import/prefer-default-export
export const toDollars = (cents = 0) => `$${(cents / 100).toFixed(2)}`;

export const getPriceString = (item) => {
  const price = (item.price / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const frequency = item.priceFrequency === 'monthly' ? '/month' : '';
  return `${price}${frequency}`;
};
