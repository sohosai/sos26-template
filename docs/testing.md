# テスト

このプロジェクトでは **Vitest** を使用してユニットテストを実行します。

## 目次

- [テストの実行](#テストの実行)
- [テストファイルの作成](#テストファイルの作成)
- [テストの書き方](#テストの書き方)
- [モックの使い方](#モックの使い方)
- [設定](#設定)
- [ベストプラクティス](#ベストプラクティス)
- [参考リンク](#参考リンク)

## テストの実行

### 基本的なコマンド

```bash
# プロジェクト全体のテストを実行（ワンショット実行）
bun run test:run

# プロジェクト全体のテストを実行（ウォッチモード）
bun run test:watch

# 特定のワークスペースのテストを実行
cd apps/web
bun run test:run

# カバレッジ付きでテスト実行
bun run test:run --coverage
```

### コマンドの仕組み

- ルートの`package.json`では、`bun --filter`でワークスペース内のテストを一括実行
- 各ワークスペース（apps/web等）では`vitest`コマンドを使用

### Watch モード

`bun run test:watch` コマンドは watch モードで実行されます。ファイルを変更すると、関連するテストが自動的に再実行されます。

### カバレッジレポート

`bun run test:run --coverage` を実行すると、コードカバレッジレポートが生成されます。レポートは `coverage/` ディレクトリに出力されます。

```bash
# カバレッジ付きでテスト実行
bun run test:run --coverage

# ブラウザでレポート確認
open coverage/index.html
```

## テストファイルの作成

### ファイル配置

テストファイルは、テスト対象のファイルと同じディレクトリに配置します。

```
apps/web/src/lib/
├── api/
│   ├── core.ts
│   └── core.test.ts          # coreのテスト
├── http/
│   ├── client.ts
│   ├── error.ts
│   ├── error.test.ts         # errorのテスト
│   ├── result.ts
│   └── result.test.ts        # resultのテスト
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

### Arrange-Act-Assert パターン

テストは **AAA パターン**に従って記述します。

```typescript
it("pathパラメータなし、queryなしでGETリクエストを実行する", async () => {
  // Arrange: テストデータの準備
  const mockResponse = { id: "123", name: "Alice" };
  const mockGet = vi.fn().mockReturnValue({
    json: vi.fn().mockResolvedValue(mockResponse),
  });
  vi.mocked(httpClient).get = mockGet;

  const endpoint = {
    method: "GET",
    path: "/users",
    // ...
  };

  // Act: 実行
  const result = await callGetApi(endpoint);

  // Assert: 検証
  expect(mockGet).toHaveBeenCalledWith("users", {
    searchParams: undefined,
  });
  expect(result).toEqual(mockResponse);
});
```

### 日本語のテスト名

このプロジェクトでは、テスト名に日本語を使用できます。

```typescript
describe("APIクライアント", () => {
  describe("正常系", () => {
    it("GETリクエストを実行する", async () => {
      // テストコード
    });
  });

  describe("異常系", () => {
    it("HTTPエラーを適切に処理する", async () => {
      // テストコード
    });
  });

  describe("バリデーションエラー", () => {
    it("レスポンスのバリデーションに失敗した場合、ZodErrorをスローする", async () => {
      // テストコード
    });
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

// 非同期の例外
await expect(asyncFn()).rejects.toThrow();
await expect(asyncFn()).rejects.toThrow("error message");
```

## モックの使い方

### vi.mock() - モジュール全体のモック

依存モジュール全体をモックする場合に使用します。

```typescript
// httpClientのモック
vi.mock("../http/client", () => ({
  httpClient: vi.fn(),
}));

// resultのモック
vi.mock("../http/result", () => ({
  toResult: vi.fn((promise: Promise<unknown>) => promise),
}));

// モックされたhttpClientをインポート
import { httpClient } from "../http/client";
```

**重要**: `vi.mock()`はファイルの先頭（インポート前）に配置する必要があります。

**ファイル全体の構成例**:

```typescript
import type { Endpoint } from "@sos26/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// 1. vi.mock()を先に配置
vi.mock("../http/client", () => ({
  httpClient: vi.fn(),
}));

vi.mock("../http/result", () => ({
  toResult: vi.fn((promise: Promise<unknown>) => promise),
}));

// 2. モックされたモジュールをインポート
import { httpClient } from "../http/client";
import { callGetApi } from "./core";

// 3. テストコード
describe("callGetApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("テストケース", async () => {
    // ...
  });
});
```

### vi.fn() - 関数のモック

個別の関数をモックする場合に使用します。

```typescript
// 基本的な使い方
const mockFn = vi.fn();

// 戻り値を設定
const mockFn = vi.fn().mockReturnValue("value");

// Promiseを返す関数のモック
const mockFn = vi.fn().mockResolvedValue({ data: "success" });

// エラーを投げるモック
const mockFn = vi.fn().mockRejectedValue(new Error("Failed"));

// 呼び出し回数の検証
expect(mockFn).toHaveBeenCalledTimes(1);

// 引数の検証
expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
```

### vi.mocked() - モック関数への型安全なアクセス

TypeScriptで型安全にモックにアクセスする場合に使用します。

```typescript
import { vi } from "vitest";
import { httpClient } from "../http/client";

// 型安全にモックのプロパティを設定
vi.mocked(httpClient).get = mockGet;
vi.mocked(httpClient).mockImplementation(mockHttpClient as never);
```

### beforeEach - テスト前の初期化

各テストケース前にモックをリセットします。

```typescript
import { beforeEach, describe, it, vi } from "vitest";

describe("APIクライアント", () => {
  beforeEach(() => {
    vi.clearAllMocks();  // 全てのモックをクリア
  });

  it("テストケース1", () => {
    // 各テスト前にモックがリセットされる
  });

  it("テストケース2", () => {
    // 前のテストの影響を受けない
  });
});
```

### HTTPClient (ky) のモック

kyなどのメソッドチェーンを持つライブラリをモックする場合:

#### GETリクエストのモック

```typescript
const mockResponse = { id: "123", name: "Alice" };
const mockGet = vi.fn().mockReturnValue({
  json: vi.fn().mockResolvedValue(mockResponse),
});
vi.mocked(httpClient).get = mockGet;

// テスト実行後の検証
expect(mockGet).toHaveBeenCalledWith("users", {
  searchParams: undefined,
});
```

#### POST/PUT/PATCHリクエストのモック

```typescript
const mockResponse = { id: "999", name: "New User" };
const mockHttpClient = vi.fn().mockReturnValue({
  json: vi.fn().mockResolvedValue(mockResponse),
});
vi.mocked(httpClient).mockImplementation(mockHttpClient as never);

// テスト実行後の検証
expect(mockHttpClient).toHaveBeenCalledWith("users", {
  method: "POST",
  json: { name: "New User" },
  searchParams: undefined,
});
```

### HTTPError、Responseのモック

ブラウザAPIやkyのエラーをモックする例:

```typescript
import { HTTPError } from "ky";

// Responseのモック（JSONレスポンス）
const mockResponse = new Response(
  JSON.stringify({ message: "Not Found" }),
  {
    status: 404,
    statusText: "Not Found",
    headers: { "content-type": "application/json" },
  }
);

// HTTPErrorのモック
const mockRequest = new Request("http://example.com/users/123");
const httpError = Object.assign(new Error("HTTP Error"), {
  response: mockResponse,
  request: mockRequest,
  name: "HTTPError",
});
Object.setPrototypeOf(httpError, HTTPError.prototype);

// エラーハンドリングのテスト
const result = await toApiError(httpError, {
  method: "GET",
  path: "/users/123",
});

expect(result.kind).toBe("http");
if (result.kind === "http") {
  expect(result.status).toBe(404);
  expect(result.statusText).toBe("Not Found");
  expect(result.body).toEqual({ message: "Not Found" });
}
```

#### テキストレスポンスのモック

```typescript
const mockResponse = new Response("Internal Server Error", {
  status: 500,
  statusText: "Internal Server Error",
  headers: { "content-type": "text/plain" },
});
```

#### タイムアウトエラーのモック

```typescript
import { TimeoutError } from "ky";

const timeoutError = new TimeoutError(new Request("http://example.com"));
const result = await toApiError(timeoutError, {
  method: "POST",
  path: "/users",
});

expect(result.kind).toBe("timeout");
```

### Zodバリデーションエラーのモック

バリデーションエラーをテストする場合:

```typescript
import { z, type ZodError } from "zod";

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
});

let zodError: ZodError | undefined;
try {
  schema.parse({ name: 123, email: "invalid" }); // 意図的にエラーを発生
} catch (error) {
  zodError = error as ZodError;
}

// zodErrorを使ってテスト
const result = await toApiError(zodError as ZodError);
expect(result.kind).toBe("invalid_response");
if (result.kind === "invalid_response") {
  expect(result.issues.length).toBeGreaterThan(0);
}
```

### 非同期処理のテスト

```typescript
// async/awaitを使う
it("非同期処理のテスト", async () => {
  const result = await asyncFunction();
  expect(result).toBe("expected");
});

// Promiseのresolve
it("Promiseが解決する", async () => {
  const promise = Promise.resolve({ data: "success" });
  const result = await toResult(promise);

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.data).toEqual({ data: "success" });
  }
});

// Promiseのreject
it("Promiseが拒否される", async () => {
  await expect(failingFunction()).rejects.toThrow();
  await expect(failingFunction()).rejects.toThrow("error message");
});
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

### package.json

#### ルートのpackage.json

```json
{
  "scripts": {
    "test:run": "bun --filter './apps/*' --filter './packages/*' test:run",
    "test:watch": "bun --filter './apps/*' --filter './packages/*' test:watch"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^4.0.16",
    "vitest": "^4.0.16"
  }
}
```

#### 各ワークスペース（apps/web等）のpackage.json

```json
{
  "scripts": {
    "test:run": "vitest run",
    "test:watch": "vitest"
  }
}
```

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

### 1. テストは独立させる

各テストケースは独立して実行できるようにします。

```typescript
beforeEach(() => {
  vi.clearAllMocks();  // 各テスト前にモックをクリア
});

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
  // sharedData に依存（避けるべき）
});
```

### 2. テストの可読性を重視

- 日本語でテストケースを記述
- AAA パターン（Arrange-Act-Assert）に従う
- コメントで区切りを明示

### 3. 正常系と異常系を分ける

```typescript
describe("callGetApi", () => {
  describe("正常系", () => {
    it("pathパラメータなしでGETリクエストを実行する", async () => {
      // 正常なケース
    });
  });

  describe("異常系", () => {
    it("HTTPエラーを適切に処理する", async () => {
      // エラーケース
    });
  });

  describe("バリデーションエラー", () => {
    it("レスポンスのバリデーションに失敗した場合、ZodErrorをスローする", async () => {
      // バリデーションエラーのケース
    });
  });
});
```

### 4. テスト名の付け方

- テストが何をテストしているのか明確にする
- 期待される動作を記述する
- 日本語を活用して可読性を高める

```typescript
// Good
it("無効なメールアドレスを拒否する");
it("必須フィールドが欠けている場合にエラーを返す");
it("pathパラメータを正しくURLエンコードする");

// Avoid
it("test1");
it("works");
```

### 5. モックは必要最小限に

- 不要なモックは作らない
- 実装の詳細ではなく、振る舞いをテストする
- テストしたい部分以外は実装をそのまま使う

### 6. 型安全性を保つ

```typescript
// 型推論を活用
const endpoint: Endpoint<"GET", "/users", undefined, undefined, undefined, typeof userSchema> = {
  method: "GET",
  path: "/users",
  // ...
};

// vi.mocked()で型安全にアクセス
vi.mocked(httpClient).get = mockGet;

// 型を明示
let zodError: ZodError | undefined;
```

### 7. エラーケースもテストする

```typescript
it("レスポンスのバリデーションに失敗した場合、ZodErrorをスローする", async () => {
  // Arrange
  const mockResponse = { id: "123", name: 123 }; // nameが数値（期待は文字列）
  const mockGet = vi.fn().mockReturnValue({
    json: vi.fn().mockResolvedValue(mockResponse),
  });
  vi.mocked(httpClient).get = mockGet;

  const userSchema = z.object({
    id: z.string(),
    name: z.string(),
  });

  const endpoint = {
    method: "GET",
    path: "/users/:id",
    response: userSchema,
    // ...
  };

  // Act & Assert
  await expect(callGetApi(endpoint)).rejects.toThrow();
});
```

### 8. 境界値テストを含める

```typescript
it("pathパラメータを正しくURLエンコードする", async () => {
  // スラッシュを含む特殊なケース
  const result = await callGetApi(endpoint, {
    pathParams: { id: "test/value" },
  });

  expect(mockGet).toHaveBeenCalledWith("data/test%2Fvalue", {
    searchParams: undefined,
  });
});

it("先頭の複数のスラッシュを正しく除去する", async () => {
  const endpoint = {
    method: "GET",
    path: "///api/test",
    // ...
  };

  const result = await callGetApi(endpoint);

  expect(mockGet).toHaveBeenCalledWith("api/test", {
    searchParams: undefined,
  });
});
```

## トラブルシューティング

### モックがクリアされない

`beforeEach`で`vi.clearAllMocks()`を呼び出しているか確認してください。

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 型エラーが出る

`vi.mocked()`を使って型安全にモックにアクセスしてください。

```typescript
vi.mocked(httpClient).get = mockGet;
```

### vi.mock()が効かない

`vi.mock()`はファイルの先頭、インポート文の前に配置する必要があります。

```typescript
// ✅ 正しい順序
vi.mock("../http/client", () => ({
  httpClient: vi.fn(),
}));

import { httpClient } from "../http/client";

// ❌ 間違った順序
import { httpClient } from "../http/client";

vi.mock("../http/client", () => ({
  httpClient: vi.fn(),
}));
```

### テストが遅い

- 不要な`await`を削除
- 並列実行できるテストは並列化
- タイムアウト設定を調整

## 参考リンク

- [Vitest 公式ドキュメント](https://vitest.dev/)
- [Vitest API リファレンス](https://vitest.dev/api/)
- [Vitest モックガイド](https://vitest.dev/guide/mocking.html)
