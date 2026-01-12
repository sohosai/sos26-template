# スタイル

このプロジェクトでは CSS Modules (SCSS) を採用しています。

## 目次

- [ファイル命名規則](#ファイル命名規則)
- [使い方](#使い方)
- [CSS Modules の利点](#css-modules-の利点)

## ファイル命名規則

コンポーネントのスタイルは `.module.scss` 拡張子を使用します。

```
ComponentName.module.scss
```

## 使い方

```tsx
// ComponentName.tsx
import styles from "./ComponentName.module.scss";

export function ComponentName() {
  return <div className={styles.container}>コンテンツ</div>;
}
```

```scss
// ComponentName.module.scss
.container {
  padding: 1rem;
  background-color: #f0f0f0;

  &:hover {
    background-color: #e0e0e0;
  }
}
```

## CSS Modules の利点

- **スコープの分離**: クラス名の衝突を防ぐ
- **SCSS機能**: ネスト、変数、ミックスインなどが使用可能
- **型安全**: TypeScriptでクラス名の補完が効く
