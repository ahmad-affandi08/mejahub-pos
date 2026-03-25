import { Link, router, usePage } from "@inertiajs/react";
import {
	CircleDollarSign,
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
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

const navItems = [
	{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ title: "Menu", href: "/menu/kategori-menu", icon: Package },
	{ title: "HR", href: "/hr/data-pegawai", icon: Users },
	{ title: "Hak Akses", href: "/hr/hak-akses", icon: Settings },
	{ title: "POS", href: "/pos/pesanan-masuk", icon: CircleDollarSign },
	{ title: "Settings", href: "/settings/profil-toko", icon: Settings },
];

export default function DashboardLayout({ title = "Dashboard", children }) {
	const { url, props } = usePage();
	const userName = props?.auth?.user?.name ?? "Pengguna";

	return (
		<TooltipProvider>
			<SidebarProvider>
				<Sidebar collapsible="icon">
					<SidebarHeader>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href="/">
										<LayoutDashboard />
										<span>Mejahub POS</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarHeader>

					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>Navigasi</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{navItems.map((item) => (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												asChild
												tooltip={item.title}
												isActive={url.startsWith(item.href)}
											>
												<Link href={item.href}>
													<item.icon />
													<span>{item.title}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>

					<SidebarFooter>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton>
									<Users />
									<span>{userName}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<Button
									variant="ghost"
									className="w-full justify-start"
									onClick={() => router.delete("/auth/login/1")}
								>
									Logout
								</Button>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarFooter>

					<SidebarRail />
				</Sidebar>

				<SidebarInset>
					<header className="flex h-14 items-center gap-2 border-b px-4">
						<SidebarTrigger />
						<h1 className="text-sm font-medium">{title}</h1>
					</header>

					<section className="flex-1 p-4 md:p-6">{children}</section>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	);
}
