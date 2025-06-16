export function formatNumber(
  num: number | string | null | undefined,
  decimals: number = 1,
  forceDecimals: boolean = false
): string {
  if (num === null || num === undefined || num === "") return "0";

  const number = typeof num === "string" ? parseFloat(num) : num;

  if (isNaN(number)) return "0";
  if (number === 0) return "0";

  const isNegative = number < 0;
  const absNumber = Math.abs(number);

  const suffixes = [
    { value: 1e63, suffix: "Vigintillion" },
    { value: 1e60, suffix: "Novemdecillion" },
    { value: 1e57, suffix: "Octodecillion" },
    { value: 1e54, suffix: "Septendecillion" },
    { value: 1e51, suffix: "Sexdecillion" },
    { value: 1e48, suffix: "Quindecillion" },
    { value: 1e45, suffix: "Quattuordecillion" },
    { value: 1e42, suffix: "Tredecillion" },
    { value: 1e39, suffix: "Duodecillion" },
    { value: 1e36, suffix: "Undecillion" },
    { value: 1e33, suffix: "Decillion" },
    { value: 1e30, suffix: "Nonillion" },
    { value: 1e27, suffix: "Octillion" },
    { value: 1e24, suffix: "Septillion" },
    { value: 1e21, suffix: "Sextillion" },
    { value: 1e18, suffix: "Quintillion" },
    { value: 1e15, suffix: "Quadrillion" },
    { value: 1e12, suffix: "T" },
    { value: 1e9, suffix: "B" },
    { value: 1e6, suffix: "M" },
    { value: 1e3, suffix: "K" },
  ];

  for (const { value, suffix } of suffixes) {
    if (absNumber >= value) {
      const formattedNum = absNumber / value;

      let result: string;
      if (forceDecimals || formattedNum % 1 !== 0) {
        result = formattedNum.toFixed(decimals);
        if (!forceDecimals) {
          result = parseFloat(result).toString();
        }
      } else {
        result = Math.floor(formattedNum).toString();
      }

      return `${isNegative ? "-" : ""}${result} ${suffix}`;
    }
  }

  if (absNumber >= 1) {
    const result = forceDecimals
      ? absNumber.toFixed(decimals)
      : absNumber % 1 === 0
        ? absNumber.toString()
        : absNumber.toFixed(decimals);
    return `${isNegative ? "-" : ""}${result}`;
  }

  if (absNumber < 0.01) {
    return number.toExponential(2);
  }

  return `${isNegative ? "-" : ""}${absNumber.toFixed(decimals)}`;
}

export function formatCurrency(
  num: number | string,
  currency: string = "$",
  decimals: number = 1
): string {
  const formatted = formatNumber(num, decimals);
  return `${currency}${formatted}`;
}

export function formatPercentage(
  num: number | string,
  decimals: number = 1
): string {
  const formatted = formatNumber(num, decimals);
  return `${formatted}%`;
}
