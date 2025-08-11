class StorageService {
    constructor() {
        this.services = [];
        this.filteredServices = [];
        this.dataFetcher = new DataFetcher();
    }

    async loadServices() {
        try {
            console.log('最新のストレージサービス情報を取得中...');
            
            // DataFetcherから最新データを取得
            this.services = await this.dataFetcher.getData();
            this.filteredServices = [...this.services];
            
            console.log(`${this.services.length}個のサービスを読み込みました`);
            
            // 最終更新時刻を表示
            const lastUpdated = localStorage.getItem('lastUpdated');
            if (lastUpdated) {
                console.log(`データ最終更新: ${new Date(lastUpdated).toLocaleString()}`);
            }
            
            return this.services;
        } catch (error) {
            console.error('サービスデータの読み込みに失敗しました:', error);
            // フォールバックデータを使用
            this.services = this.dataFetcher.getFallbackData();
            this.filteredServices = [...this.services];
            return this.services;
        }
    }

    async refreshData() {
        try {
            console.log('データを強制更新中...');
            this.services = await this.dataFetcher.fetchLatestData();
            this.filteredServices = [...this.services];
            return this.services;
        } catch (error) {
            console.error('データ更新に失敗しました:', error);
            return this.services;
        }
    }

    getAllServices() {
        return this.services;
    }

    getFilteredServices() {
        return this.filteredServices;
    }

    getServiceById(id) {
        return this.services.find(service => service.id === id);
    }

    getProviders() {
        return [...new Set(this.services.map(service => service.provider))];
    }

    getTypes() {
        return [...new Set(this.services.map(service => service.type))];
    }

    filterServices(filters) {
        this.filteredServices = this.services.filter(service => {
            // プロバイダフィルタ
            if (filters.providers && filters.providers.length > 0) {
                if (!filters.providers.includes(service.provider)) {
                    return false;
                }
            }

            // タイプフィルタ
            if (filters.types && filters.types.length > 0) {
                if (!filters.types.includes(service.type)) {
                    return false;
                }
            }

            // 検索クエリ
            if (filters.searchQuery) {
                const query = filters.searchQuery.toLowerCase();
                const searchableText = `${service.name} ${service.description} ${service.useCases.join(' ')}`.toLowerCase();
                if (!searchableText.includes(query)) {
                    return false;
                }
            }

            return true;
        });

        return this.filteredServices;
    }

    searchServices(query) {
        if (!query) {
            this.filteredServices = [...this.services];
            return this.filteredServices;
        }

        const searchQuery = query.toLowerCase();
        this.filteredServices = this.services.filter(service => {
            const searchableText = `${service.name} ${service.description} ${service.useCases.join(' ')}`.toLowerCase();
            return searchableText.includes(searchQuery);
        });

        return this.filteredServices;
    }
}