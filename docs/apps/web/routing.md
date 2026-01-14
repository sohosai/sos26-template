# ルーティング

このプロジェクトでは TanStack Router によるファイルベースルーティングを採用しています。

## 目次

- [ルーティング](#ルーティング)
	- [目次](#目次)
	- [ページの作成](#ページの作成)
		- [ディレクトリ構造](#ディレクトリ構造)
		- [ページの雛形](#ページの雛形)
	- [コンポーネントのインポート](#コンポーネントのインポート)

## ページの作成

開発サーバーを起動している時 (`bun run dev`) に、`src/routes` 配下に `page-name/index.tsx` を作成すると、自動的にルートが生成されます。

### ディレクトリ構造

```
src/routes/
├── index.tsx           # / (ホーム)
├── about/
│   └── index.tsx       # /about
└── profile/
    └── index.tsx       # /profile
```

### ページの雛形

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/page-name")({
  component: PageName,
  head: () => ({
    meta: [
      {
        title: "ページタイトル",
      },
      {
        name: "description",
        content: "ページの説明",
      },
    ],
  }),
});

function PageName() {
  return (
    <div>
      <h1>ページ名</h1>
    </div>
  );
}
```

## コンポーネントのインポート

エイリアス (`@/*`) を使用してコンポーネントをインポートできます。

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/example")({
  component: Example,
});

function Example() {
  return (
    <div>
      <h1>サンプルページ</h1>
      <Button onClick={() => alert("clicked")}>クリック</Button>
    </div>
  );
}
```
