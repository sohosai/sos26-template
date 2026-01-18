# 環境変数

apps/apiで使用する環境変数の設定方法とリファレンスです。

## 目次

- [環境変数一覧](#環境変数一覧)
- [設定方法](#設定方法)
- [バリデーション](#バリデーション)
- [コード例](#コード例)
- [実装詳細](#実装詳細)
- [参考リンク](#参考リンク)

## 環境変数一覧

| 変数名 | 説明 | デフォルト値 | 必須 |
|--------|------|-------------|------|
| `PORT` | サーバーのポート番号 | `3000` | ❌ |
| `CORS_ORIGIN` | CORSで許可するオリジン（カンマ区切り） | `""` | ❌ |

## 設定方法

### 開発環境

`apps/api` ディレクトリ直下に `.env`（または `.env.local`）を作成します。

```bash
# apps/api/.env
PORT=3000
CORS_ORIGIN=http://localhost:5173,http://localhost:3001

# ローカル専用にしたい場合は .env.local を使用
# apps/api/.env.local が存在すればこちらが優先されます
```

## バリデーション

環境変数は起動時に自動的にバリデーションされます。

### バリデーションルール

**PORT:**
- 1〜65535の範囲の整数である必要があります
- 文字列から数値に自動変換されます
- 空または未設定の場合はデフォルト値（3000）が使用されます

**CORS_ORIGIN:**
- カンマ区切りで複数のオリジンを指定可能
- 各オリジンは `http://` または `https://` で始まる有効なURLである必要があります
- 各オリジンは自動的にトリミングされます
- 空文字列は除外されます
- 未設定の場合は空配列になります

### エラー例

```
ZodError: [
  {
    "code": "invalid_type",
    "path": ["PORT"],
    "message": "Expected number, received nan"
  }
]
```

## コード例

### 環境変数の読み込み

```typescript
import { env } from "./lib/env";

// 型安全にアクセス
console.log(env.PORT);        // number型
console.log(env.CORS_ORIGIN); // string[]型
```

### 型定義

```typescript
import type { Env } from "./lib/env";

function configureServer(config: Env) {
  // ...
}
```

## 実装詳細

環境変数の管理は `apps/api/src/lib/env.ts` で行われています。

### 仕組み

1. **スキーマ定義**: Zodで環境変数のスキーマを定義
2. **バリデーション**: `envSchema.parse()` で起動時にバリデーション
3. **型推論**: TypeScriptの型推論により型安全にアクセス可能

### スキーマの追加

新しい環境変数を追加する場合は `src/lib/env.ts` を編集します。

```typescript
const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGIN: z
    .string()
    .default("")
    .transform((val) => val.split(",").map((o) => o.trim()).filter(Boolean))
    .refine(
      (origins) => origins.every((o) => /^https?:\/\/.+/.test(o)),
      "各オリジンは有効なURL（http://またはhttps://で始まる）である必要があります"
    ),

  // 新しい環境変数を追加
  DATABASE_URL: z
    .string()
    .url(),
});
```

## 参考リンク

- [Bun環境変数ドキュメント](https://bun.sh/docs/runtime/env)
- [Zod公式ドキュメント](https://zod.dev/)
