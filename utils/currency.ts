import type { CurrencyCode } from "../context/settings";

export function formatCurrency(value: number, currency: CurrencyCode = "KES") {
  const roundedValue = Math.round(value * 100) / 100;
  const hasDecimals = !Number.isInteger(roundedValue);
  const amount = hasDecimals ? roundedValue.toFixed(2) : roundedValue.toFixed(0);
  const [wholeAmount, decimalAmount] = amount.split(".");
  const formattedWholeAmount = wholeAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formattedAmount = decimalAmount
    ? `${formattedWholeAmount}.${decimalAmount}`
    : formattedWholeAmount;

  return currency === "USD" ? `$${formattedAmount}` : `KES ${formattedAmount}`;
}
