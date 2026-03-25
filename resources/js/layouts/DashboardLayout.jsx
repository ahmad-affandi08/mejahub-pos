import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
	CircleDollarSign,
	ChevronDown,
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
		items: [{ title: "Kategori Menu", href: "/menu/kategori-menu" }],
	},
	{
		title: "HR",
		icon: Users,
		items: [
			{ title: "Data Pegawai", href: "/hr/data-pegawai" },
			{ title: "Hak Akses", href: "/hr/hak-akses" },
		],
	},
	{
		title: "POS",
		icon: CircleDollarSign,
		items: [],
	},
	{
		title: "Settings",
		icon: Settings,
		items: [],
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
				<Sidebar collapsible="icon">
					<SidebarHeader>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild size="lg">
									<Link href="/">
										<Logo
											className="w-full"
											textClassName="text-4xl text-sidebar-foreground"
											iconClassName="h-4 w-4"
											accentClassName="text-sidebar-primary"
										/>
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
											>
													<>
														<module.icon />
														<span>{module.title}</span>
														<ChevronDown
															className={`ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`}
														/>
													</>
											</SidebarMenuButton>

												{isOpen ? (
													<SidebarMenuSub>
														{module.items.map((sub) => (
															<SidebarMenuSubItem key={sub.href}>
																<SidebarMenuSubButton
																	asChild
																	isActive={url.startsWith(sub.href)}
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

				<SidebarInset className="min-w-0 overflow-x-hidden">
					<header className="flex h-14 items-center gap-2 border-b px-4">
						<SidebarTrigger />
						<h1 className="text-sm font-medium">{title}</h1>
					</header>

					<section className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</section>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	);
}
