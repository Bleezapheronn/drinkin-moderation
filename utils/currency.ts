export function formatCurrency(value: number) {
  const roundedValue = Math.round(value * 100) / 100;
  const hasDecimals = !Number.isInteger(roundedValue);
  const amount = hasDecimals ? roundedValue.toFixed(2) : roundedValue.toFixed(0);
  const [wholeAmount, decimalAmount] = amount.split(".");
  const formattedWholeAmount = wholeAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `KES ${decimalAmount ? `${formattedWholeAmount}.${decimalAmount}` : formattedWholeAmount}`;
}
