# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## セッション開始時の必須手順

**毎回必ず以下を実行してから作業を開始すること。**

```bash
date '+%Y年%m月%d日 %H:%M'
git status
git log --oneline -5
git fetch origin
git log HEAD..origin/$(git branch --show-current) --oneline
```

### 報告（1行で簡潔に）

```
📅 YYYY/MM/DD HH:MM　ブランチ: xxx　最新: "コミットメッセージ"　状態: クリーン or 変更あり/diverged
```

異常があれば1行追加して内容を伝え、指示を仰ぐ。

### 確認後の判断ルール

| 状態 | やること |
|---|---|
| ローカルに未コミットの変更がある | 必ずユーザーに報告して指示を仰ぐ。自動でpull・stash・上書きしない |
| 両方に新しいコミット（diverged） | コンフリクトの可能性をユーザーに伝え、方針を確認してから動く |
| リモートのみ進んでいる | pullしてよいか確認する |
| ローカルのみ進んでいる | 特に問題なし。必要に応じてpushを提案する |

---

## 安全ルール

1. 不明な点・おかしいと思った点は必ずユーザーに確認してから実行する
2. 以下の操作は事前に説明し、ユーザーの明示的な許可を得てから実行する
   - git pull（ローカルに変更がある場合）
   - git reset・git checkout .・git restore .（変更の破棄）
   - git push --force（原則禁止）
   - 既存ファイルの大幅な書き換え・削除
3. 複数端末で同じリポジトリを操作している可能性を常に意識する
