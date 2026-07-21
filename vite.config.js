import { defineConfig } from 'vite'

export default defineConfig({
	server: {
		host: 'localhost',
		port: 3000,
		cors: true,
		hmr: {
			host: 'localhost',
			protocol: 'ws',
		},
	},
	build: {
		minify: true,
		cssCodeSplit: false,
		lib: {
			entry: 'src/main.js',
			name: 'App',
			formats: ['iife'],
			fileName: () => 'main.js',
		},
		rollupOptions: {
			output: {
				assetFileNames: 'main.[ext]',
			},
		},
	},
})