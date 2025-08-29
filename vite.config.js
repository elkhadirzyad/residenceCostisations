import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  //base: '/mon-app/' // replace with your repo name or '/' if deploying to user.github.io root
   base: '/'
})
