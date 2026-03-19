import type { APIRoute, GetStaticPaths } from 'astro'
import { getCollection } from 'astro:content'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

const SITE_LABEL = 'logs.ishanbagchi.com'
const AUTHOR = 'Ishan Bagchi'

const fontCache = new Map<number, ArrayBuffer>()

async function loadFont(weight: 400 | 600): Promise<ArrayBuffer> {
	if (fontCache.has(weight)) return fontCache.get(weight)!

	const css = await fetch(
		`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`,
		{
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
			},
		},
	).then((r) => r.text())

	const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)
	if (!match)
		throw new Error(
			`Font URL not found in Google Fonts CSS for weight ${weight}`,
		)

	const data = await fetch(match[1]).then((r) => r.arrayBuffer())
	fontCache.set(weight, data)
	return data
}

export const getStaticPaths: GetStaticPaths = async () => {
	const posts = await getCollection('blog', ({ data }) => !data.draft)
	return posts.map((post) => {
		const slug = post.id.replace(/\.(md|mdx)$/, '').replace(/\/index$/, '')
		return {
			params: { slug },
			props: {
				title: post.data.title,
				description: post.data.description,
				tags: post.data.tags ?? [],
			},
		}
	})
}

export const GET: APIRoute = async ({ props }) => {
	const { title, description, tags } = props as {
		title: string
		description: string
		tags: string[]
	}

	const [regular, semibold] = await Promise.all([
		loadFont(400),
		loadFont(600),
	])

	const tagPills = tags.slice(0, 4).map((tag) => ({
		type: 'div',
		props: {
			style: {
				display: 'flex',
				padding: '4px 14px',
				border: '1px solid #30363d',
				borderRadius: '9999px',
				fontSize: '15px',
				color: '#8b949e',
			},
			children: tag,
		},
	}))

	const topSection = {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				flexDirection: 'column',
				gap: '28px',
			},
			children: [
				...(tags.length > 0
					? [
							{
								type: 'div',
								props: {
									style: {
										display: 'flex',
										flexDirection: 'row',
										gap: '10px',
									},
									children: tagPills,
								},
							},
						]
					: []),
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							fontSize: '52px',
							fontWeight: 600,
							color: '#e6edf3',
							lineHeight: 1.2,
						},
						children: title,
					},
				},
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							fontSize: '22px',
							color: '#8b949e',
							lineHeight: 1.5,
							maxWidth: '900px',
						},
						children: description,
					},
				},
			],
		},
	}

	const bottomSection = {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				flexDirection: 'row',
				justifyContent: 'space-between',
				alignItems: 'center',
				borderTop: '1px solid #21262d',
				paddingTop: '24px',
			},
			children: [
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							fontSize: '18px',
							fontWeight: 600,
							color: '#e6edf3',
						},
						children: AUTHOR,
					},
				},
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							fontSize: '16px',
							color: '#58a6ff',
						},
						children: SITE_LABEL,
					},
				},
			],
		},
	}

	const element = {
		type: 'div',
		props: {
			style: {
				width: '1200px',
				height: '630px',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				padding: '64px 72px',
				backgroundColor: '#0d1117',
				fontFamily: 'Inter',
			},
			children: [topSection, bottomSection],
		},
	}

	const svg = await satori(element as Parameters<typeof satori>[0], {
		width: 1200,
		height: 630,
		fonts: [
			{ name: 'Inter', data: regular, weight: 400, style: 'normal' },
			{ name: 'Inter', data: semibold, weight: 600, style: 'normal' },
		],
	})

	const pngBuffer = new Resvg(svg).render().asPng()
	const arrayBuffer = new ArrayBuffer(pngBuffer.length)
	new Uint8Array(arrayBuffer).set(pngBuffer)

	return new Response(arrayBuffer, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	})
}
