# コントリビュートガイド

このリポジトリへの貢献方法をまとめます。内部開発でも外部コントリビュートでも同様です。

## 開発のはじめかた

```bash
bun install        # 依存関係のインストール（ルート）
bun run dev        # すべてのアプリを起動（Turbo）
```

## タスク実行

- ビルド: `bun run build`
- 型チェック: `bun run typecheck`
- テスト（全体）: `bun run test:run` / `bun run test:watch`
- Lint/Format: `bun run lint` / `bun run format` / `bun run check`

ワークスペース個別のタスクは各 `apps/*` / `packages/*` の `package.json` を参照してください。

## コーディング規約

- 型安全性を最優先（Zod による実行時検証 + TypeScript）
- AAA（Arrange-Act-Assert）パターンでテスト記述
- 仕様の単一真実源は `@sos26/shared`

## Git Hooks / CI

- コミット前に Lefthook で Biome を実行（自動整形/修正）
- CI 用チェックは `bun run ci` を使用

## ドキュメント

-エントリ: `docs/README.md`
- 変更した仕様や外部公開の影響がある場合は該当ドキュメントも更新してください

