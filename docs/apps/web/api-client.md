# API クライアント設計・実装ガイド

## 概要

本プロジェクトでは、API 仕様を `packages/shared` で一元管理し、`apps/web` と `apps/api` の両方から参照する設計を採用しています。

### 設計の最重要方針

1. **API 仕様の単一真実源（SSOT）**: すべての API 仕様（path / method / request / response）を `shared` で定義
2. **実行時検証の徹底**: zod による `parse` を必須とし、型だけでなく実行時にも安全性を担保
3. **変更漏れの早期検知**: 仕様変更時に web/api のいずれかで即座にビルドエラーまたは実行時エラーが発生する構造
4. **通信層の責務分離**: HTTP 通信の運用責務（retry/timeout/認証/ログ/統一エラー）を一箇所に集約

### 設計の利点

- API 仕様変更時の変更漏れが防げる
- 型安全と実行時検証の両方を確保
- try/catch を UI 層で書かずに済む（Result 型による分岐）
- 通信層の横断関心事を一元管理できる

---

## アーキテクチャ

### 全体構成

```
┌─────────────────────────────────────────────────────┐
│ UI Layer (React Components)                         │
│ - Result型で分岐: if (!res.ok) { ... }              │
│ - try/catch を書かない                               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Domain API Layer (src/lib/api/*)                    │
│ - getUser(), createUser() など                      │
│ - Promise<Result<T>> を返す                         │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Core API Caller (src/lib/api/core.ts)              │
│ - callGetApi() / callBodyApi() / callNoBodyApi()   │
│ - endpoint定義を受け取り、必ず zod.parse を実行     │
│ - pathParams / query / request / response を検証    │
│ - pathの置換・整形（先頭スラッシュ除去→prefixUrl連結）│
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ HTTP Client (src/lib/http/client.ts)               │
│ - ky.create() による共通インスタンス                 │
│ - retry / timeout / hooks で横断関心を集約          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Error Handling & Result Wrapper                     │
│ - toApiError(): 各種エラーを統一型に変換            │
│ - toResult(): Promise<T> → Promise<Result<T>>      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Shared Package (@sos26/shared)                      │
│ - Endpoint定義 (method/path/req/res)                │
│ - Zodスキーマ (userSchema, etc.)                    │
│ - 単一真実源（SSOT）                                 │
└─────────────────────────────────────────────────────┘
```

### ディレクトリ構造

```
apps/web/src/lib/
├── http/
│   ├── client.ts       # ky共通インスタンス
│   ├── error.ts        # 統一エラー型と変換関数
│   └── result.ts       # Result型とラッパ関数
└── api/
    ├── core.ts         # 共通APIcaller（callGetApi/callBodyApi/callNoBodyApi）
    └── user.ts         # ドメイン別API（getUser/createUser/deleteUserなど）

packages/shared/src/
├── endpoints/
│   ├── types.ts        # Endpoint型定義
│   └── user.ts         # userエンドポイント定義
└── schemas/
    └── user.ts         # userスキーマ定義
```

---

## 技術選定の背景

> **Note**: このセクションでは、なぜ ky + zod の構成を採用したのか、他の選択肢と比較してどう判断したかを説明します。

### 検討した技術一覧

本プロジェクトでは、以下の技術を比較検討しました。

- 素の fetch
- ofetch
- ky
- safe-fetch 系ライブラリ
- OpenAPI + 自動生成クライアント
- Hono RPC（hono/client）
- Zodios

### なぜ ky を採用したのか

#### (1) 通信層としての責務が明確で、基盤に向く

ky は「HTTP クライアントとしての運用責務」を標準で持っています。

- **retry**: 一時的障害（429, 5xx など）への自動リトライ
- **timeout**: リクエストタイムアウトの設定
- **hooks**: 認証ヘッダ付与、ログ、監視などの横断関心を集約

素の fetch では、これらを自作する必要がありますが、ky では標準機能として提供されており、長期運用で必要な機能を「自作しなくてよい」のが大きな利点です。

#### (2) 共通インスタンス 1つに横断関心を集約できる

`ky.create()` により、設定を一箇所に固定できます。

```typescript
export const httpClient = ky.create({
  prefixUrl: "...",
  timeout: 30000,
  retry: { limit: 1, ... },
  hooks: {
    beforeRequest: [(request) => {
      // 認証ヘッダの付与
      // ログの記録
      // 監視メトリクスの送信
    }],
  },
});
```

各 API 関数は「path と body」中心になり、実装が均一化されます。横断関心事が分散せず、保守性が高まります。

#### (3) zod（SSOT）との責務分離が綺麗

本プロジェクトでは、以下の責務分離を重視しています。

- **ky**: 通信層（運用責務）
- **zod**: 仕様・検証（unknown → parse による実行時検証）

これにより、「型が合っているはず」という思い込みを排除できます。仕様変更時に `shared` を直すと、web/api が即座に壊れ、変更漏れを検知できます。

#### (4) safe-fetch 的な体験を安定した土台で再現できる

safe-fetch 系ライブラリ（Result/Union を返す設計）は魅力的ですが、採用事例・知見が少なく、基盤層としての長期運用リスクがあります。

ky + 統一エラー型 + Result ラッパにより、同等の開発体験を安定した土台で実現できます。

```typescript
// UI側での使用例
const res = await getUser({ id: "123" });
if (!res.ok) {
  // エラーハンドリング（try/catchなし）
  console.error(res.error.kind);
  return;
}
console.log(res.data.name); // 成功時の処理
```

### 他の選択肢を採用しなかった理由

#### ofetch

- 「便利 fetch」に寄り、長期運用の基盤としての機能が不足
- shared+zod と組み合わせることは可能だが、通信層としては責務が軽すぎる

#### OpenAPI + 自動生成クライアント

- zod（実行時検証/SSOT）と OpenAPI（仕様記述）が二重化しやすい
- 生成物中心のワークフローに寄り、実装主導の変更検知（即壊れ）と相性が悪い
- 内部 API のみの運用では過剰
- 将来必要なら、zod から OpenAPI を派生生成する方針が安全

#### Hono RPC（hono/client）

- 仕様の正が「Hono のルート（サーバ実装）」に寄りやすく、shared(zod) SSOT と衝突しやすい
- 静的型は強いが、今回最重視の「unknown → zod.parse による実行時検証」を置き換えられない
- 通信層の運用責務（retry/timeout/統一エラー/観測性）は RPC の主戦場ではない

#### Zodios

- zod を中心に「エンドポイント定義 → 型付きクライアント」を構築できる点は魅力的
- ただし、"クライアント生成/抽象化"の色が強く、プロジェクト固有の運用責務（retry/timeout/認証更新/ログ/統一エラー）をどの層でどう扱うかの設計が別途必要
- 今回は、抽象化よりも「通信層の責務を ky に集約」することを優先し、zodios 中核は採用しない
- 将来的に zodios へ寄せる余地は残る

### 最終決定の根拠

本プロジェクトでは「shared(zod) を単一の真実源として、実行時検証を必須にしつつ、通信層の運用責務（retry/timeout/認証/統一エラー）を基盤として確立する」ことが最重要です。

この要求に対し、**ky は最も枯れていて責務が明確**で、hooks による集約が可能であり、safe-fetch 的な Result 体験も自前で再現できるため、最終的に ky 採用を決定しました。

---

## 実装ガイド

> **Note**: ここからは、実際に API を追加・使用する際の具体的な手順を説明します。

### 1. 新しい API エンドポイントを追加する

#### Step 1: shared でスキーマを定義

```typescript
// packages/shared/src/schemas/post.ts
import { z } from "zod";

export const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
});

export type Post = z.infer<typeof postSchema>;
```

#### Step 2: shared でエンドポイントを定義

エンドポイント定義では、**pathParams**（パスパラメータ）、**query**（クエリパラメータ）、**request**（リクエストbody）、**response**（レスポンスbody）のzodスキーマを指定します。

```typescript
// packages/shared/src/endpoints/post.ts
import { z } from "zod";
import { postSchema } from "../schemas/post";
import type { BodyEndpoint, GetEndpoint, NoBodyEndpoint } from "./types";

/**
 * GET /posts/:id
 * 指定IDの投稿を取得
 */
const getPostPathParamsSchema = z.object({
  id: z.string(),
});

export const getPostEndpoint: GetEndpoint<
  "/posts/:id",
  typeof getPostPathParamsSchema,
  undefined,
  typeof postSchema
> = {
  method: "GET",
  path: "/posts/:id",
  pathParams: getPostPathParamsSchema, // パスパラメータのスキーマ
  query: undefined,                     // クエリなし
  request: undefined,                   // GETなのでbodyなし
  response: postSchema,
} as const;

/**
 * GET /posts
 * 投稿一覧を取得（クエリパラメータでページネーション・フィルタリング）
 */
const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  authorId: z.string().optional(),
});

const postListSchema = z.array(postSchema);

export const listPostsEndpoint: GetEndpoint<
  "/posts",
  undefined,
  typeof listPostsQuerySchema,
  typeof postListSchema
> = {
  method: "GET",
  path: "/posts",
  pathParams: undefined,                // パスパラメータなし
  query: listPostsQuerySchema,          // クエリパラメータのスキーマ
  request: undefined,
  response: postListSchema,
} as const;

/**
 * POST /posts
 * 新規投稿を作成
 */
const createPostRequestSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
});

export const createPostEndpoint: BodyEndpoint<
  "POST",
  "/posts",
  undefined,
  undefined,
  typeof createPostRequestSchema,
  typeof postSchema
> = {
  method: "POST",
  path: "/posts",
  pathParams: undefined,
  query: undefined,
  request: createPostRequestSchema,
  response: postSchema,
} as const;

/**
 * DELETE /posts/:id
 * 指定IDの投稿を削除
 */
const deletePostPathParamsSchema = z.object({
  id: z.string(),
});

const deletePostResponseSchema = z.object({
  success: z.boolean(),
});

export const deletePostEndpoint: NoBodyEndpoint<
  "DELETE",
  "/posts/:id",
  typeof deletePostPathParamsSchema,
  undefined,
  typeof deletePostResponseSchema
> = {
  method: "DELETE",
  path: "/posts/:id",
  pathParams: deletePostPathParamsSchema,
  query: undefined,
  request: undefined,                    // DELETEなのでbodyなし
  response: deletePostResponseSchema,
} as const;
```

#### Step 3: shared の index.ts でエクスポート

```typescript
// packages/shared/src/index.ts
export * from "./endpoints/types";
export * from "./endpoints/user";
export * from "./endpoints/post"; // 追加
export * from "./schemas/user";
export * from "./schemas/post"; // 追加
```

### 2. web 側で API 関数を実装する

```typescript
// apps/web/src/lib/api/post.ts
import {
  createPostEndpoint,
  deletePostEndpoint,
  getPostEndpoint,
  listPostsEndpoint,
  type Post,
} from "@sos26/shared";
import type { Result } from "../http/result";
import { callBodyApi, callGetApi, callNoBodyApi } from "./core";

/**
 * GET /posts/:id
 * 指定IDの投稿を取得
 */
export async function getPost(params: { id: string }): Promise<Result<Post>> {
  return callGetApi(getPostEndpoint, {
    pathParams: { id: params.id },
  });
}

/**
 * GET /posts
 * 投稿一覧を取得（クエリパラメータでフィルタリング）
 */
export async function listPosts(params?: {
  query?: {
    page?: number;
    limit?: number;
    authorId?: string;
  };
}): Promise<Result<Post[]>> {
  return callGetApi(listPostsEndpoint, {
    query: params?.query,
  });
}

/**
 * POST /posts
 * 新規投稿を作成
 */
export async function createPost(body: {
  title: string;
  content: string;
}): Promise<Result<Post>> {
  return callBodyApi(createPostEndpoint, body);
}

/**
 * DELETE /posts/:id
 * 指定IDの投稿を削除
 */
export async function deletePost(params: {
  id: string;
}): Promise<Result<{ success: boolean }>> {
  return callNoBodyApi(deletePostEndpoint, {
    pathParams: { id: params.id },
  });
}
```

### 3. UI で API を呼び出す

```typescript
// apps/web/src/routes/posts/$id.tsx
import { getPost } from "@/lib/api/post";

export function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      const res = await getPost({ id });

      if (!res.ok) {
        // エラーハンドリング（try/catchなし）
        switch (res.error.kind) {
          case "http":
            setError(`HTTPエラー: ${res.error.status}`);
            break;
          case "timeout":
            setError("タイムアウトしました");
            break;
          case "network":
            setError("ネットワークエラー");
            break;
          case "invalid_response":
            setError("レスポンスが不正です");
            break;
          default:
            setError("不明なエラー");
        }
        return;
      }

      // 成功時の処理
      setPost(res.data);
    }

    fetchPost();
  }, [id]);

  if (error) return <div>エラー: {error}</div>;
  if (!post) return <div>読み込み中...</div>;

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </div>
  );
}
```

### 4. pathParams と query の実行時検証

すべての pathParams と query は、**zod スキーマで実行時検証**されます。これにより、型安全だけでなく、実行時にも不正なパラメータを検出できます。

#### pathParams の例（パスパラメータ）

```typescript
// shared でエンドポイント定義
const getUserPathParamsSchema = z.object({
  id: z.string(),
});

export const getUserEndpoint: GetEndpoint<
  "/users/:id",
  typeof getUserPathParamsSchema,
  undefined,
  typeof userSchema
> = {
  method: "GET",
  path: "/users/:id",
  pathParams: getUserPathParamsSchema, // パスパラメータのスキーマ
  query: undefined,
  request: undefined,
  response: userSchema,
} as const;

// web 側での実装
export async function getUser(params: {
  id: string;
}): Promise<Result<User>> {
  return callGetApi(getUserEndpoint, {
    pathParams: { id: params.id }, // zodで検証される
  });
}
```

#### query の例（クエリパラメータ）

```typescript
// shared でエンドポイント定義
const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  authorId: z.string().optional(),
});

export const listPostsEndpoint: GetEndpoint<
  "/posts",
  undefined,
  typeof listPostsQuerySchema,
  typeof postListSchema
> = {
  method: "GET",
  path: "/posts",
  pathParams: undefined,
  query: listPostsQuerySchema, // クエリパラメータのスキーマ
  request: undefined,
  response: postListSchema,
} as const;

// web 側での実装
export async function listPosts(params?: {
  query?: {
    page?: number;
    limit?: number;
    authorId?: string;
  };
}): Promise<Result<Post[]>> {
  return callGetApi(listPostsEndpoint, {
    query: params?.query, // zodで検証される
  });
}

// UI側での使用例
const res = await listPosts({
  query: { page: 1, limit: 10, authorId: "user-123" },
});
```

#### DELETE エンドポイントの例（bodyなし）

```typescript
// shared でエンドポイント定義
const deleteUserPathParamsSchema = z.object({
  id: z.string(),
});

export const deleteUserEndpoint: NoBodyEndpoint<
  "DELETE",
  "/users/:id",
  typeof deleteUserPathParamsSchema,
  undefined,
  typeof deleteUserResponseSchema
> = {
  method: "DELETE",
  path: "/users/:id",
  pathParams: deleteUserPathParamsSchema,
  query: undefined,
  request: undefined, // DELETEなのでbodyなし
  response: deleteUserResponseSchema,
} as const;

// web 側での実装
export async function deleteUser(params: {
  id: string;
}): Promise<Result<{ success: boolean }>> {
  return callNoBodyApi(deleteUserEndpoint, { // callNoBodyApiを使用
    pathParams: { id: params.id },
  });
}
```

---

## エラーハンドリング

### 統一エラー型（ApiError）

すべてのエラーは `ApiError` 型に変換されます（discriminated union）。

```typescript
export type ApiError =
  | { kind: "http"; status: number; statusText: string; body?: unknown }
  | { kind: "timeout" }
  | { kind: "network"; message: string }
  | { kind: "invalid_response"; issues: ZodError["issues"] }
  | { kind: "unknown"; error: unknown };
```

### エラーの分類

| kind               | 説明                                     | 原因                       |
| ------------------ | ---------------------------------------- | -------------------------- |
| `http`             | HTTPエラー（4xx, 5xx）                   | `HTTPError`（ky）          |
| `timeout`          | タイムアウトエラー                       | `TimeoutError`（ky）       |
| `network`          | ネットワークエラー                       | `TypeError`（fetch）       |
| `invalid_response` | レスポンスがzodスキーマに合わない        | `ZodError`（zod）          |
| `unknown`          | その他の予期しないエラー                 | 上記以外                   |

### UI でのエラー処理パターン

```typescript
const res = await getUser({ id: "123" });

if (!res.ok) {
  // kind で分岐してエラーハンドリング
  switch (res.error.kind) {
    case "http":
      if (res.error.status === 404) {
        alert("ユーザーが見つかりません");
      } else if (res.error.status >= 500) {
        alert("サーバーエラーが発生しました");
      }
      break;
    case "timeout":
      alert("リクエストがタイムアウトしました");
      break;
    case "network":
      alert("ネットワークエラーが発生しました");
      break;
    case "invalid_response":
      console.error("レスポンス検証エラー:", res.error.issues);
      alert("予期しないレスポンスを受信しました");
      break;
    case "unknown":
      console.error("不明なエラー:", res.error.error);
      alert("エラーが発生しました");
      break;
  }
  return;
}

// 成功時の処理
console.log(res.data);
```

---

## ベストプラクティス

### DO（推奨）

- ✅ すべての API 仕様を `shared` に定義する
- ✅ endpoint 定義では必ず zod スキーマを指定する
- ✅ UI 層では Result 型の `ok` で分岐する
- ✅ エラーは `kind` で分類してハンドリングする
- ✅ 共通的なエラー処理は hooks で実装する

### DON'T（非推奨）

- ❌ fetch を直接呼ばない（必ず ky を使う）
- ❌ `any` 型を使わない
- ❌ zod.parse を省略しない
- ❌ API エラーを握り潰さない
- ❌ try/catch を UI 層で乱用しない（Result 型を使う）

---

## 今後の拡張性

### OpenAPI への対応

将来的に OpenAPI 対応が必要になった場合、以下の方針で対応できます。

1. zod から OpenAPI スキーマを自動生成する（`zod-to-openapi` など）
2. shared を SSOT として維持し、OpenAPI は派生物として扱う
3. 既存の実装を大きく変更せずに移行できる

### 状態管理ライブラリとの統合

TanStack Query などを導入する場合、現在の API 関数をそのまま `queryFn` として使用できます。

```typescript
const { data, error } = useQuery({
  queryKey: ["user", id],
  queryFn: async () => {
    const res = await getUser({ id });
    if (!res.ok) throw res.error;
    return res.data;
  },
});
```

---

## まとめ

本プロジェクトの API クライアント設計は、以下の原則に基づいています。

1. **shared(zod) を単一の真実源（SSOT）とする**
2. **実行時検証を徹底し、型だけに頼らない**
3. **通信層の運用責務を ky に集約する**
4. **UI 層は Result 型で安全に分岐する**

この設計により、API 仕様変更時の変更漏れが防げ、型安全と実行時安全の両方を確保できます。
