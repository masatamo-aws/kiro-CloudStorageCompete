class CloudStorageApp {
    constructor() {
        this.themeManager = new ThemeManager();
        this.regionManager = new RegionManager();
        this.currencyManager = new CurrencyManager();
        this.storageService = new StorageService();
        this.compareManager = new CompareManager(this.storageService, this.regionManager, this.currencyManager);
        this.uiManager = new UIManager(this.compareManager, this.regionManager, this.currencyManager);
        this.filterManager = new FilterManager(this.storageService, this.uiManager);
        this.initializeRefreshButton();
        this.initializeRegionCurrencyEvents();
        this.initializeAutoUpdate();
    }

    initializeRefreshButton() {
        const refreshBtn = document.getElementById('refreshDataBtn');
        refreshBtn.addEventListener('click', () => this.refreshData());
    }

    initializeRegionCurrencyEvents() {
        // リージョン、地域、通貨が変更された時にテーブルを更新
        document.addEventListener('regionChanged', () => {
            this.updateDisplayAfterChange();
        });
        
        document.addEventListener('areaChanged', () => {
            this.updateDisplayAfterChange();
        });
        
        document.addEventListener('displayModeChanged', () => {
            this.updateDisplayAfterChange();
        });
        
        document.addEventListener('currencyChanged', () => {
            this.updateDisplayAfterChange();
        });
    }

    updateDisplayAfterChange() {
        // 現在のフィルタ状態を保持してテーブルを更新
        const filteredServices = this.storageService.getFilteredServices();
        this.uiManager.updateServiceTable(filteredServices);
    }

    initializeAutoUpdate() {
        // 30分ごとに価格を自動更新
        setInterval(async () => {
            try {
                console.log('自動価格更新を実行中...');
                await this.refreshData();
                console.log('自動価格更新完了');
            } catch (error) {
                console.error('自動価格更新エラー:', error);
            }
        }, 30 * 60 * 1000); // 30分

        // ページがフォーカスを取得した時に更新チェック
        document.addEventListener('visibilitychange', async () => {
            if (!document.hidden) {
                const lastUpdated = localStorage.getItem('lastUpdated');
                if (lastUpdated) {
                    const timeSinceUpdate = Date.now() - new Date(lastUpdated).getTime();
                    const updateThreshold = 15 * 60 * 1000; // 15分
                    
                    if (timeSinceUpdate > updateThreshold) {
                        console.log('ページフォーカス時の価格更新を実行中...');
                        await this.refreshData();
                    }
                }
            }
        });
    }

    async initialize() {
        try {
            this.uiManager.showLoading();
            
            // サービスデータを読み込み
            const services = await this.storageService.loadServices();
            
            if (services.length === 0) {
                this.uiManager.showError('サービスデータの読み込みに失敗しました');
                return;
            }

            // 初期表示
            this.uiManager.updateServiceTable(services);
            this.updateLastUpdatedDisplay();
            
            console.log(`${services.length}個のストレージサービスを読み込みました`);
            
        } catch (error) {
            console.error('アプリケーションの初期化に失敗しました:', error);
            this.uiManager.showError('アプリケーションの初期化に失敗しました');
        }
    }

    async refreshData() {
        try {
            const refreshBtn = document.getElementById('refreshDataBtn');
            refreshBtn.disabled = true;
            refreshBtn.textContent = '更新中...';
            
            this.uiManager.showLoading();
            
            // 最新データを取得
            const services = await this.storageService.refreshData();
            
            // 表示を更新
            this.uiManager.updateServiceTable(services);
            this.updateLastUpdatedDisplay();
            
            // フィルタを再適用
            this.filterManager.applyFilters();
            
            console.log('データを更新しました');
            
        } catch (error) {
            console.error('データ更新に失敗しました:', error);
            this.uiManager.showError('データ更新に失敗しました');
        } finally {
            const refreshBtn = document.getElementById('refreshDataBtn');
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 更新';
        }
    }

    updateLastUpdatedDisplay() {
        const lastUpdated = localStorage.getItem('lastUpdated');
        const lastUpdatedElement = document.getElementById('lastUpdated');
        
        if (lastUpdated && lastUpdatedElement) {
            const date = new Date(lastUpdated);
            lastUpdatedElement.textContent = `価格最終更新: ${date.toLocaleString('ja-JP')}`;
        }

        // 為替レート情報を表示
        const exchangeRate = localStorage.getItem('exchangeRate');
        const exchangeRateElement = document.getElementById('exchangeRate');
        
        if (exchangeRate && exchangeRateElement) {
            const lastRateUpdate = localStorage.getItem('lastExchangeRateUpdate');
            if (lastRateUpdate) {
                const rateDate = new Date(lastRateUpdate);
                exchangeRateElement.textContent = `為替レート: 1 USD = ${parseFloat(exchangeRate).toFixed(2)} JPY (${rateDate.toLocaleString('ja-JP')})`;
            } else {
                exchangeRateElement.textContent = `為替レート: 1 USD = ${parseFloat(exchangeRate).toFixed(2)} JPY`;
            }
        }
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', async () => {
    const app = new CloudStorageApp();
    await app.initialize();
});