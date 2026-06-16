import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

describe('deployment configuration', () => {
  it('keeps GitHub Pages production assets relative and stable', () => {
    const viteConfig = readProjectFile('vite.config.ts')

    expect(viteConfig).toContain("base: command === 'serve' ? '/' : './'")
    expect(viteConfig).toContain("entryFileNames: 'assets/[name].js'")
    expect(viteConfig).toContain("assetFileNames: 'assets/[name][extname]'")
  })

  it('builds production frontend against the deployed Worker URL', () => {
    const envProduction = readProjectFile('.env.production')

    expect(envProduction).toContain('VITE_CHAT_API_URL=https://basa-radiation-guide-api.botradiation.workers.dev/api/chat')
    expect(envProduction).toContain('VITE_USE_MOCK_CHAT=false')
    expect(envProduction).not.toMatch(/GROQ_API_KEY/)
  })

  it('publishes GitHub Pages from the dist artifact', () => {
    const workflow = readProjectFile('.github/workflows/deploy-pages.yml')

    expect(workflow).toContain('actions/configure-pages@v5')
    expect(workflow).toContain('actions/upload-pages-artifact@v3')
    expect(workflow).toContain('actions/deploy-pages@v4')
    expect(workflow).toContain('path: dist')
  })
})
