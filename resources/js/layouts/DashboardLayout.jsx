import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
	CircleDollarSign,
	ChevronDown,
	Grid3X3,
	LayoutDashboard,
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
			{ title: "Manajemen Waste", href: "/inventory/manajemen-waste" },
			{ title: "Resep BOM", href: "/inventory/resep-b-o-m" },
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
		items: [{ title: "Laporan Stok", href: "/report/laporan-stok" }],
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

	const [openModules, setOpenModules] = useState(() => {
		const initialState = {};

		moduleItems.forEach((module) => {
			initialState[module.title] = module.items.some((sub) =>
				url.startsWith(sub.href)
			);
		});

		return initialState;
	});

	useEffect(() => {
		setOpenModules((prev) => {
			const next = { ...prev };

			moduleItems.forEach((module) => {
				const isActive = module.items.some((sub) => url.startsWith(sub.href));
				if (isActive) {
					next[module.title] = true;
				}
			});

			return next;
		});
	}, [url]);

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
					<SidebarHeader className="border-b border-white/10 p-3">
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									size="lg"
									className="h-14 rounded-xl bg-white/5 px-3 hover:bg-white/10"
								>
									<Link href="/">
										<Logo
											className="w-full"
											textClassName="text-3xl text-sidebar-foreground"
											iconClassName="h-4 w-4 translate-y-[1px]"
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
								<SidebarMenu className="px-2">
									{moduleItems.map((module) => {
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
													className="rounded-xl px-3 py-2.5 data-[active=true]:bg-white/14 data-[active=true]:text-white hover:bg-white/8"
											>
													<>
														<span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
															<module.icon className="h-4 w-4" />
														</span>
														<span className="font-medium">{module.title}</span>
														<ChevronDown
															className={`ml-auto h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
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

					<SidebarFooter className="border-t border-white/10 bg-black/10 p-3">
						<SidebarMenu className="gap-2">
							<SidebarMenuItem>
								<SidebarMenuButton className="h-11 rounded-xl bg-white/6 px-3 hover:bg-white/12">
									<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-primary/85 text-black">
										<Users className="h-4 w-4" />
									</span>
									<span className="font-medium text-sidebar-foreground">{userName}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<Button
									variant="secondary"
									className="h-10 w-full justify-center rounded-xl bg-white/90 text-slate-900 hover:bg-white"
									onClick={() => router.get("/auth/logout")}
								>
									Logout
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
