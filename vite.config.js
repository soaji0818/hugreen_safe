import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/').at(-1)
const isGitHubProjectPage = repositoryName && !repositoryName.endsWith('.github.io')
const base = process.env.GITHUB_ACTIONS === 'true' && isGitHubProjectPage
  ? `/${repositoryName}/`
  : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
