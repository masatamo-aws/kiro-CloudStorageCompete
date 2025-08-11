# クラウドストレージサービス比較アプリ 設計書

## アーキテクチャ概要
- **フロントエンド**: SPA (Single Page Application)
- **データ管理**: JSON形式でのリージョン別価格データ管理
- **状態管理**: JavaScript ES6 Classes + LocalStorage
- **リアルタイム機能**: 為替レート取得、自動価格更新
- **テーマシステム**: ライト/ダークモード完全対応
- **地域対応**: 10リージョン + 4地域グループ対応

## ファイル構成
```
kiro-CloudStorageCompete/
├── index.html                  # メインHTML
├── css/
│   └── styles.css             # メインスタイル（ダークモード対応）
├── js/
│   ├── app.js                 # アプリケーションメイン
│   ├── ThemeManager.js        # テーマ管理（ライト/ダーク）
│   ├── RegionManager.js       # リージョン・地域管理
│   ├── CurrencyManager.js     # 通貨管理（USD/JPY）
│   ├── DataFetcher.js         # データ取得・為替レート管理
│   ├── StorageService.js      # ストレージサービス管理
│   ├── FilterManager.js       # フィルタ管理
│   ├── CompareManager.js      # 比較機能管理
│   └── UIManager.js           # UI管理・地域情報表示
├── data/
│   └── storage-services.json  # ストレージサービスデータ（リージョン別価格）
├── requirements.md            # 仕様書
├── design.md                  # 設計書
├── tasks.md                   # タスク管理
├── logicalarchitecture.md     # 論理アーキテクチャ（Mermaid対応）
├── CHANGELOG.md               # 変更履歴
└── README.md                  # プロジェクト概要
```

## データ構造

### ストレージサービスデータ (storage-services.json)
```json
{
  "services": [
    {
      "id": "aws-s3",
      "name": "Amazon S3",
      "provider": "AWS",
      "type": "Object Storage",
      "category": "Object",
      "pricing": {
        "model": "Pay-as-you-go",
        "regions": {
          "ap-northeast-1": {
            "storage": { "usd": 0.023, "jpy": 3.45 },
            "requests": { "usd": 0.0004, "jpy": 0.06 }
          },
          "us-east-1": {
            "storage": { "usd": 0.023, "jpy": 3.45 },
            "requests": { "usd": 0.0004, "jpy": 0.06 }
          }
          // ... 他のリージョン
        }
      },
      "features": {
        "durability": "99.999999999%",
        "availability": "99.99%",
        "encryption": true,
        "versioning": true,
        "lifecycle": true
      },
      "useCases": ["Web applications", "Backup", "Archive"],
      "description": "Scalable object storage service",
      "lastUpdated": "2024-12-19T10:00:00Z",
      "source": "AWS Pricing API"
    }
  ]
}
```

## コンポーネント設計

### 1. CloudStorageApp Class
- アプリケーション全体の初期化・制御
- 30分ごとの自動更新システム
- コンポーネント間の調整
- エラーハンドリング

### 2. ThemeManager Class
- ライト/ダークテーマ管理
- CSSカスタムプロパティ制御
- ローカルストレージでの設定永続化
- ラジオボタンイベント管理

### 3. RegionManager Class
- リージョン・地域選択管理
- 地域別・リージョン別・全体平均価格計算
- プロバイダー利用可能性チェック
- 地域情報マッピング（📍🗺️🌐）

### 4. CurrencyManager Class
- USD/JPY通貨切り替え
- 価格フォーマット処理
- リアルタイム為替レート管理
- 通貨別表示最適化

### 5. DataFetcher Class
- リアルタイム為替レート取得
- 1時間キャッシュシステム
- フォールバックデータ管理
- データ検証・正規化

### 6. StorageService Class
- 31サービスのデータ管理
- サービス情報の取得・検索
- フィルタリング処理
- データ整合性保証

### 7. FilterManager Class
- 複合フィルタリング
- リアルタイム検索
- フィルタ状態管理
- 検索結果最適化

### 8. CompareManager Class
- マルチサービス選択管理
- 比較ロジック実装
- 地域・リージョン情報付き比較結果生成
- 比較モーダルの制御

### 9. UIManager Class
- DOM操作の抽象化
- イベントハンドリング
- 地域・リージョン情報表示
- レスポンシブ対応

## UI設計

### メインレイアウト
```
┌─────────────────────────────────────────────────────────────┐
│ Header                                                      │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐   │
│ │   Search    │Display Mode │Region/Area  │  Currency   │   │
│ │             │Selector     │Selector     │  Selector   │   │
│ └─────────────┴─────────────┴─────────────┴─────────────┘   │
│ ┌─────────────┬─────────────┐ ☀️ライト 🌙ダーク 🔄更新    │
│ │Last Updated │Exchange Rate│                             │
│ └─────────────┴─────────────┘                             │
├─────────────────────────────────────────────────────────────┤
│ Filter Panel                                                │
│ ┌─────────────┬─────────────────────────────────────────┐   │
│ │ Providers   │ Storage Types                           │   │
│ │ ☐ AWS       │ ☐ Object Storage  ☐ Block Storage      │   │
│ │ ☐ Azure     │ ☐ File Storage    ☐ Archive Storage    │   │
│ │ ☐ GCP       │ ☐ NoSQL Database  ☐ Database Storage   │   │
│ │ ☐ Oracle    │ ☐ Data Lake                             │   │
│ │ ☐ IBM       │                                         │   │
│ └─────────────┴─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ Service List Table                                          │
│ ┌─┬──────────────┬─────────┬──────┬────────────┬──────────┐ │
│ │☐│Name          │Provider │Type  │Price       │Available │ │
│ ├─┼──────────────┼─────────┼──────┼────────────┼──────────┤ │
│ │☐│Amazon S3     │AWS      │Object│¥3.45/GB    │99.99%    │ │
│ │ │📍 日本-東京   │         │      │            │          │ │
│ └─┴──────────────┴─────────┴──────┴────────────┴──────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Compare Button (Selected: X)                                │
└─────────────────────────────────────────────────────────────┘
```

### 比較モーダル
```
┌─────────────────────────────────────┐
│ Compare Services            [×]     │
├─────────────────────────────────────┤
│ ┌─────────┬─────────┬─────────────┐ │
│ │Feature  │Service A│Service B    │ │
│ ├─────────┼─────────┼─────────────┤ │
│ │Provider │AWS      │Azure        │ │
│ │Type     │Object   │Object       │ │
│ │Price    │$0.023   │$0.024       │ │
│ └─────────┴─────────┴─────────────┘ │
└─────────────────────────────────────┘
```

## 状態管理
- **選択されたサービス**: `selectedServices[]`
- **アクティブフィルタ**: `activeFilters{}`
- **検索クエリ**: `searchQuery`
- **比較モード**: `compareMode`
- **現在のテーマ**: `currentTheme` (light/dark)
- **現在のリージョン**: `currentRegion` (ap-northeast-1 | all-regions)
- **現在の地域**: `currentArea` (japan | all-areas)
- **表示モード**: `displayMode` (region/area)
- **現在の通貨**: `currentCurrency` (usd/jpy)
- **為替レート**: `exchangeRate`
- **キャッシュデータ**: `cachedData` (1時間TTL)
- **最終更新時刻**: `lastUpdated`

## イベントフロー
1. ページ読み込み → データ取得 → 初期表示
2. フィルタ選択 → データフィルタリング → 表示更新
3. サービス選択 → 選択状態更新 → 比較ボタン更新
4. 比較実行 → 比較データ生成 → モーダル表示

## レスポンシブ対応
- **Desktop**: 3カラムレイアウト
- **Tablet**: 2カラムレイアウト
- **Mobile**: 1カラムレイアウト + ハンバーガーメニュー