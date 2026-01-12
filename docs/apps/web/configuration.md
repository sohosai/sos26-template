# 設定

## 目次

- [エイリアス](#エイリアス)

## エイリアス

インポートパスを簡潔にするため、エイリアスを設定しています。

### 使用可能なエイリアス

- `@/*` → `src/*`

### 使用例

```tsx
// 相対パスの代わりに
import { Button } from "../../components/Button";

// エイリアスを使用
import { Button } from "@/components/Button";
```

### 設定ファイル

エイリアスは以下のファイルで設定されています：

- `tsconfig.app.json` - TypeScript用
- `vite.config.ts` - Vite用
