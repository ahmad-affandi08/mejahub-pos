import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import {
	CircleDollarSign,
	ChevronDown,
	Grid3X3,
	LayoutDashboard,
	LogOut,
	Package,
	Settings,
	Users,
} from "lucide-react";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { TooltipProvider } from "@/components/ui/tooltip";

const moduleItems = [
	{
		title: "Dashboard",
		icon: LayoutDashboard,
		items: [{ title: "Overview", href: "/dashboard/overview" }],
	},
	{
		title: "Menu",
		icon: Package,
		items: [
			{ title: "Kategori Menu", href: "/menu/kategori-menu" },
			{ title: "Data Menu", href: "/menu/data-menu" },
			{ title: "Varian Menu", href: "/menu/varian-menu" },
			{ title: "Modifier Menu", href: "/menu/modifier-menu" },
			{ title: "Paket Menu", href: "/menu/paket-menu" },
		],
	},
	{
		title: "Meja",
		icon: Grid3X3,
		items: [
			{ title: "Area Meja", href: "/meja/area-meja" },
			{ title: "Data Meja", href: "/meja/data-meja" },
			{ title: "Reservasi Meja", href: "/meja/reservasi-meja" },
		],
	},
	{
		title: "HR",
		icon: Users,
		items: [
			{ title: "Data Pegawai", href: "/hr/data-pegawai" },
			{ title: "Hak Akses", href: "/hr/hak-akses" },
			{ title: "Pengaturan Gaji", href: "/hr/pengaturan-gaji" },
			{ title: "Pengaturan Shift", href: "/hr/pengaturan-shift" },
			{ title: "Jadwal Shift", href: "/hr/jadwal-shift" },
			{ title: "Absensi", href: "/hr/absensi" },
			{ title: "Komisi", href: "/hr/komisi" },
			{ title: "Penggajian", href: "/hr/penggajian" },
		],
	},
	{
		title: "Inventory",
		icon: Package,
		items: [
			{ title: "Supplier", href: "/inventory/supplier" },
			{ title: "Bahan Baku", href: "/inventory/bahan-baku" },
			{ title: "Purchase Order", href: "/inventory/purchase-order" },
			{ title: "Penerimaan Barang", href: "/inventory/penerimaan-barang" },
			{ title: "Opname Stok", href: "/inventory/opname-stok" },
			{ title: "Transfer Stok", href: "/inventory/transfer-stok" },
			{ title: "Mutasi Stok", href: "/inventory/mutasi-stok" },
			{ title: "Manajemen Waste", href: "/inventory/manajemen-waste" },
			{ title: "Resep BOM", href: "/inventory/resep-b-o-m" },
		],
	},
	{
		title: "CRM",
		icon: Users,
		items: [
			{ title: "Data Pelanggan", href: "/crm/data-pelanggan" },
			{ title: "Membership", href: "/crm/membership" },
			{ title: "Poin Loyalty", href: "/crm/poin-loyalty" },
		],
	},
	{
		title: "Kitchen",
		icon: Grid3X3,
		items: [
			{ title: "Tiket Dapur", href: "/kitchen/tiket-dapur" },
			{ title: "Status Masak", href: "/kitchen/status-masak" },
			{ title: "KDS", href: "/kitchen/k-d-s" },
		],
	},
	{
		title: "Finance",
		icon: CircleDollarSign,
		items: [
			{ title: "Arus Kas", href: "/finance/arus-kas" },
			{ title: "Hutang Supplier", href: "/finance/hutang" },
			{ title: "Petty Cash", href: "/finance/petty-cash" },
			{ title: "Pengeluaran", href: "/finance/pengeluaran" },
		],
	},
	{
		title: "POS",
		icon: CircleDollarSign,
		items: [
			{ title: "Buka Shift", href: "/pos/buka-shift" },
			{ title: "Pesanan Masuk", href: "/pos/pesanan-masuk" },
			{ title: "Split Bill", href: "/pos/split-bill" },
			{ title: "Gabung Meja", href: "/pos/gabung-meja" },
			{ title: "Void Pesanan", href: "/pos/void-pesanan" },
			{ title: "Refund Pesanan", href: "/pos/refund-pesanan" },
			{ title: "Pembayaran", href: "/pos/pembayaran" },
			{ title: "Tutup Shift", href: "/pos/tutup-shift" },
		],
	},
	{
		title: "Report",
		icon: Grid3X3,
		items: [
			{ title: "Import Penjualan", href: "/report/import-penjualan" },
			{ title: "Laporan Penjualan", href: "/report/laporan-penjualan" },
			{ title: "Laporan Keuangan", href: "/report/laporan-keuangan" },
			{ title: "Laporan Hutang", href: "/report/laporan-hutang" },
			{ title: "Petty Cash & Biaya", href: "/report/laporan-petty-cash" },
			{ title: "Performa Menu", href: "/report/laporan-performa-menu" },
			{ title: "Laporan Pajak", href: "/report/laporan-pajak" },
			{ title: "Laporan Shift", href: "/report/laporan-shift" },
			{ title: "Laporan Stok", href: "/report/laporan-stok" },
			{ title: "Laporan Waste", href: "/report/laporan-waste" },
			{ title: "Selisih Opname", href: "/report/laporan-opname-selisih" },
			{ title: "Void & Refund", href: "/report/laporan-void-refund" },
			{ title: "Heatmap Transaksi", href: "/report/laporan-heatmap" },
		],
	},
	{
		title: "Settings",
		icon: Settings,
		items: [
			{ title: "Profil Toko", href: "/settings/profil-toko" },
			{ title: "Metode Pembayaran", href: "/settings/metode-pembayaran" },
			{ title: "Konfigurasi Pajak", href: "/settings/konfigurasi-pajak" },
			{ title: "Printer Silent", href: "/settings/printer-silent" },
			{ title: "Recycle Bin", href: "/settings/recycle-bin" },
		],
	},
];

export default function DashboardLayout({ title = "Dashboard", children }) {
	const { url, props } = usePage();
	const userName = props?.auth?.user?.name ?? "Pengguna";
	const hasRoles = props?.auth?.has_roles === true;
	const permissionKeys = Array.isArray(props?.auth?.permission_keys)
		? props.auth.permission_keys
		: [];

	const filteredModuleItems = useMemo(() => {
		const keySet = new Set(permissionKeys);
		const hasWildcard = keySet.has("*");
		const unrestricted = !hasRoles || permissionKeys.length === 0 || hasWildcard;

		const inferPermission = (href) => {
			const segments = String(href || "")
				.split("/")
				.filter(Boolean);

			if (segments.length < 2) {
				return null;
			}

			return `${segments[0]}.${segments[1]}.access`;
		};

		return moduleItems
			.map((module) => {
				const items = (module.items || []).filter((sub) => {
					if (unrestricted) {
						return true;
					}

					const permission = sub.permission ?? inferPermission(sub.href);
					if (!permission) {
						return true;
					}

					return keySet.has(permission);
				});

				return {
					...module,
					items,
				};
			})
			.filter((module) => (module.items || []).length > 0);
	}, [hasRoles, permissionKeys]);

	const [openModules, setOpenModules] = useState(() => {
		const initialState = {};

		filteredModuleItems.forEach((module) => {
			initialState[module.title] = module.items.some((sub) =>
				url.startsWith(sub.href)
			);
		});

		return initialState;
	});

	useEffect(() => {
		setOpenModules((prev) => {
			const next = { ...prev };

			filteredModuleItems.forEach((module) => {
				const isActive = module.items.some((sub) => url.startsWith(sub.href));
				if (isActive) {
					next[module.title] = true;
				}
			});

			return next;
		});
	}, [filteredModuleItems, url]);

	const toggleModule = (title) => {
		setOpenModules((prev) => ({
			...prev,
			[title]: !prev[title],
		}));
	};

	return (
		<TooltipProvider>
			<SidebarProvider className="overflow-x-hidden">
				<Sidebar
					collapsible="icon"
					className="border-r border-white/10"
				>
					<SidebarHeader className="border-b border-white/10 p-3 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:border-none">
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									size="lg"
									className="h-14 rounded-xl bg-white/5 px-3 hover:bg-white/10 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:hover:bg-transparent"
								>
									<Link href="/" className="flex items-center group-data-[collapsible=icon]:justify-center">
										<Logo
											className="w-full group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6"
											textClassName="text-3xl text-sidebar-foreground group-data-[collapsible=icon]:hidden"
											iconClassName="h-4 w-4 translate-y-[1px] group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:translate-y-0"
											accentClassName="text-sidebar-primary"
										/>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarHeader>

					<SidebarContent className="bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_100%)]">
						<SidebarGroup>
							<SidebarGroupLabel className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/65">
								MENU
							</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{filteredModuleItems.map((module) => {
										if (!module.items.length) {
											return null;
										}

										const isModuleActive = module.items.some((sub) =>
											url.startsWith(sub.href)
										);
										const isOpen = !!openModules[module.title];

										return (
											<SidebarMenuItem key={module.title}>
												<SidebarMenuButton
													tooltip={module.title}
													isActive={isModuleActive}
													onClick={() => toggleModule(module.title)}
													className="rounded-xl px-3 py-2.5 data-[active=true]:bg-white/14 data-[active=true]:text-white hover:bg-white/8 group-data-[collapsible=icon]:p-1! group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center"
												>
													<>
														<span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 group-data-[collapsible=icon]:bg-transparent">
															<module.icon className="h-4 w-4 shrink-0" />
														</span>
														<span className="font-medium group-data-[collapsible=icon]:hidden">{module.title}</span>
														<ChevronDown
															className={`ml-auto h-4 w-4 shrink-0 transition-transform group-data-[collapsible=icon]:hidden ${isOpen ? "rotate-180" : ""}`}
														/>
													</>
												</SidebarMenuButton>

												{isOpen ? (
													<SidebarMenuSub className="mt-1 ml-2 space-y-1 border-l border-white/10 pl-3">
														{module.items.map((sub) => (
															<SidebarMenuSubItem key={sub.href}>
																<SidebarMenuSubButton
																	asChild
																	isActive={url.startsWith(sub.href)}
																	className="rounded-lg px-2.5 py-2 text-sidebar-foreground/90 data-[active=true]:bg-white/12 data-[active=true]:text-white"
																>
																	<Link href={sub.href}>
																		<span>{sub.title}</span>
																	</Link>
																</SidebarMenuSubButton>
															</SidebarMenuSubItem>
														))}
													</SidebarMenuSub>
												) : null}
											</SidebarMenuItem>
										);
									})}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>

					<SidebarFooter className="border-t border-white/10 bg-black/10 p-3 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:pb-4">
						<SidebarMenu className="gap-2 group-data-[collapsible=icon]:gap-4">
							<SidebarMenuItem>
								<SidebarMenuButton className="h-11 rounded-xl bg-white/6 px-3 hover:bg-white/12 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
									<span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/85 text-black">
										<Users className="h-4 w-4 shrink-0" />
									</span>
									<span className="font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">{userName}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<Button
									variant="secondary"
									className="h-10 w-full justify-center rounded-xl bg-white/90 text-slate-900 hover:bg-white group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:p-0"
									onClick={() => router.get("/auth/logout")}
									title="Logout"
								>
									<LogOut className="hidden h-4 w-4 group-data-[collapsible=icon]:block" />
									<span className="group-data-[collapsible=icon]:hidden">Logout</span>
								</Button>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarFooter>

					<SidebarRail />
				</Sidebar>

				<SidebarInset className="min-w-0 overflow-x-hidden">
					<header className="flex h-14 items-center gap-2 border-b bg-white/70 px-4 backdrop-blur-sm">
						<SidebarTrigger />
						<h1 className="text-sm font-medium">{title}</h1>
					</header>

					<section className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</section>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	);
}
