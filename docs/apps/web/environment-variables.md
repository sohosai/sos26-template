# 環境変数

apps/webで使用する環境変数の設定方法とリファレンスです。

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
| `VITE_API_BASE_URL` | APIのベースURL | `http://localhost:3000` | ❌ |

## 設定方法

### 開発環境

プロジェクトルートに `.env` ファイルを作成します。

```bash
# .env
VITE_API_BASE_URL=http://localhost:3000
```

## バリデーション

環境変数は起動時に自動的にバリデーションされます。

### バリデーションルール

**VITE_API_BASE_URL:**
- `http://` または `https://` で始まる必要があります
- 空文字列の場合はデフォルト値が使用されます
- 不正な値の場合は起動時にエラーが発生します

### エラー例

```
ZodError: [
  {
    "code": "invalid_format",
    "path": ["VITE_API_BASE_URL"],
    "message": "有効なURLである必要があります"
  }
]
```

## コード例

### 環境変数の読み込み

```typescript
import { env } from "@/lib/env";

// 型安全にアクセス
console.log(env.VITE_API_BASE_URL); // string型
```

### 型定義

```typescript
import type { Env } from "@/lib/env";

function useApi(config: Env) {
  // ...
}
```

## 実装詳細

環境変数の管理は `src/lib/env.ts` で行われています。

### 仕組み

1. **スキーマ定義**: Zodで環境変数のスキーマを定義
2. **バリデーション**: `envSchema.parse()` で起動時にバリデーション
3. **型推論**: TypeScriptの型推論により型安全にアクセス可能

### スキーマの追加

新しい環境変数を追加する場合は `src/lib/env.ts` を編集します。

```typescript
const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .regex(/^https?:\/\/.+/, "有効なURLである必要があります")
    .default("http://localhost:3000"),

  // 新しい環境変数を追加
  VITE_ANALYTICS_ID: z
    .string()
    .optional(),
});
```

## 参考リンク

- [Vite環境変数ドキュメント](https://vitejs.dev/guide/env-and-mode.html)
- [Zod公式ドキュメント](https://zod.dev/)
