"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, Search, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  oldData: unknown;
  newData: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; name: string; role: string };
  branch: { id: string; name: string } | null;
}

const actionVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
  VOID_ORDER: "destructive",
  VOID_ITEM: "destructive",
  REFUND: "outline",
  SHIFT_OPEN: "default",
  SHIFT_CLOSE: "secondary",
  LOGIN: "default",
  LOGOUT: "outline",
};

export function AuditLogClient({ logs }: { logs: AuditLogItem[] }) {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");
  const [entity, setEntity] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const entities = useMemo(
    () => Array.from(new Set(logs.map((log) => log.entity))).sort(),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const query = search.toLowerCase();

    return logs.filter((log) => {
      const matchesSearch =
        !query ||
        log.entity.toLowerCase().includes(query) ||
        log.user.name.toLowerCase().includes(query) ||
        (log.entityId || "").toLowerCase().includes(query) ||
        JSON.stringify(log.newData || "").toLowerCase().includes(query);

      const matchesAction = action === "ALL" || log.action === action;
      const matchesEntity = entity === "ALL" || log.entity === entity;

      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [action, entity, logs, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">
          Jejak aktivitas penting sistem dan perubahan data kritis.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Log</p>
              <p className="text-2xl font-bold">{logs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Aksi Unik</p>
            <p className="text-2xl font-bold">
              {new Set(logs.map((log) => log.action)).size}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Entity Unik</p>
            <p className="text-2xl font-bold">
              {new Set(logs.map((log) => log.entity)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Audit</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari user, entity, payload..."
              className="pl-9"
            />
          </div>
          <Select value={action} onValueChange={(value) => value && setAction(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua aksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua aksi</SelectItem>
              {Array.from(new Set(logs.map((log) => log.action))).map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entity} onValueChange={(value) => value && setEntity(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua entity</SelectItem>
              {entities.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="text-right">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(new Date(log.createdAt))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionVariant[log.action] || "outline"}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.entity}</p>
                      {log.entityId && (
                        <p className="text-xs text-muted-foreground">{log.entityId}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.user.name}</p>
                      <p className="text-xs text-muted-foreground">{log.user.role}</p>
                    </div>
                  </TableCell>
                  <TableCell>{log.branch?.name || "Global"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.ipAddress || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> Lihat
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Tidak ada audit log yang cocok.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detail Audit Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Aksi</p>
                  <Badge variant={actionVariant[selectedLog.action] || "outline"}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Entity</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.entity} {selectedLog.entityId ? `(${selectedLog.entityId})` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">User</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.user.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">User Agent</p>
                  <p className="text-xs text-muted-foreground break-all">
                    {selectedLog.userAgent || "-"}
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="mb-2 text-sm font-medium">Old Data</p>
                  <ScrollArea className="h-48 rounded-md border p-3">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.oldData, null, 2) || "-"}
                    </pre>
                  </ScrollArea>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">New Data</p>
                  <ScrollArea className="h-48 rounded-md border p-3">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.newData, null, 2) || "-"}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
