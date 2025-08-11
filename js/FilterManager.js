class FilterManager {
    constructor(storageService, uiManager) {
        this.storageService = storageService;
        this.uiManager = uiManager;
        this.activeFilters = {
            providers: [],
            types: [],
            searchQuery: ''
        };
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // プロバイダフィルタ
        const providerCheckboxes = document.querySelectorAll('#providerFilters input[type="checkbox"]');
        providerCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleProviderFilter());
        });

        // タイプフィルタ
        const typeCheckboxes = document.querySelectorAll('#typeFilters input[type="checkbox"]');
        typeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleTypeFilter());
        });

        // 検索
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // フィルタクリア
        const clearButton = document.getElementById('clearFilters');
        clearButton.addEventListener('click', () => this.clearAllFilters());
    }

    handleProviderFilter() {
        const checkedProviders = Array.from(
            document.querySelectorAll('#providerFilters input[type="checkbox"]:checked')
        ).map(checkbox => checkbox.value);
        
        this.activeFilters.providers = checkedProviders;
        this.applyFilters();
    }

    handleTypeFilter() {
        const checkedTypes = Array.from(
            document.querySelectorAll('#typeFilters input[type="checkbox"]:checked')
        ).map(checkbox => checkbox.value);
        
        this.activeFilters.types = checkedTypes;
        this.applyFilters();
    }

    handleSearch(query) {
        this.activeFilters.searchQuery = query;
        this.applyFilters();
    }

    applyFilters() {
        const filteredServices = this.storageService.filterServices(this.activeFilters);
        this.uiManager.updateServiceTable(filteredServices);
    }

    clearAllFilters() {
        // チェックボックスをすべてチェック
        document.querySelectorAll('#providerFilters input[type="checkbox"]').forEach(cb => cb.checked = true);
        document.querySelectorAll('#typeFilters input[type="checkbox"]').forEach(cb => cb.checked = true);
        
        // 検索フィールドをクリア
        document.getElementById('searchInput').value = '';

        // フィルタをリセット
        this.activeFilters = {
            providers: [],
            types: [],
            searchQuery: ''
        };

        // 全サービスを表示
        this.uiManager.updateServiceTable(this.storageService.getAllServices());
    }

    getActiveFilters() {
        return this.activeFilters;
    }
}