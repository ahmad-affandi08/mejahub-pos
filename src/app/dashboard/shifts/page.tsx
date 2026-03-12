import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveShift, getShiftHistory } from "@/actions/shift";
import { ShiftClient } from "@/components/shift/shift-client";

export default async function ShiftsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [activeShift, shiftHistory] = await Promise.all([
    getActiveShift(),
    getShiftHistory(),
  ]);

  return (
    <ShiftClient
      activeShift={activeShift ? JSON.parse(JSON.stringify(activeShift)) : null}
      shiftHistory={JSON.parse(JSON.stringify(shiftHistory))}
      userName={session.user.name || ""}
    />
  );
}
