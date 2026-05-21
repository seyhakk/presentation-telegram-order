let _fmt;

function getFormatter() {
  if (!_fmt) {
    _fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  }
  return _fmt;
}

export function formatCurrency(amount) {
  try {
    return getFormatter().format(amount);
  } catch {
    return '$' + (Number(amount) || 0).toFixed(2);
  }
}
