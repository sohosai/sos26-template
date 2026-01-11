# テスト

このプロジェクトでは **Vitest** を使用してユニットテストを実行します。

## テストの実行

### 基本的なコマンド

```bash
# テストを実行（watch モード）
bun run test

# テストを1回だけ実行（CI用）
bun run test --run

# カバレッジ付きでテストを実行
bun run test --coverage
```

### Watch モード

`bun run test` コマンドはデフォルトで watch モードで実行されます。ファイルを変更すると、関連するテストが自動的に再実行されます。

### カバレッジレポート

`bun run test --coverage` を実行すると、コードカバレッジレポートが生成されます。レポートは `coverage/` ディレクトリに出力されます。

## テストファイルの作成

### ファイル配置

テストファイルは、テスト対象のファイルと同じディレクトリに配置します。

```
packages/shared/src/schemas/
├── user.ts
└── user.test.ts
```

### 命名規則

- ユニットテスト: `*.test.ts` または `*.test.tsx`
- テストファイル名は、テスト対象のファイル名に `.test` を付けたものにする

## テストの書き方

### 基本的なテスト

```typescript
import { describe, expect, it } from "vitest";
import { userSchema } from "./user";

describe("userSchema", () => {
  it("有効なユーザー情報を受け入れる", () => {
    const validUser = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
    };

    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("無効なメールアドレスを拒否する", () => {
    const invalidUser = {
      id: "1",
      name: "John Doe",
      email: "invalid-email",
    };

    const result = userSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });
});
```

### 日本語のテスト名

このプロジェクトでは、テスト名に日本語を使用できます。

```typescript
describe("ユーザースキーマ", () => {
  it("有効なユーザー情報を受け入れる", () => {
    // テストコード
  });
});
```

### よく使うアサーション

```typescript
// 等価性
expect(value).toBe(expected);           // 厳密な等価性 (===)
expect(value).toEqual(expected);        // 深い等価性

// 真偽値
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// null / undefined
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// 数値
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(5);

// 文字列
expect(string).toContain("substring");
expect(string).toMatch(/regex/);

// 配列
expect(array).toContain(item);
expect(array).toHaveLength(3);

// オブジェクト
expect(object).toHaveProperty("key");
expect(object).toMatchObject({ key: "value" });

// 例外
expect(() => fn()).toThrow();
expect(() => fn()).toThrow("error message");
```

## 設定

### vitest.config.ts

プロジェクトルートの `vitest.config.ts` で Vitest の設定を行っています。

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

#### 設定項目

- `globals: true` - `describe`, `it`, `expect` などをグローバルに使用可能にする
- `environment: "node"` - Node.js 環境でテストを実行

### Biome 設定

`biome.json` の `overrides` セクションで、テストファイルに対する特別な設定を行っています。

```json
{
  "overrides": [
    {
      "includes": ["**/*.test.ts", "**/*.test.tsx"],
      "linter": {
        "rules": {
          "security": {
            "noSecrets": "off"
          }
        }
      }
    }
  ]
}
```

これにより、日本語のテスト名を使用しても `noSecrets` のエラーが発生しません。

## ベストプラクティス

### テストの構造

AAA パターン（Arrange-Act-Assert）に従ってテストを書きます。

```typescript
it("ユーザー情報を検証する", () => {
  // Arrange: テストデータの準備
  const userData = {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
  };

  // Act: 実行
  const result = userSchema.safeParse(userData);

  // Assert: 検証
  expect(result.success).toBe(true);
});
```

### テスト名の付け方

- テストが何をテストしているのか明確にする
- 期待される動作を記述する
- 日本語を活用して可読性を高める

```typescript
// Good
it("無効なメールアドレスを拒否する");
it("必須フィールドが欠けている場合にエラーを返す");

// Avoid
it("test1");
it("works");
```

### テストの独立性

各テストは独立して実行可能であるべきです。テスト間で状態を共有しないようにします。

```typescript
// Good: 各テストで新しいオブジェクトを作成
it("テスト1", () => {
  const data = createTestData();
  // ...
});

it("テスト2", () => {
  const data = createTestData();
  // ...
});

// Avoid: グローバルな状態を共有
let sharedData;

it("テスト1", () => {
  sharedData = createTestData();
  // ...
});

it("テスト2", () => {
  // sharedData に依存
});
```

## 参考リンク

- [Vitest 公式ドキュメント](https://vitest.dev/)
- [Vitest API リファレンス](https://vitest.dev/api/)
