import { cn } from "@/lib/utils";

export default function MobileLayout({
	header,
	children,
	footer,
	className,
}) {
	return (
		<div className="min-h-screen bg-primary-foreground/40">
			<div className="mx-auto w-full max-w-96 overflow-hidden bg-[#f6f3ee]">
				<div className="relative">
					<div className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,rgba(74,22,143,0.16),rgba(74,22,143,0))]" />
					<div className="pointer-events-none absolute -right-14 top-1/3 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,126,69,0.14),rgba(255,126,69,0))]" />
					<div className="relative z-10 flex min-h-screen max-h-230 flex-col">
						<header className="px-0 py-0">
							{header}
						</header>

						<main className={cn("flex-1 overflow-y-auto px-4 py-4", className)}>
							{children}
						</main>

						<footer className="border-t border-[#ece8e1] bg-[#f2eff8] px-3 py-2">
							{footer}
						</footer>
					</div>
				</div>
			</div>
		</div>
	);
}
