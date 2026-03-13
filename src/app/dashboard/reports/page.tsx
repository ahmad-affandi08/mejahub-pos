import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { formatCurrency } from "@/lib/utils";
import { getReportData, type ReportPreset } from "@/actions/report";

type SearchParams = Promise<{ preset?: string; from?: string; to?: string }>;

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function toneClasses(tone: "good" | "warn" | "info") {
  if (tone === "good") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (tone === "warn") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!hasPermission(session.user.role, "report:view")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const report = await getReportData({
    preset: params.preset,
    from: params.from,
    to: params.to,
  });

  const maxDailyRevenue = Math.max(...report.dailyTrend.map((day) => day.revenue), 1);
  const maxHourlyRevenue = Math.max(...report.hourlyDistribution.map((hour) => hour.revenue), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Laporan Penjualan</h1>
          <p className="text-sm text-muted-foreground">Analisis performa bisnis yang detail untuk keputusan operasional.</p>
        </div>
        <Badge variant="outline" className="text-xs">{report.range.label}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Periode</CardTitle>
          <CardDescription>Pilih preset cepat atau custom date range.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-4">
            <select
              name="preset"
              defaultValue={report.range.preset as ReportPreset}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="today">Hari Ini</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="90d">90 Hari Terakhir</option>
              <option value="mtd">Month to Date</option>
              <option value="ytd">Year to Date</option>
              <option value="custom">Custom</option>
            </select>
            <Input name="from" type="date" defaultValue={report.range.fromIso} />
            <Input name="to" type="date" defaultValue={report.range.toIso} />
            <Button type="submit">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(report.summary.totalRevenue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Subtotal {formatCurrency(report.summary.totalSubtotal)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paid Orders</CardDescription>
            <CardTitle className="text-2xl">{report.summary.paidOrderCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            dari {report.summary.totalOrders} total order
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Order Value</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(report.summary.avgOrderValue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Items terjual {report.summary.itemsSold}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unique Customers</CardDescription>
            <CardTitle className="text-2xl">{report.summary.uniqueCustomerCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Cancellation rate {formatPercent(report.summary.cancellationRate)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.statusBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              report.statusBreakdown.map((status) => (
                <div key={status.status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{status.status}</span>
                    <span className="font-medium">{status.count} ({formatPercent(status.percentage)})</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.min(status.percentage * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.typeBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              report.typeBreakdown.map((type) => (
                <div key={type.type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{type.type}</span>
                    <span className="font-medium">{formatCurrency(type.revenue)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.min(type.percentage * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.paymentBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              report.paymentBreakdown.map((payment) => (
                <div key={payment.method} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{payment.method}</span>
                    <span className="font-medium">{formatCurrency(payment.amount)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.min(payment.percentage * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tren Harian</CardTitle>
            <CardDescription>Pendapatan dan jumlah order per hari.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.dailyTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              report.dailyTrend.map((day) => (
                <div key={day.date} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{day.dateLabel}</span>
                    <span className="font-medium">{day.orderCount} order • {formatCurrency(day.revenue)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.min((day.revenue / maxDailyRevenue) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hourly Distribution</CardTitle>
            <CardDescription>Distribusi performa berdasarkan jam.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
            {report.hourlyDistribution.map((hour) => (
              <div key={hour.hour} className="rounded-md border p-2">
                <p className="text-xs text-muted-foreground">{hour.label}</p>
                <p className="text-sm font-semibold">{hour.orderCount} order</p>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${Math.min((hour.revenue / maxHourlyRevenue) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Produk dengan kontribusi revenue terbesar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              report.topProducts.map((product) => (
                <div key={product.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{formatPercent(product.contribution)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product.quantity} item • {product.orderCount} order
                  </p>
                  <p className="text-sm font-semibold">{formatCurrency(product.revenue)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>Kontribusi category terhadap revenue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.categoryPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              report.categoryPerformance.map((category) => (
                <div key={category.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{category.name}</span>
                    <span className="font-medium">{formatCurrency(category.revenue)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.min(category.contribution * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Staff Performance</CardTitle>
            <CardDescription>Performa kasir/staff berdasarkan revenue.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2">Nama</th>
                    <th className="py-2">Order</th>
                    <th className="py-2">AOV</th>
                    <th className="py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {report.staffPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-3 text-center text-muted-foreground">Belum ada data.</td>
                    </tr>
                  ) : (
                    report.staffPerformance.map((staff) => (
                      <tr key={staff.id} className="border-b last:border-0">
                        <td className="py-2 pr-2 font-medium">{staff.name}</td>
                        <td className="py-2 pr-2">{staff.orderCount}</td>
                        <td className="py-2 pr-2">{formatCurrency(staff.averageOrder)}</td>
                        <td className="py-2 pr-2 font-semibold">{formatCurrency(staff.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Table Utilization (Dine In)</CardTitle>
            <CardDescription>Meja dengan penggunaan tertinggi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.tableUtilization.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data dine in.</p>
            ) : (
              report.tableUtilization.map((table) => (
                <div key={table.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-medium">{table.label}</p>
                    <p className="text-muted-foreground">{table.orderCount} order</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(table.revenue)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insight Otomatis</CardTitle>
          <CardDescription>Point-point penting dari data periode ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {report.insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada insight karena data masih minim.</p>
          ) : (
            report.insights.map((insight, index) => (
              <div key={`${insight.title}-${index}`} className={`rounded-md border p-3 ${toneClasses(insight.tone)}`}>
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className="text-sm">{insight.description}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Discount</CardDescription>
            <CardTitle>{formatCurrency(report.summary.totalDiscount)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tax</CardDescription>
            <CardTitle>{formatCurrency(report.summary.totalTax)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Service</CardDescription>
            <CardTitle>{formatCurrency(report.summary.totalService)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
