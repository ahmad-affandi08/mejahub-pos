import { Link, usePage } from "@inertiajs/react";

import { Logo } from "@/components/ui/logo";

export default function POSLayout({ title = "POS", children }) {
	const { props } = usePage();
	const userName = props?.auth?.user?.name ?? "Kasir";

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffedd5_28%,#f8fafc_60%)] text-slate-900">
			<header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
				<div className="mx-auto flex h-16 w-full max-w-400 items-center justify-between px-4 md:px-6">
					<div className="flex items-center gap-3">
						<Link href="/dashboard/overview" className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">
							<Logo iconClassName="h-3.5 w-3.5" textClassName="text-2xl" />
						</Link>
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Cashier Mode</p>
							<h1 className="text-sm font-semibold md:text-base">{title}</h1>
						</div>
					</div>

					<div className="text-right">
						<p className="text-xs text-slate-500">Kasir Aktif</p>
						<p className="text-sm font-semibold text-slate-800">{userName}</p>
					</div>
				</div>
			</header>

			<main className="mx-auto w-full max-w-400 p-4 md:p-6">{children}</main>
		</div>
	);
}
