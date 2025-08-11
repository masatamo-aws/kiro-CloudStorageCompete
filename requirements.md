# クラウドストレージサービス比較アプリ 仕様書

## 概要
AWS, Microsoft Azure, Google Cloud, Oracle Cloud, IBM Cloud の各クラウドプロバイダが提供する31のストレージサービスを包括的に比較するWebアプリケーション。リージョン別価格、通貨切り替え、ダークモード、リアルタイム更新機能を搭載。

## 機能要件

### 1. ストレージサービス一覧表示
- **31サービス表示**: 各クラウドプロバイダの全ストレージサービスを一覧表示
- **詳細情報**: サービス名、プロバイダ、ストレージタイプ、価格、特徴、地域情報を表示
- **地域情報表示**: 各サービスの参照リージョン・地域を視覚的に表示（📍🗺️🌐）
- **リアルタイム価格**: 選択したリージョン・通貨での最新価格表示

### 2. 地域・リージョン・通貨機能
- **表示モード切り替え**: リージョン別と地域別の表示選択
- **リージョン選択**: 10の主要リージョンから個別選択 + 「全てのリージョン」
- **地域選択**: 4つの地域（日本、アメリカ、東アジア、東南アジア）+ 「全ての地域」
- **通貨切り替え**: USD/JPY表示の切り替え
- **価格計算**: 個別リージョン価格、地域平均価格、全体平均価格
- **為替レート**: リアルタイム為替レート取得・表示

### 3. 比較機能
- **同一クラウド内比較**: 同じプロバイダ内のサービス比較
- **別クラウド間比較**: 異なるプロバイダ間のサービス比較
- **複数クラウド比較**: 3つ以上のサービスを同時比較
- **ストレージタイプ間比較**: Object, Block, File, Archive等の異なるタイプ間比較
- **地域情報付き比較**: 比較モーダルで各サービスの参照リージョン情報を表示

### 4. フィルタリング・検索機能
- **プロバイダ別フィルタ**: AWS, Azure, GCP, Oracle, IBM
- **ストレージタイプ別フィルタ**: Object, Block, File, Archive, NoSQL Database, Database Storage, Data Lake
- **リアルタイム検索**: サービス名、機能、特徴での検索
- **フィルタクリア**: ワンクリックでフィルタリセット

### 5. テーマ・UI機能
- **ダークモード**: ライト/ダークテーマの切り替え
- **設定永続化**: テーマ、リージョン、通貨設定をローカルストレージで保存
- **レスポンシブデザイン**: デスクトップ、タブレット、モバイル対応
- **アクセシビリティ**: 適切なコントラスト比、キーボードナビゲーション

### 6. データ更新機能
- **リアルタイム更新**: 各社公式APIからの最新価格情報取得
- **自動更新**: 30分ごとの価格自動更新
- **手動更新**: 🔄更新ボタンで即座に最新価格を取得
- **キャッシュシステム**: 1時間キャッシュで高速表示と最新性を両立

## 対象ストレージサービス

### AWS
- **Object Storage**: S3, S3 Glacier, S3 Intelligent-Tiering
- **Block Storage**: EBS
- **File Storage**: EFS, FSx
- **Database Storage**: DynamoDB, RDS Storage
- **Archive**: S3 Glacier Deep Archive

### Microsoft Azure
- **Object Storage**: Blob Storage, Data Lake Storage
- **Block Storage**: Managed Disks
- **File Storage**: Files, NetApp Files
- **Database Storage**: Cosmos DB, SQL Database Storage
- **Archive**: Archive Storage

### Google Cloud
- **Object Storage**: Cloud Storage
- **Block Storage**: Persistent Disk, Local SSD
- **File Storage**: Filestore
- **Database Storage**: Cloud SQL Storage, Firestore
- **Archive**: Coldline, Archive

### Oracle Cloud
- **Object Storage**: Object Storage, Archive Storage
- **Block Storage**: Block Volume
- **File Storage**: File Storage
- **Database Storage**: Autonomous Database Storage

### IBM Cloud
- **Object Storage**: Cloud Object Storage
- **Block Storage**: Block Storage
- **File Storage**: File Storage
- **Database Storage**: Cloudant, Db2 Storage

## 技術要件

### フロントエンド技術
- **HTML5**: セマンティックマークアップ、アクセシビリティ対応
- **CSS3**: Flexbox、Grid、レスポンシブデザイン、カスタムプロパティ（テーマ管理）
- **JavaScript (ES6+)**: モジュール、クラス、async/await、Fetch API
- **SPA**: Single Page Application アーキテクチャ

### データ管理
- **データ形式**: JSON（リージョン別価格構造）
- **状態管理**: LocalStorage + In-Memory State
- **キャッシュ戦略**: 1時間TTL、フォールバック対応
- **為替レート**: リアルタイム取得・キャッシュ

### API連携
- **HTTP通信**: Fetch API
- **外部API**: AWS Pricing API、Azure Pricing API、GCP Billing API、Exchange Rate API
- **エラーハンドリング**: Promise.allSettled による堅牢な処理
- **CORS対応**: プロキシ準備、フォールバック実装

### ブラウザ対応
- **モダンブラウザ**: Chrome, Firefox, Safari, Edge (最新版)
- **ES6+対応**: 必須
- **LocalStorage**: 必須

## UI/UX要件

### ユーザビリティ
- **直感的インターフェース**: 分かりやすいアイコンとラベル
- **視覚的区別**: 📍🗺️🌐アイコンによる表示モード識別
- **情報の透明性**: データソース、更新時刻、参照リージョンの明確な表示
- **操作の一貫性**: 統一されたUI要素とインタラクション

### レスポンシブデザイン
- **デスクトップ**: 3カラムレイアウト、フル機能
- **タブレット**: 2カラムレイアウト、最適化されたコントロール
- **モバイル**: 1カラムレイアウト、タッチ最適化

### アクセシビリティ
- **WAI-ARIA対応**: 適切なラベルとロール
- **キーボードナビゲーション**: 全機能のキーボード操作対応
- **コントラスト比**: WCAG 2.1 AA準拠
- **スクリーンリーダー対応**: 適切な読み上げ順序

### パフォーマンス
- **初期読み込み**: 3秒以内
- **操作レスポンス**: 100ms以内
- **データ更新**: バックグラウンド処理
- **メモリ使用量**: 効率的な状態管理