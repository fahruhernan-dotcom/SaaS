/**
 * useSEO — Centralized SEO meta tag injector
 *
 * Injects <title>, <meta name="description">, <link rel="canonical">,
 * and Open Graph tags into <head> dynamically.
 *
 * Because this project uses vite-react-ssg (SSG), these tags will be
 * baked into the static HTML at build time, making them visible to
 * Googlebot without any JavaScript execution required.
 */
import { useEffect } from 'react'

const BASE_URL = 'https://ternakos.my.id'

/**
 * @param {object} params
 * @param {string} params.title       - Full page title (will appear in browser tab & Google results)
 * @param {string} params.description - Meta description (max ~155 chars for best display in Google)
 * @param {string} params.path        - URL path, e.g. '/harga' or '/blog/cara-hitung-fcr-ayam-broiler'
 * @param {string} [params.type]      - OG type: 'website' (default) or 'article'
 * @param {string} [params.image]     - OG image URL (absolute). Defaults to TernakOS logo.
 */
export function useSEO({ title, description, path, type = 'website', image }) {
  const canonicalUrl = `${BASE_URL}${path}`
  const ogImage = image || `${BASE_URL}/logo.png`

  useEffect(() => {
    // ── Title ──────────────────────────────────────────────────────
    document.title = title

    // ── Helper: upsert a <meta> tag ────────────────────────────────
    const setMeta = (attr, key, content) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    // ── Helper: upsert <link rel="..."> ───────────────────────────
    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`)
      if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', rel)
        document.head.appendChild(el)
      }
      el.setAttribute('href', href)
    }

    // ── Standard meta ─────────────────────────────────────────────
    setMeta('name', 'description', description)
    setLink('canonical', canonicalUrl)

    // ── Open Graph ────────────────────────────────────────────────
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:image', ogImage)
    setMeta('property', 'og:site_name', 'TernakOS')
    setMeta('property', 'og:locale', 'id_ID')

    // ── Twitter Card ──────────────────────────────────────────────
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', ogImage)

    // ── Cleanup: restore defaults when component unmounts ─────────
    return () => {
      document.title = 'TernakOS - Platform SaaS Pertanian Indonesia'
    }
  }, [title, description, canonicalUrl, ogImage, type])
}
