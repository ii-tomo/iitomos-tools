# QRスキャナーUIの改善と同期 - ウォークスルー

公開用QRツールを最新のUI（カメラガイド、自動リダイレクト等）にアップデートしました。

## 変更内容

### ユーザーインターフェース
- **カメラガイドの追加**: [popup.css](file:///c:/Users/momo_/Antigravity開発/iitomos-tools/qr/popup.css) にスキャンラインとコーナーガイドのスタイルを追加し、スキャン中の視認性を向上させました。
- **バージョン情報の更新**: [index.html](file:///c:/Users/momo_/Antigravity開発/iitomos-tools/qr/index.html) のバージョン表記を `v1.3.0` に更新しました。

### 機能実装
- **自動リダイレクト**: [popup.js](file:///c:/Users/momo_/Antigravity開発/iitomos-tools/qr/popup.js) に、読み取った内容がURLの場合に自動で別タブで開く機能を追加しました。
- **同期の最適化**: `banbi` 側で先行して実装されていた最新のフロントエンドロジックを `iitomos-tools` にも適用し、両方のツールで一貫した体験を提供します。

> [!NOTE]
> プライバシー維持のため、サーバーサイドのBitly API（shorten.js）は公開版には含まれていません。短縮URL作成時は自動的に `v.gd` が使用されます。
