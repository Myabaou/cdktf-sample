# CloudFront Functions

このディレクトリには CloudFront Functions で実行される JavaScript コードのテンプレートが含まれています。

## ファイル構成

- `ip-restriction.ts`: IP 制限機能の CloudFront Function
- `index.ts`: 各 Function のエクスポート（将来の拡張用）

## CloudFront Functions について

CloudFront Functions は以下の特徴があります：

- **軽量**: シンプルな JavaScript 実行環境
- **高速**: 低レイテンシでリクエスト処理
- **エッジ実行**: 全世界のエッジロケーションで実行
- **制限**: ランタイムは 1ms、メモリは 2MB

## 開発時の注意点

1. **ES5 準拠**: モダンな JavaScript 機能は使用不可
2. **外部ライブラリ**: インポート不可
3. **デバッグ**: CloudWatch ログで確認
4. **テスト**: AWS コンソールでテスト実行可能

## IP 制限機能

`ip-restriction.ts` では以下の機能を提供：

- CIDR 形式の IP 範囲サポート
- 単一 IP 指定サポート
- カスタムエラーページ表示
- 許可 IP リストの動的設定
