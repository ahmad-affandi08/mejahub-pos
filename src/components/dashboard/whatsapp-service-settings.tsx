"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  getWhatsAppServiceStatus,
  startWhatsAppService,
  stopWhatsAppService,
} from "@/actions/whatsapp-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BranchItem {
  id: string;
  name: string;
}

interface WhatsAppStatusItem {
  branchId: string;
  status: "DISCONNECTED" | "CONNECTING" | "QR_READY" | "CONNECTED" | "ERROR";
  phoneNumber: string | null;
  jid: string | null;
  qrCodeDataUrl: string | null;
  lastError: string | null;
  updatedAt: string;
}

interface WhatsAppServiceSettingsProps {
  branches: BranchItem[];
  defaultBranchId: string;
}

const statusLabel: Record<WhatsAppStatusItem["status"], string> = {
  DISCONNECTED: "Terputus",
  CONNECTING: "Menyambungkan...",
  QR_READY: "QR Siap Dipindai",
  CONNECTED: "Terhubung",
  ERROR: "Error",
};

function getStatusVariant(status: WhatsAppStatusItem["status"]) {
  if (status === "CONNECTED") return "default" as const;
  if (status === "ERROR") return "destructive" as const;
  return "secondary" as const;
}

export function WhatsAppServiceSettings({
  branches,
  defaultBranchId,
}: WhatsAppServiceSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedBranchId, setSelectedBranchId] = useState(defaultBranchId);
  const [status, setStatus] = useState<WhatsAppStatusItem | null>(null);

  const selectedBranchName = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchId)?.name ?? "-",
    [branches, selectedBranchId]
  );
  const shouldAutoPolling = !status || status.status === "CONNECTING" || status.status === "QR_READY";

  function loadStatus(branchId: string, showErrorToast = true) {
    startTransition(async () => {
      const result = await getWhatsAppServiceStatus({ branchId });
      if (result.success) {
        setStatus(result.data);
      } else if (showErrorToast) {
        toast.error(result.error);
      }
    });
  }

  function handleConnect() {
    startTransition(async () => {
      const result = await startWhatsAppService({ branchId: selectedBranchId });
      if (result.success) {
        setStatus(result.data);
        if (result.data.status === "QR_READY") {
          toast.success("QR login siap. Silakan scan dari WhatsApp.");
        } else if (result.data.status === "CONNECTED") {
          toast.success("WhatsApp sudah terhubung.");
        } else {
          toast.success("Memproses login WhatsApp. Tunggu QR muncul.");
        }
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      const result = await stopWhatsAppService({ branchId: selectedBranchId });
      if (result.success) {
        setStatus(result.data);
        toast.success("WhatsApp service diputuskan.");
      } else {
        toast.error(result.error);
      }
    });
  }

  useEffect(() => {
    if (!selectedBranchId) return;

    loadStatus(selectedBranchId, false);

    if (!shouldAutoPolling) return;

    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      loadStatus(selectedBranchId, false);
    }, 5_000);

    return () => clearInterval(timer);
  }, [selectedBranchId, shouldAutoPolling]);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-1">
          <CardTitle>Service WhatsApp</CardTitle>
          <p className="text-sm text-muted-foreground">
            Klik tombol tampilkan QR, scan dari WhatsApp, lalu struk akan dikirim dari nomor yang login.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">Cabang</p>
            <Select
              value={selectedBranchId}
              onValueChange={(value) => setSelectedBranchId(value ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih cabang" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Status</p>
            <div className="flex h-10 items-center gap-2 rounded-md border px-3">
              <Badge variant={status ? getStatusVariant(status.status) : "secondary"}>
                {status ? statusLabel[status.status] : "Memuat..."}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {selectedBranchName}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {status?.phoneNumber && (
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            Nomor terhubung: <span className="font-semibold">{status.phoneNumber}</span>
          </div>
        )}

        {status?.lastError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {status.lastError}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleConnect}
            disabled={isPending}
          >
            {status?.status === "CONNECTED" ? "Login Ulang (QR Baru)" : "Tampilkan QR Login"}
          </Button>
          <Button
            variant="outline"
            onClick={() => loadStatus(selectedBranchId)}
            disabled={isPending}
          >
            Refresh Status
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            disabled={isPending || status?.status === "DISCONNECTED"}
          >
            Putuskan
          </Button>
        </div>

        {status?.qrCodeDataUrl && status.status === "QR_READY" && (
          <div className="rounded-lg border p-4">
            <p className="mb-3 text-sm font-medium">
              Scan QR ini dari aplikasi WhatsApp pada perangkat yang akan digunakan:
            </p>
            <Image
              src={status.qrCodeDataUrl}
              alt="WhatsApp QR"
              width={256}
              height={256}
              className="mx-auto h-64 w-64 rounded-md border bg-white p-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
