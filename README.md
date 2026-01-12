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

ビルド成果物（`dist`）と Turborepo のキャッシュ（`.turbo`）のみを削除します。
依存関係は保持されるため、すぐに開発を再開できます。

### 完全なクリーンアップ

```bash
bun run clean:all
```

上記に加えて、すべての `node_modules` も削除します。
実行後は `bun install` で依存関係を再インストールする必要があります。

## コード品質

### Lint と Format

```bash
# コードをチェックして自動修正
bun run check

# Lint のみ実行
bun run lint

# フォーマットのみ実行
bun run format

# CI で使用（自動修正なし）
bun run ci
```

**Biome** を使用してコードの Lint とフォーマットを行っています。
厳格なルールセットにより、コード品質を保証しています。

### Git Hooks

**Lefthook** により、コミット前に Biome によるチェックと自動修正が実行されます。
ステージングされたファイルのみが対象となり、修正されたファイルは自動的に再ステージングされます。
これにより、コードベースの品質が常に保たれます。

## テスト

```bash
# テストを実行
bun test

# カバレッジ付きでテストを実行
bun run test:coverage
```

**Vitest** を使用してユニットテストを実行します。

詳細は [テストガイド](./docs/testing.md) を参照してください。

## 技術スタック

### モノレポ管理
- **Turborepo**: タスクの並列実行とキャッシング
- **Bun**: パッケージマネージャー・ランタイム

### コード品質
- **Biome**: Linter と Formatter（厳格なルールセット）
- **Lefthook**: Git Hooks 管理
- **Vitest**: ユニットテストフレームワーク

### API (`apps/api`)
- **Hono**: 軽量な Web フレームワーク
- **Bun**: ランタイム

### Web (`apps/web`)
- **React 19**: UI ライブラリ
- **Vite**: ビルドツール
- **TypeScript**: 型安全性

### 共有パッケージ (`packages/shared`)
- **TypeScript**: 型定義と共有コード
- **Zod**: スキーマ定義とバリデーション（api/web 間で型を共有）

### TypeScript 設定
- **Project References**: モノレポ間の型参照を最適化
- **Composite プロジェクト**: shared パッケージで型定義を生成
- **統一されたビルド出力**: すべて `dist/` ディレクトリに出力

## Turbo タスク

プロジェクトでは以下のタスクが Turborepo で管理されています：

- `dev`: 開発サーバーの起動（キャッシュなし、永続的）
- `build`: ビルド実行（依存関係を考慮、出力先: `dist/`）
- `clean`: ビルド成果物とキャッシュのクリーンアップ

詳細は `turbo.json` を参照してください。

**注意**: `typecheck` は TypeScript Project References を活用するため、Turbo を経由せず直接 `tsc -b` を実行します。

## 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `bun run dev` | すべてのアプリの開発サーバーを起動 |
| `bun run build` | すべてのパッケージをビルド |
| `bun test` | テストを実行 |
| `bun run test:coverage` | カバレッジ付きでテストを実行 |
| `bun run typecheck` | TypeScript の型チェックを実行 |
| `bun run lint` | Biome でコードを検証 |
| `bun run format` | Biome でコードをフォーマット |
| `bun run check` | Biome で検証とフォーマットを実行（自動修正） |
| `bun run ci` | Biome で CI チェック（自動修正なし） |
| `bun run clean` | ビルド成果物とキャッシュを削除 |
| `bun run clean:all` | 上記 + node_modules も削除 |
