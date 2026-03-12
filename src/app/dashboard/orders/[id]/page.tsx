import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getOrderById } from "@/actions/order";
import { OrderDetail } from "@/components/pos/order-detail";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return <OrderDetail order={JSON.parse(JSON.stringify(order))} />;
}
