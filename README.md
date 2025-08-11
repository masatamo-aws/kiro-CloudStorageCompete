# クラウドストレージサービス比較アプリ

AWS、Microsoft Azure、Google Cloud、Oracle Cloud、IBM Cloudの各クラウドプロバイダが提供するストレージサービスを包括的に比較するWebアプリケーションです。

## 📸 スクリーンショット

### ☀️ ライトモード
![Light Mode](https://github.com/masatamo-aws/kiro-CloudStorageCompete/blob/main/assets/image/Light%20Mode.png)

### 🌙 ダークモード
![Dark Mode](https://github.com/masatamo-aws/kiro-CloudStorageCompete/blob/main/assets/image/Dark%20Mode.png)

## 🚀 機能

### 📊 包括的なサービス比較
- **31のストレージサービス**を網羅
- **5つの主要クラウドプロバイダ**（AWS、Azure、GCP、Oracle、IBM）
- **7つのストレージタイプ**（Object、Block、File、Archive、NoSQL Database、Database Storage、Data Lake）

### 🔍 高度なフィルタリング
- プロバイダ別フィルタ
- ストレージタイプ別フィルタ
- リアルタイム検索機能
- ワンクリックフィルタクリア

### ⚖️ 柔軟な比較機能
- **同一クラウド内比較**: 同じプロバイダ内のサービス比較
- **別クラウド間比較**: 異なるプロバイダ間のサービス比較
- **複数クラウド比較**: 3つ以上のサービスを同時比較
- **ストレージタイプ間比較**: 異なるタイプ間での比較

### 🔄 リアルタイム価格更新
- **公式API連携**: AWS、Azure、GCP等の公式価格APIから最新情報を取得
- **自動更新**: 30分ごとの価格自動更新、ページフォーカス時の更新チェック
- **リアルタイム為替**: 最新の為替レートで正確な円換算表示
- **1時間キャッシュ**: 高速表示と最新性のバランス
- **手動更新**: 🔄更新ボタンで即座に最新価格を取得
- **データソース表示**: 各価格データのソースと更新時刻を表示

### 🌙 ダークモード対応
- **テーマ切り替え**: ☀️ライト / 🌙ダーク モードの選択
- **ラジオボタン**: 直感的なテーマ切り替えUI
- **設定保存**: ローカルストレージでテーマ設定を永続化
- **スムーズトランジション**: 0.3秒のアニメーション効果

### 🌍 地域・リージョン・通貨対応
- **表示モード切り替え**: リージョン別と地域別の表示選択
  - **リージョン別**: 10の主要リージョンから個別選択 + 「全てのリージョン」
  - **地域別**: 4つの地域（日本、アメリカ、東アジア、東南アジア）から選択 + 「全ての地域」
- **包括的表示**: 「全て」オプションですべてのサービスを一覧表示
- **地域・リージョン情報**: すべての表示モードで各サービスの参照リージョン・地域を表示
  - リージョン別: 選択したリージョンの詳細情報
  - 地域別: 地域代表リージョンの情報
  - 全て: 参照リージョンの情報
- **多層価格表示**: 
  - 個別リージョン価格
  - 地域平均価格
  - 全体平均価格
- **プロバイダー利用可能性**: 各地域でのプロバイダー利用可能性を視覚的に表示
- **通貨切り替え**: USD/JPY表示の切り替え
- **設定永続化**: 表示モード、地域/リージョン、通貨設定をローカルストレージで保存

### 📱 レスポンシブデザイン
- デスクトップ、タブレット、モバイル対応
- 直感的なユーザーインターフェース
- ダークモード完全対応

## 🛠️ 技術スタック

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **アーキテクチャ**: SPA (Single Page Application)
- **データ管理**: JSON + LocalStorage
- **状態管理**: ES6 Classes
- **API通信**: Fetch API

## 📁 プロジェクト構成

```
kiro-CloudStorageCompete/
├── index.html                  # メインHTML
├── css/
│   └── styles.css             # スタイルシート
├── js/
│   ├── app.js                 # アプリケーションメイン
│   ├── ThemeManager.js        # テーマ管理（ダークモード）
│   ├── RegionManager.js       # リージョン・地域管理
│   ├── CurrencyManager.js     # 通貨管理
│   ├── DataFetcher.js         # データ取得・管理
│   ├── FilterManager.js       # フィルタ管理
│   ├── CompareManager.js      # 比較機能管理
│   └── UIManager.js           # UI管理
├── data/
│   └── storage-services.json  # ストレージサービスデータ
├── assets/
│   └── image/                 # スクリーンショット画像
│       ├── Light Mode.png     # ライトモード画面
│       └── Dark Mode.png      # ダークモード画面
├── requirements.md            # 仕様書
├── design.md                  # 設計書
├── tasks.md                   # タスク管理
├── logicalarchitecture.md     # 論理アーキテクチャ
├── CHANGELOG.md               # 変更履歴
└── README.md                  # このファイル
```

## 🚀 使用方法

### 1. アプリケーションの起動
```bash
# リポジトリをクローン
git clone https://github.com/masatamo-aws/kiro-CloudStorageCompete.git
cd kiro-CloudStorageCompete

# ブラウザでindex.htmlを開く
open index.html
```

### 2. 基本操作
1. **サービス一覧の確認**: 31のストレージサービスが表示されます
2. **表示モード選択**: ヘッダーの表示方法ドロップダウンで「リージョン別」「地域別」を選択
3. **地域/リージョン選択**: 選択した表示モードに応じて地域またはリージョンを選択
4. **通貨切り替え**: ヘッダーの通貨ドロップダウンでUSD/JPY表示を切り替え
5. **テーマ切り替え**: ヘッダーの☀️ライト/🌙ダークボタンでテーマを選択
6. **フィルタリング**: 左側のフィルタパネルでプロバイダやタイプを絞り込み
7. **検索**: ヘッダーの検索ボックスでサービス名や機能を検索
8. **比較**: チェックボックスでサービスを選択し、「比較する」ボタンをクリック
9. **データ更新**: 🔄更新ボタンで最新データを取得

## 📊 対象ストレージサービス

### AWS (7サービス)
- Amazon S3, S3 Glacier, S3 Glacier Deep Archive
- Amazon EBS, EFS, FSx
- Amazon DynamoDB

### Microsoft Azure (7サービス)
- Azure Blob Storage, Archive Storage
- Azure Managed Disks, Files, NetApp Files
- Azure Cosmos DB, Data Lake Storage

### Google Cloud (7サービス)
- Cloud Storage, Coldline, Archive
- Persistent Disk, Local SSD, Filestore
- Firestore

### Oracle Cloud (5サービス)
- Object Storage, Archive Storage
- Block Volume, File Storage
- Autonomous Database

### IBM Cloud (5サービス)
- Cloud Object Storage, Block Storage, File Storage
- Cloudant, Db2 on Cloud

## 🔧 開発者向け情報

### アーキテクチャ
- **論理アーキテクチャ**: 5層構造（Presentation → Application → Business Logic → Data Access → Data Sources）
- **設計原則**: 関心の分離、単一責任原則、依存性の逆転
- **拡張性**: 新しいプロバイダやサービスの追加が容易

### データ構造
```json
{
  "id": "service-id",
  "name": "Service Name",
  "provider": "Provider",
  "type": "Storage Type",
  "pricing": {
    "ap-northeast-1": {
      "usd": { "storage": 0.023, "requests": 0.0004 },
      "jpy": { "storage": 3.45, "requests": 0.06 }
    }
  },
  "features": {
    "durability": "99.999999999%",
    "availability": "99.99%",
    "encryption": true
  },
  "useCases": ["Use case 1", "Use case 2"]
}
```

## 🤝 コントリビューション

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🔮 今後の予定

- [x] ダークモード対応 ✅
- [x] リージョン・地域・通貨対応 ✅
- [x] 地域・リージョン情報表示 ✅
- [x] プロジェクトドキュメント完成 ✅
- [ ] 各社公式APIとの直接連携強化
- [ ] 価格計算機能（コスト見積もり）
- [ ] エクスポート機能（CSV/JSON/PDF）
- [ ] システムテーマ自動検出
- [ ] 多言語対応（英語/日本語/中国語）
- [ ] PWA対応（オフライン機能）
- [ ] 詳細なサービス仕様比較
- [ ] 価格トレンド表示・履歴機能

## 📞 サポート

問題や質問がある場合は、GitHubのIssuesページでお知らせください。

---

**バージョン**: v1.5.0 (2025-01-08)  
**開発者**: masatamo-aws  
**リポジトリ**: https://github.com/masatamo-aws/kiro-CloudStorageCompete