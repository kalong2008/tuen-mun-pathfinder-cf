#### Frontmatter 欄位

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `id` | 是 | 檔名 slug，例如 `you4920-swimmer-ii` |
| `code` | 是 | 專章編號，例如 `YOU4920` |
| `nameZh` | 是 | 中文名稱 |
| `nameEn` | 否 | 英文名稱 |
| `aliases` | 否 | 別名陣列；沒有則寫 `aliases: []` |
| `category` | 是 | `community` / `arts-crafts` / `household` / `nature` / `recreation` / `spiritual`；檔案放在 `content/{category}/` |
| `answerSource` | 是 | `translated` 或 `draft`（見下表） |
| `answerSourceNote` | 否 | 編輯備註，不用加括號 |
| `status` | 是 | `non-review` 或 `reviewed` |

#### answerSource 選項

| answerSource | 有答案？ | 頁尾顯示 |
| --- | --- | --- |
| `draft` | 否 | 答案待核對 |
| `draft` | 是 | 英文 Award Book 2020 未有 Supporting Answers；答案按中文要求由 AI 草擬 |
| `translated` | 是 | 答案取自英文 Award Book 2020 Supporting Answers，並以 AI 翻譯成中文 |

#### Frontmatter 範例

```yaml
---
id: you4920-swimmer-ii
code: YOU4920
nameZh: "游泳 II"
nameEn: "Swimmer II"
aliases:
  - "游泳II"
category: recreation
answerSource: translated
status: non-review
---
```

AI 草擬：

```yaml
answerSource: draft
```

翻譯 + 備註：

```yaml
answerSource: translated
answerSourceNote: "PDF 僅有部分 Supporting Answers"
```

#### 正文結構

- `## 要求` — 中文要求（有序 / 無序列表）
- `## 答案` — 答案整理，方便職員帶領：
  - 開頭可寫 `榮譽證目的：`（整體為何考此證）
  - 每段以 `### 要求 N` 開頭
  - 除知識內容外，盡量附：`帶領提示：`／`教學理念：`、`材料：`、`程序：`／`步驟：`、`注意：`／`安全注意：`
  - 系統會把上述標題排成小標題，方便閱讀
