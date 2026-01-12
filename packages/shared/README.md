# @sos26/shared

モノレポ全体で共有する API 仕様の単一の真実源（SSOT）。Zod スキーマとエンドポイント定義を集約し、Web/API の両方から参照します。

## 役割

- 共有スキーマ（例: `userSchema`）と、その推論型（例: `User`）の提供
- メソッド/パス/入力/出力を含む型安全なエンドポイント定義
- Web/API アプリからの再利用を前提としたエクスポート

## ディレクトリ構成

```
src/
├── schemas/      # Zod スキーマ（実行時検証 + 型定義）
├── endpoints/    # スキーマを用いたエンドポイント定義
└── index.ts      # 公開エクスポート
```

## 公開 API（主なもの）

- スキーマ: `userSchema` とその型 `User` など
- エンドポイント型ヘルパー: `Endpoint`, `GetEndpoint`, `BodyEndpoint`, `NoBodyEndpoint`
- サンプルエンドポイント: `getUserEndpoint`, `listUsersEndpoint`, `createUserEndpoint`, `deleteUserEndpoint`

## 使い方

### Web アプリ（apps/web）からの利用例

```ts
import { getUserEndpoint } from '@sos26/shared'
import { callGetApi } from '@/lib/api/core'

const result = await callGetApi(getUserEndpoint, { pathParams: { id: 'u_1' } })
if (!result.ok) {
  // エラー処理（共通の Result 型）
} else {
  // result.data は Zod により検証済み + 型付け済み
  console.log(result.data.name)
}
```

### API アプリ（apps/api）からの利用例

```ts
import { userSchema } from '@sos26/shared'
// ルートハンドラ内で共有スキーマを使って検証
const parsed = userSchema.pick({ name: true, email: true }).parse(body)
```

## 新しいエンドポイントの追加

1. スキーマを `src/schemas/*` に追加
2. エンドポイント定義を `src/endpoints/*` に追加（ヘルパー型を使用）

```ts
// src/endpoints/example.ts
import { z } from 'zod'
import type { GetEndpoint } from './types'

const itemSchema = z.object({ id: z.string(), label: z.string() })

export const listItemsEndpoint: GetEndpoint<
  '/items',
  undefined,
  undefined,
  typeof itemSchema.array()
> = {
  method: 'GET',
  path: '/items',
  pathParams: undefined,
  query: undefined,
  request: undefined,
  response: itemSchema.array(),
} as const
```

## 開発コマンド

```bash
# このワークスペースのみテスト実行
bun run test:run

# 型チェック
bun run typecheck
```
