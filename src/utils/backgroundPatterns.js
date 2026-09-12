// Small tiled SVG "wallpaper" textures layered under the page's gradient
// background, encoded as data URIs so themes stay self-contained — no
// external images to fetch or large blobs to store. Kept low-opacity so
// they read as subtle texture rather than compete with the card in front.
const PATTERN_BUILDERS = {
	waves: () => ({
		width: 140,
		height: 46,
		svg: '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="46"><path d="M0 23 Q 17.5 3 35 23 T 70 23 T 105 23 T 140 23" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="2"/></svg>',
	}),
	blobs: () => ({
		width: 220,
		height: 220,
		svg: '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><circle cx="55" cy="66" r="26" fill="rgba(255,255,255,0.08)"/><circle cx="154" cy="143" r="35" fill="rgba(255,255,255,0.06)"/></svg>',
	}),
	dots: () => ({
		width: 28,
		height: 28,
		svg: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="1.6" fill="rgba(255,255,255,0.2)"/></svg>',
	}),
	grid: () => ({
		width: 44,
		height: 44,
		svg: '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><path d="M0 44 L44 0" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/></svg>',
	}),
	stars: () => ({
		width: 160,
		height: 160,
		svg: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><circle cx="16" cy="24" r="1.2" fill="rgba(255,255,255,0.55)"/><circle cx="80" cy="96" r="1" fill="rgba(255,255,255,0.35)"/><circle cx="128" cy="40" r="1.5" fill="rgba(255,255,255,0.45)"/><circle cx="48" cy="128" r="1" fill="rgba(255,255,255,0.3)"/></svg>',
	}),
}

export function getPatternLayer(pattern) {
	const build = PATTERN_BUILDERS[pattern]
	if (!build) return { image: 'none', size: 'auto' }
	const { svg, width, height } = build()
	return { image: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, size: `${width}px ${height}px` }
}
