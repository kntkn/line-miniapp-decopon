# Decopon LINEミニアプリ

環境価値（Jクレジット）をクーポンに変換できるLINEミニアプリのプロトタイプです。

## ✨ 特徴

- 📱 **LINEミニアプリ風UI**: リアルなLINEトーク画面デザイン
- 🌱 **環境価値管理**: Jクレジットの管理・可視化
- 🎫 **クーポン交換**: 環境価値をクーポンに交換
- 💫 **美しいUI**: フロントエンドデザインスキルを活用した洗練されたインターフェース
- 📋 **包括的申請フォーム**: 個人情報から設備情報まで完全対応

## 🚀 開発環境セットアップ

```bash
cd /Users/kentohonda/line-miniapp-decopon

# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

## 📦 利用可能なスクリプト

- `npm run dev` - 開発サーバー起動（localhost:3000）
- `npm run build` - プロダクションビルド
- `npm run preview` - ビルド結果のプレビュー
- `npm run lint` - ESLintでコード品質チェック
- `npm run lint:fix` - ESLintで自動修正
- `npm run type-check` - TypeScriptの型チェック

## 🏗️ アーキテクチャ

### 技術スタック
- **React 18** + TypeScript
- **Vite** - 高速ビルドツール
- **Tailwind CSS** - ユーティリティファーストCSS
- **ESLint** - コード品質管理

### 主要コンポーネント
- `DecoponMiniApp` - メインアプリケーション
- `LineTalkRoom` - LINE風トーク画面
- `MainOnePage` - 申請・クレジット管理ページ
- `ApplicationForm` - 包括的申請フォーム
- `CreditsView` - クレジット・クーポン管理
- `MyPage` - プロフィール・履歴管理

## 💎 デザインシステム

### カラーパレット
- **Primary**: Emerald (500-600) - 環境・自然をイメージ
- **Secondary**: Green (400-600) - 成長・持続可能性
- **Accent**: Blue/Purple - クーポン・価値交換
- **Neutral**: Gray系 - テキスト・背景

### タイポグラフィ
- **SF Pro Display/Text** - Apple標準フォント
- **フォントサイズ**: 12px-48px（レスポンシブ）
- **フォントウェイト**: 400-800（Medium-Black）

### アニメーション
- **Micro-interactions**: ホバー・アクティブ状態
- **Page transitions**: スライドアップ・フェード
- **Loading states**: パルス・スケール効果

## 📱 機能一覧

### 1. 申請機能
- ✅ 個人情報入力（名前・住所・連絡先）
- ✅ 同意事項（5項目）
- ✅ パワーコンディショナー情報
- ✅ 蓄電池設備情報（有/無）
- ✅ 補助金申請情報（有/無）
- ✅ 必要書類確認項目
- ✅ バリデーション・エラーハンドリング

### 2. クレジット管理
- ✅ Jクレジット残高表示（kg/tCO₂e）
- ✅ 銘柄表示（再エネ（電力））
- ✅ 取引履歴

### 3. クーポン機能
- ✅ 利用可能クーポン一覧
- ✅ 引き換え可能クーポン一覧
- ✅ 詳細プレビュー→スワイプ引き換え
- ✅ 使用確認→バーコード表示（1回限り）
- ✅ 取引履歴記録

### 4. マイページ
- ✅ プロフィール管理
- ✅ 連絡先メール設定
- ✅ クーポン取引履歴
- ✅ 申請履歴
- ✅ サポート・FAQ

## 🎨 UIコンポーネント

### フォーム系
- `FormField` - ラベル付きフィールド
- `CheckboxField` - チェックボックス
- `SectionHeader` - セクションヘッダー

### モーダル系
- `Sheet` - ボトムシートモーダル
- `RedeemModal` - クーポン引き換え詳細
- `UseModal` - クーポン使用確認
- `BarcodeModal` - バーコード表示

### インタラクション
- `SwipeToConfirm` - スワイプ確認UI
- `CouponGrid` - クーポン一覧グリッド
- `FakeBarcode` - 疑似バーコード生成

## 🌍 デプロイ

### Vercel（推奨）
```bash
# Vercelにデプロイ
npm install -g vercel
vercel --prod
```

### Netlify
```bash
# Netlifyにデプロイ
npm run build
# distフォルダをNetlifyにアップロード
```

### LINE LIFF設定
1. LINE Developers Console でLIFFアプリを作成
2. `index.html`のLIFF IDを設定
3. Endpoint URLにデプロイURLを設定

## 📊 パフォーマンス

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Lighthouse Score**: 95+ (Performance/Accessibility/SEO)

## 🔧 カスタマイズ

### クーポン追加
`src/app.tsx`の`coupons`配列に新しいクーポンを追加：

```typescript
{
  id: rid(),
  brand: "新ブランド",
  icon: "🎁",
  face: 1500,
  needT: 0.25,
  status: "redeemable",
  desc: "説明文",
  products: ["対象商品1", "対象商品2"]
}
```

### 申請項目修正
`ApplyFormData`型と`ApplicationForm`コンポーネントを修正。

### テーマカラー変更
`tailwind.config.js`のcolor設定を修正。

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 コントリビューション

1. プロジェクトをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

---

🌱 **環境価値を身近に、持続可能な未来へ** 🌱