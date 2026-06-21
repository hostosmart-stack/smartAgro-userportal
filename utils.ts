export const formatStock = (stock: number): number => {
  return Math.round(stock * 1000) / 1000;
};
