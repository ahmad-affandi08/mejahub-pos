export const currencyFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

export function formatIDR(value) {
    return currencyFormatter.format(Number(value || 0));
}
