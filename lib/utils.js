import { clsx } from "clsx";

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

export function formatNumber(num) {
  return new Intl.NumberFormat("en-PH").format(num);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

// Simple linear regression for forecasting
export function linearRegression(data) {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0 };

  const sumX = data.reduce((acc, _, i) => acc + i, 0);
  const sumY = data.reduce((acc, val) => acc + val, 0);
  const sumXY = data.reduce((acc, val, i) => acc + i * val, 0);
  const sumX2 = data.reduce((acc, _, i) => acc + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

export function forecastValue(regression, step) {
  return regression.slope * step + regression.intercept;
}

export function getRoleColor(role) {
  const colors = {
    admin: "bg-jollibee-red text-white",
    manager: "bg-jollibee-orange text-white",
    cashier: "bg-jollibee-yellow text-jollibee-brown",
  };
  return colors[role] || "bg-gray-100 text-gray-700";
}

export function getRoleBadge(role) {
  const labels = {
    admin: "Admin",
    manager: "Manager",
    cashier: "Cashier",
  };
  return labels[role] || role;
}
