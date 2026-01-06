// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/seyart-portfolio/', // 👈 중요: 여기에 생성할 저장소(Repository) 이름을 적으세요! (예: /portfolio/)
})