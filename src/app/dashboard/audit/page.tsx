import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getAuditLogs } from "@/actions/audit";
import { AuditLogClient } from "@/components/audit/audit-log-client";

export default async function AuditPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasPermission(session.user.role, "audit:view")) redirect("/dashboard");

  const logs = await getAuditLogs();

  return (
    <AuditLogClient logs={JSON.parse(JSON.stringify(logs))} />
  );
}
