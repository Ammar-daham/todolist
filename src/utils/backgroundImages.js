// Full-scene background "photos" for the image-based theme presets. These are
// original vector illustrations rather than real photographs — bundling actual
// photos would mean shipping large binary assets (or fetching from an external
// host at runtime, which would break offline and depend on that host staying
// up), so a scene is drawn as an SVG and encoded as a data URI instead. Same
// self-contained approach as backgroundPatterns.js, just full-bleed ("cover")
// instead of tiled.
const IMAGE_BUILDERS = {
	mountains: () =>
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
			<defs>
				<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#ff9a76"/>
					<stop offset="45%" stop-color="#ff6f91"/>
					<stop offset="100%" stop-color="#4a3f6b"/>
				</linearGradient>
			</defs>
			<rect width="800" height="500" fill="url(#sky)"/>
			<circle cx="620" cy="150" r="70" fill="#ffe3b3" opacity="0.9"/>
			<polygon points="0,500 0,320 150,180 260,320 340,230 500,380 620,260 800,400 800,500" fill="#3d2f52"/>
			<polygon points="0,500 0,380 200,260 380,380 560,300 800,420 800,500" fill="#2a2140"/>
		</svg>`,
	horizon: () =>
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
			<defs>
				<linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#8ec5fc"/>
					<stop offset="100%" stop-color="#e0c3fc"/>
				</linearGradient>
				<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#1c5d70"/>
					<stop offset="100%" stop-color="#0f2027"/>
				</linearGradient>
			</defs>
			<rect width="800" height="280" fill="url(#sky2)"/>
			<circle cx="400" cy="270" r="60" fill="#fff6d8" opacity="0.85"/>
			<rect y="280" width="800" height="220" fill="url(#sea)"/>
			<path d="M0 300 Q100 285 200 300 T400 300 T600 300 T800 300" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>
			<path d="M0 340 Q100 325 200 340 T400 340 T600 340 T800 340" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
		</svg>`,
	aurora: () =>
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
			<defs>
				<linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#020617"/>
					<stop offset="100%" stop-color="#0f172a"/>
				</linearGradient>
			</defs>
			<rect width="800" height="500" fill="url(#night)"/>
			<circle cx="120" cy="80" r="1.4" fill="#fff"/>
			<circle cx="300" cy="50" r="1" fill="#fff"/>
			<circle cx="500" cy="90" r="1.6" fill="#fff"/>
			<circle cx="680" cy="60" r="1" fill="#fff"/>
			<circle cx="220" cy="140" r="1" fill="#fff"/>
			<circle cx="740" cy="150" r="1.2" fill="#fff"/>
			<path d="M0 260 Q200 180 400 250 T800 220 L800 500 L0 500 Z" fill="#34d399" opacity="0.18"/>
			<path d="M0 300 Q220 230 440 300 T800 270 L800 500 L0 500 Z" fill="#818cf8" opacity="0.18"/>
			<polygon points="0,500 0,420 200,360 380,430 560,380 800,440 800,500" fill="#111827"/>
		</svg>`,
	dunes: () =>
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
			<defs>
				<linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#f6d365"/>
					<stop offset="100%" stop-color="#fda085"/>
				</linearGradient>
			</defs>
			<rect width="800" height="500" fill="url(#dsky)"/>
			<circle cx="640" cy="130" r="55" fill="#fff4d6" opacity="0.9"/>
			<path d="M0 320 Q160 260 320 320 T640 320 T800 300 L800 500 L0 500 Z" fill="#e08e45"/>
			<path d="M0 380 Q200 330 400 380 T800 360 L800 500 L0 500 Z" fill="#c96f2e"/>
		</svg>`,
}

export function getImageLayer(image) {
	const build = IMAGE_BUILDERS[image]
	if (!build) return { image: 'none' }
	const svg = build().replace(/\s+/g, ' ').trim()
	return { image: `url("data:image/svg+xml,${encodeURIComponent(svg)}")` }
}
