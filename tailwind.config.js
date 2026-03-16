/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			'bg-base': '#06090F',
  			'bg-1': '#0C1319',
  			'bg-2': '#111C24',
  			'bg-3': '#162230',
  			'border-subtle': 'rgba(255, 255, 255, 0.05)',
  			'border-default': 'rgba(255, 255, 255, 0.09)',
  			'border-strong': 'rgba(255, 255, 255, 0.16)',
  			'border-accent': 'rgba(16, 185, 129, 0.35)',
  			'emerald-50': '#ECFDF5',
  			'emerald-300': '#6EE7B7',
  			'emerald-400': '#34D399',
  			'emerald-500': '#10B981',
  			'emerald-600': '#059669',
  			'emerald-glow': 'rgba(16, 185, 129, 0.12)',
  			'emerald-glow-strong': 'rgba(16, 185, 129, 0.20)',
  			'gold-400': '#FBBF24',
  			'gold-500': '#F59E0B',
  			'gold-glow': 'rgba(245, 158, 11, 0.12)',
  			'text-primary': '#F1F5F9',
  			'text-secondary': '#94A3B8',
  			'text-muted': '#4B6478',
  			'text-accent': '#34D399',
  			red: '#F87171',
  			'red-bg': 'rgba(248, 113, 113, 0.10)',
  			// Short aliases used by landing page
  			'em-400': '#34D399',
  			'em-500': '#10B981',
  			'em-600': '#059669',
  			'tx-1': '#F1F5F9',
  			'tx-2': '#94A3B8',
  			'tx-3': '#4B6478',
  			'border-sub': 'rgba(255, 255, 255, 0.05)',
  			'border-def': 'rgba(255, 255, 255, 0.09)',
  			gold: '#FBBF24',
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			display: [
  				'Sora',
  				'sans-serif'
  			],
  			body: [
  				'DM Sans',
  				'sans-serif'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
