interface Props {
  amount: number;
  currency?: string;
}

export function CurrencyDisplay({ amount, currency = 'GBP' }: Props) {
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
  return <span>{formatted}</span>;
}
