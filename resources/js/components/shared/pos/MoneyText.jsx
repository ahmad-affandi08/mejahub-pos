import { formatIDR } from "@/components/shared/pos/format";

export default function MoneyText({ value, className = "" }) {
    return <span className={className}>{formatIDR(value)}</span>;
}
