# API テストガイド（apps/api）

Hono + Vitest を用いた API レイヤーのテスト方針とサンプルです。

## 基本方針

- ルートは `Hono` のインスタンスにマウントして `app.request()` で検証
- 入力は Zod スキーマで検証し、成功/失敗の両方をテスト
- ステータスコード・レスポンスボディの整合性を確認

## 最小サンプル

```ts
// src/routes/example.ts
import { Hono } from 'hono'
export const exampleRoute = new Hono()
exampleRoute.get('/ping', c => c.json({ ok: true }))
```

```ts
// src/index.ts（抜粋）
import { Hono } from 'hono'
import { exampleRoute } from './routes/example'

const app = new Hono()
app.route('/', exampleRoute)
export { app } // テストで使えるようにエクスポート
export default { port: process.env.PORT || 3000, fetch: app.fetch }
```

```ts
// test/example.test.ts
import { describe, expect, it } from 'vitest'
import { app } from '../src/index'

describe('GET /ping', () => {
  it('200 + JSON を返す', async () => {
    const res = await app.request('/ping')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ ok: true })
  })
})
```

## Zod 検証を含むルートのテスト

```ts
// src/routes/items.ts
import { Hono } from 'hono'
import { z } from 'zod'
export const itemsRoute = new Hono()

const createItem = z.object({ label: z.string().min(1) })

itemsRoute.post('/items', async c => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = createItem.parse(body)
  return c.json({ id: 'i_1', label: parsed.label }, 201)
})
```

```ts
// test/items.test.ts
import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { itemsRoute } from '../src/routes/items'

function makeApp() {
  const app = new Hono()
  app.route('/', itemsRoute)
  return app
}

describe('POST /items', () => {
  it('201 + 作成結果', async () => {
    const app = makeApp()
    const res = await app.request('/items', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ label: 'hello' }),
    })
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ id: expect.any(String), label: 'hello' })
  })

  it('400 相当（Zod エラー）', async () => {
    const app = makeApp()
    // label を欠落
    await expect(
      app.request('/items', { method: 'POST', body: '{}' })
    ).rejects.toThrow()
  })
})
```

## 補足

- 実運用では Zod エラーをキャッチして 400 応答に変換するミドルウェア/ハンドラを用意するとよいです。
- ルートを個別にテストしたい場合は、上記のようにテスト専用の `makeApp()` を用意します。
- Bun + Vitest 用スクリプト: `apps/api/package.json` の `test:run`, `test:watch` を使用します。

