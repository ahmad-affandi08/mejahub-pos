"use client";

import { useEffect } from "react";

const FALLBACK_PRIMARY = "#A3E635";
const FALLBACK_SECONDARY = "#334155";

function buildFaviconSvg(primary: string, secondary: string) {
	return `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
			<defs>
				<filter id="mh-shadow" x="-20%" y="-20%" width="140%" height="140%">
					<feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="rgba(0,0,0,0.25)" />
				</filter>
			</defs>

			<g filter="url(#mh-shadow)">
				<rect x="6" y="6" width="52" height="52" rx="14" fill="${secondary}" />
				<path d="M19 45V19L26 31L33 19V45" stroke="white" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" />
				<path d="M37 19V45M49 19V45M37 32H49" stroke="${primary}" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round" />
				<circle cx="50" cy="14" r="3" fill="${primary}" />
			</g>
		</svg>
	`;
}

function upsertFaviconLink(rel: string, href: string) {
	const selector = `link[data-mejahub-favicon=\"${rel}\"]`;
	const existing = document.head.querySelector<HTMLLinkElement>(selector);

	if (existing) {
		existing.href = href;
		return;
	}

	const link = document.createElement("link");
	link.setAttribute("data-mejahub-favicon", rel);
	link.rel = rel;
	link.type = "image/svg+xml";
	link.href = href;
	if (rel === "icon") {
		link.sizes = "any";
	}

	document.head.appendChild(link);
}

export function Favicon() {
	useEffect(() => {
		const updateFavicon = () => {
			const rootStyle = getComputedStyle(document.documentElement);
			const primary = rootStyle.getPropertyValue("--primary").trim() || FALLBACK_PRIMARY;
			const secondary =
				rootStyle.getPropertyValue("--secondary").trim() || FALLBACK_SECONDARY;

			const svg = buildFaviconSvg(primary, secondary);
			const faviconHref = `data:image/svg+xml,${encodeURIComponent(svg)}`;

			upsertFaviconLink("icon", faviconHref);
			upsertFaviconLink("shortcut icon", faviconHref);
		};

		updateFavicon();

		const observer = new MutationObserver(() => {
			updateFavicon();
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class", "style"],
		});

		return () => {
			observer.disconnect();
		};
	}, []);

	return null;
}
