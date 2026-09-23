import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: Update this base path to match your GitHub repository name.
// If your repository is named "technology-summit", keep base: "/technology-summit/".
// If you rename the repository, update this value to "/<new-repo-name>/".
export default defineConfig({
  plugins: [react()],
  base: '/TECH_SUMMIT/',
})
