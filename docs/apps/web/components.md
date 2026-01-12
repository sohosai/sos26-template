# コンポーネント

## 共通コンポーネント

共通で使用するコンポーネントは `src/components` 配下にファイルベースで作成します。

### ディレクトリ構造

```
src/components/
└── ComponentName/
    ├── ComponentName.tsx         # コンポーネント本体
    ├── ComponentName.module.scss # スタイル
    ├── ComponentName.test.ts     # テスト（任意）
    └── index.ts                  # 再エクスポート
```

### 例: Buttonコンポーネント

```tsx
// src/components/Button/Button.tsx
import type { ReactNode } from "react";
import styles from "./Button.module.scss";

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
};

export function Button({ children, onClick }: ButtonProps) {
  return (
    <button type="button" className={styles.button} onClick={onClick}>
      {children}
    </button>
  );
}
```

```scss
// src/components/Button/Button.module.scss
.button {
  padding: 0.5rem 1rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;

  &:hover {
    background-color: #1d4ed8;
  }
}
```

```ts
// src/components/Button/index.ts
export { Button } from "./Button";
```

### 使い方

```tsx
import { Button } from "@/components/Button";

function Example() {
  return <Button onClick={() => console.log("clicked")}>ボタン</Button>;
}
```

## ページ固有のコンポーネント

特定のページやルートでのみ使用するコンポーネントは、使う場所の `components` ディレクトリに作成します。

### ディレクトリ構造

```
src/routes/
└── settings/
    ├── index.tsx
    └── components/
        └── UserSettings/
            ├── UserSettings.tsx
            ├── UserSettings.module.scss
            └── index.ts
```

### 例: UserSettingsコンポーネント

```tsx
// src/routes/settings/components/UserSettings/UserSettings.tsx
import styles from "./UserSettings.module.scss";

export function UserSettings() {
  return (
    <div className={styles.container}>
      <h2>ユーザー設定</h2>
      {/* ... */}
    </div>
  );
}
```

```scss
// src/routes/settings/components/UserSettings/UserSettings.module.scss
.container {
  padding: 1rem;
}
```

```ts
// src/routes/settings/components/UserSettings/index.ts
export { UserSettings } from "./UserSettings";
```

### 使い方

```tsx
// src/routes/settings/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { UserSettings } from "./components/UserSettings";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  return (
    <div>
      <h1>設定</h1>
      <UserSettings />
    </div>
  );
}
```
