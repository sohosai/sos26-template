# sos26-template

Turborepo + Bun を使用したモノレポテンプレート

## プロジェクト構成

```
.
├── apps/
│   ├── api/         # Hono を使用した API サーバー（Bun ランタイム）
│   └── web/         # React + Vite のフロントエンドアプリケーション
└── packages/
    └── shared/      # アプリ間で共有するコードやユーティリティ
```

## 必要な環境

- **Bun**: 1.2.10 以上

## セットアップ

### 1. 依存関係のインストール

```bash
bun install
```

## 開発

### すべてのアプリを同時に起動

```bash
bun run dev
```

このコマンドで `api` と `web` が同時に起動します。

### 個別のアプリを起動

#### API サーバー

```bash
cd apps/api
bun run dev
```

#### Web アプリ

```bash
cd apps/web
bun run dev
```

## ビルド

### すべてのパッケージをビルド

```bash
bun run build
```

### 型チェック

```bash
bun run typecheck
```

## クリーンアップ

### ビルド成果物のみをクリーン（推奨）

```bash
bun run clean
```

ビルド成果物（`dist`、`build`）とキャッシュファイル（`.turbo`、`.tsbuildinfo`）のみを削除します。
依存関係は保持されるため、すぐに開発を再開できます。

### 完全なクリーンアップ

```bash
bun run clean:all
```

上記に加えて、すべての `node_modules` も削除します。
実行後は `bun install` で依存関係を再インストールする必要があります。

## 技術スタック

### モノレポ管理
- **Turborepo**: タスクの並列実行とキャッシング
- **Bun**: パッケージマネージャー・ランタイム

### API (`apps/api`)
- **Hono**: 軽量な Web フレームワーク
- **Bun**: ランタイム

### Web (`apps/web`)
- **React 19**: UI ライブラリ
- **Vite**: ビルドツール
- **TypeScript**: 型安全性

### 共有パッケージ (`packages/shared`)
- **TypeScript**: 型定義と共有コード

## Turbo タスク

プロジェクトでは以下のタスクが Turborepo で管理されています：

- `dev`: 開発サーバーの起動（キャッシュなし、永続的）
- `build`: ビルド実行（依存関係を考慮）
- `typecheck`: TypeScript の型チェック
- `lint`: ESLint によるコード検証
- `preview`: ビルドしたアプリのプレビュー
- `clean`: ビルド成果物とキャッシュのクリーンアップ

詳細は `turbo.json` を参照してください。

## 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `bun run dev` | すべてのアプリの開発サーバーを起動 |
| `bun run build` | すべてのパッケージをビルド |
| `bun run typecheck` | TypeScript の型チェックを実行 |
| `bun run lint` | ESLint でコードを検証 |
| `bun run clean` | ビルド成果物とキャッシュを削除 |
| `bun run clean:all` | 上記 + node_modules も削除 |
