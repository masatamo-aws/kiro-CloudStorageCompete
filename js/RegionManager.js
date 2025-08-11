class RegionManager {
    constructor() {
        // 地域とリージョンのマッピング
        this.regionGroups = {
            'japan': {
                name: '日本',
                regions: {
                    'ap-northeast-1': '東京',
                    'ap-northeast-3': '大阪'
                }
            },
            'usa': {
                name: 'アメリカ',
                regions: {
                    'us-east-1': 'バージニア北部',
                    'us-east-2': 'オハイオ',
                    'us-west-1': 'カリフォルニア北部',
                    'us-west-2': 'オレゴン'
                }
            },
            'east-asia': {
                name: '東アジア',
                regions: {
                    'ap-northeast-2': 'ソウル',
                    'ap-east-2': '台湾'
                }
            },
            'southeast-asia': {
                name: '東南アジア',
                regions: {
                    'ap-east-1': '香港',
                    'ap-southeast-1': 'シンガポール'
                }
            }
        };

        // 全リージョンのフラットマップ
        this.regions = {};
        Object.values(this.regionGroups).forEach(group => {
            Object.assign(this.regions, group.regions);
        });

        // プロバイダー別リージョン対応表
        this.providerRegions = {
            'AWS': {
                'japan': ['ap-northeast-1', 'ap-northeast-3'],
                'usa': ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'],
                'east-asia': ['ap-northeast-2'],
                'southeast-asia': ['ap-east-1', 'ap-southeast-1']
            },
            'Azure': {
                'japan': ['japaneast', 'japanwest'],
                'usa': ['eastus', 'eastus2', 'westus', 'westus2'],
                'east-asia': ['koreacentral'],
                'southeast-asia': ['eastasia', 'southeastasia']
            },
            'GCP': {
                'japan': ['asia-northeast1', 'asia-northeast2'],
                'usa': ['us-east1', 'us-east4', 'us-west1', 'us-west2'],
                'east-asia': ['asia-northeast3'],
                'southeast-asia': ['asia-east1', 'asia-southeast1']
            },
            'Oracle': {
                'japan': ['ap-tokyo-1', 'ap-osaka-1'],
                'usa': ['us-ashburn-1', 'us-phoenix-1'],
                'east-asia': ['ap-seoul-1'],
                'southeast-asia': ['ap-singapore-1']
            },
            'IBM': {
                'japan': ['jp-tok', 'jp-osa'],
                'usa': ['us-east', 'us-south'],
                'east-asia': ['kr-seo'],
                'southeast-asia': ['au-syd']
            }
        };
        
        this.currentRegion = this.getStoredRegion() || 'all-regions';
        this.displayMode = this.getStoredDisplayMode() || 'region'; // 'region' or 'area'
        this.currentArea = this.getStoredArea() || 'all-areas';
        this.initializeRegionSelector();
    }

    initializeRegionSelector() {
        this.initializeDisplayModeSelector();
        this.updateRegionSelector();
    }

    initializeDisplayModeSelector() {
        const displayModeSelector = document.getElementById('displayModeSelector');
        if (displayModeSelector) {
            displayModeSelector.innerHTML = `
                <option value="region" ${this.displayMode === 'region' ? 'selected' : ''}>リージョン別</option>
                <option value="area" ${this.displayMode === 'area' ? 'selected' : ''}>地域別</option>
            `;
            
            displayModeSelector.addEventListener('change', (e) => {
                this.setDisplayMode(e.target.value);
            });
        }
    }

    updateRegionSelector() {
        const regionSelector = document.getElementById('regionSelector');
        if (!regionSelector) return;

        if (this.displayMode === 'region') {
            // リージョン別表示
            const allRegionsOption = `<option value="all-regions" ${this.currentRegion === 'all-regions' ? 'selected' : ''}>全てのリージョン</option>`;
            const regionOptions = Object.entries(this.regions)
                .map(([code, name]) => 
                    `<option value="${code}" ${code === this.currentRegion ? 'selected' : ''}>${name} (${code})</option>`
                ).join('');
            
            regionSelector.innerHTML = allRegionsOption + regionOptions;
            regionSelector.onchange = (e) => this.setRegion(e.target.value);
        } else {
            // 地域別表示
            const allAreasOption = `<option value="all-areas" ${this.currentArea === 'all-areas' ? 'selected' : ''}>全ての地域</option>`;
            const areaOptions = Object.entries(this.regionGroups)
                .map(([areaCode, area]) => 
                    `<option value="${areaCode}" ${areaCode === this.currentArea ? 'selected' : ''}>${area.name}</option>`
                ).join('');
            
            regionSelector.innerHTML = allAreasOption + areaOptions;
            regionSelector.onchange = (e) => this.setArea(e.target.value);
        }
    }

    setDisplayMode(mode) {
        if (mode !== 'region' && mode !== 'area') {
            console.warn('Invalid display mode:', mode);
            return;
        }

        this.displayMode = mode;
        this.storeDisplayMode(mode);
        this.updateRegionSelector();
        
        // 表示モード変更イベントを発火
        document.dispatchEvent(new CustomEvent('displayModeChanged', {
            detail: { mode: mode }
        }));
        
        console.log(`表示モードを${mode === 'region' ? 'リージョン別' : '地域別'}に変更しました`);
    }

    setRegion(regionCode) {
        // 「全てのリージョン」が選択された場合
        if (regionCode === 'all-regions') {
            this.currentRegion = 'all-regions';
            this.storeRegion(regionCode);
            
            // リージョン変更イベントを発火
            document.dispatchEvent(new CustomEvent('regionChanged', {
                detail: { 
                    region: regionCode, 
                    regionName: '全てのリージョン',
                    area: 'all-areas',
                    areaName: '全ての地域'
                }
            }));
            
            console.log('全てのリージョンを表示します');
            return;
        }

        if (!this.regions[regionCode]) {
            console.warn('Invalid region code:', regionCode);
            return;
        }

        this.currentRegion = regionCode;
        this.storeRegion(regionCode);
        
        // 現在のリージョンから地域を特定
        this.currentArea = this.getAreaFromRegion(regionCode);
        this.storeArea(this.currentArea);
        
        // リージョン変更イベントを発火
        document.dispatchEvent(new CustomEvent('regionChanged', {
            detail: { 
                region: regionCode, 
                regionName: this.regions[regionCode],
                area: this.currentArea,
                areaName: this.regionGroups[this.currentArea]?.name
            }
        }));
        
        console.log(`リージョンを${this.regions[regionCode]} (${regionCode})に変更しました`);
    }

    setArea(areaCode) {
        // 「全ての地域」が選択された場合
        if (areaCode === 'all-areas') {
            this.currentArea = 'all-areas';
            this.currentRegion = 'all-regions';
            this.storeArea(areaCode);
            this.storeRegion('all-regions');
            
            // 地域変更イベントを発火
            document.dispatchEvent(new CustomEvent('areaChanged', {
                detail: { 
                    area: areaCode, 
                    areaName: '全ての地域',
                    region: 'all-regions',
                    regionName: '全てのリージョン'
                }
            }));
            
            console.log('全ての地域を表示します');
            return;
        }

        if (!this.regionGroups[areaCode]) {
            console.warn('Invalid area code:', areaCode);
            return;
        }

        this.currentArea = areaCode;
        this.storeArea(areaCode);
        
        // 地域の代表リージョンを設定（最初のリージョン）
        const areaRegions = Object.keys(this.regionGroups[areaCode].regions);
        if (areaRegions.length > 0) {
            this.currentRegion = areaRegions[0];
            this.storeRegion(this.currentRegion);
        }
        
        // 地域変更イベントを発火
        document.dispatchEvent(new CustomEvent('areaChanged', {
            detail: { 
                area: areaCode, 
                areaName: this.regionGroups[areaCode].name,
                region: this.currentRegion,
                regionName: this.regions[this.currentRegion]
            }
        }));
        
        console.log(`地域を${this.regionGroups[areaCode].name}に変更しました`);
    }

    getCurrentRegion() {
        return this.currentRegion;
    }

    getCurrentRegionName() {
        if (this.currentRegion === 'all-regions') {
            return '全てのリージョン';
        }
        return this.regions[this.currentRegion];
    }

    getCurrentArea() {
        return this.currentArea;
    }

    getCurrentAreaName() {
        if (this.currentArea === 'all-areas') {
            return '全ての地域';
        }
        return this.regionGroups[this.currentArea]?.name;
    }

    getDisplayMode() {
        return this.displayMode;
    }

    getRegions() {
        return this.regions;
    }

    getRegionGroups() {
        return this.regionGroups;
    }

    getAreaFromRegion(regionCode) {
        if (regionCode === 'all-regions') {
            return 'all-areas';
        }
        
        for (const [areaCode, area] of Object.entries(this.regionGroups)) {
            if (area.regions[regionCode]) {
                return areaCode;
            }
        }
        return 'all-areas'; // デフォルト
    }

    // プロバイダーが特定の地域で利用可能かチェック
    isProviderAvailableInArea(provider, areaCode) {
        return this.providerRegions[provider] && this.providerRegions[provider][areaCode];
    }

    // プロバイダーが特定のリージョンで利用可能かチェック
    isProviderAvailableInRegion(provider, regionCode) {
        const area = this.getAreaFromRegion(regionCode);
        return this.isProviderAvailableInArea(provider, area);
    }

    // 地域別の利用可能プロバイダーを取得
    getAvailableProvidersInArea(areaCode) {
        const providers = [];
        for (const [provider, regions] of Object.entries(this.providerRegions)) {
            if (regions[areaCode] && regions[areaCode].length > 0) {
                providers.push(provider);
            }
        }
        return providers;
    }

    // 「全て」表示時の地域・リージョン情報を取得
    getDisplayLocationInfo() {
        if (this.currentRegion === 'all-regions' || this.currentArea === 'all-areas') {
            return {
                showAll: true,
                regions: this.regions,
                regionGroups: this.regionGroups
            };
        }
        return {
            showAll: false,
            currentRegion: this.currentRegion,
            currentArea: this.currentArea
        };
    }

    // リージョンコードから地域名を取得
    getAreaNameFromRegion(regionCode) {
        for (const [areaCode, area] of Object.entries(this.regionGroups)) {
            if (area.regions[regionCode]) {
                return area.name;
            }
        }
        return '不明な地域';
    }

    // 価格データから実際に使用されているリージョンを特定
    getActualRegionFromPricing(pricingData) {
        if (!pricingData || !pricingData.regions) {
            return null;
        }

        const availableRegions = Object.keys(pricingData.regions);
        if (availableRegions.length === 0) {
            return null;
        }

        // 優先順位に基づいてリージョンを選択
        const priorityOrder = [
            'ap-northeast-1', // 東京 (最優先)
            'ap-northeast-3', // 大阪
            'us-east-1',      // バージニア北部
            'us-west-2',      // オレゴン
            'ap-southeast-1', // シンガポール
            'ap-northeast-2', // ソウル
            'us-east-2',      // オハイオ
            'us-west-1',      // カリフォルニア北部
            'ap-east-1',      // 香港
            'ap-east-2'       // 台湾
        ];

        // 優先順位に従って利用可能なリージョンを選択
        for (const region of priorityOrder) {
            if (availableRegions.includes(region)) {
                return region;
            }
        }

        // 優先順位にないリージョンの場合は最初のものを返す
        return availableRegions[0];
    }

    getStoredRegion() {
        return localStorage.getItem('selectedRegion');
    }

    storeRegion(regionCode) {
        localStorage.setItem('selectedRegion', regionCode);
    }

    getStoredArea() {
        return localStorage.getItem('selectedArea');
    }

    storeArea(areaCode) {
        localStorage.setItem('selectedArea', areaCode);
    }

    getStoredDisplayMode() {
        return localStorage.getItem('displayMode');
    }

    storeDisplayMode(mode) {
        localStorage.setItem('displayMode', mode);
    }

    // 価格データからリージョン別価格を取得
    getRegionalPrice(pricingData, priceType = 'storage') {
        if (!pricingData || !pricingData.regions) {
            return null;
        }

        // 「全て」オプションが選択されている場合は全体平均価格を返す
        if (this.currentRegion === 'all-regions' || this.currentArea === 'all-areas') {
            return this.getGlobalAveragePrice(pricingData, priceType);
        }

        if (this.displayMode === 'region') {
            // リージョン別表示の場合
            return this.getRegionSpecificPrice(pricingData, this.currentRegion, priceType);
        } else {
            // 地域別表示の場合 - 地域内の平均価格または代表価格を取得
            return this.getAreaAveragePrice(pricingData, this.currentArea, priceType);
        }
    }

    getRegionSpecificPrice(pricingData, regionCode, priceType = 'storage') {
        const regionData = pricingData.regions[regionCode];
        if (regionData && regionData[priceType]) {
            return regionData[priceType];
        }

        // フォールバック: 利用可能な最初のリージョンの価格を使用
        const availableRegions = Object.keys(pricingData.regions);
        if (availableRegions.length > 0) {
            const fallbackRegion = availableRegions[0];
            return pricingData.regions[fallbackRegion][priceType];
        }
        return null;
    }

    getAreaAveragePrice(pricingData, areaCode, priceType = 'storage') {
        const areaRegions = Object.keys(this.regionGroups[areaCode]?.regions || {});
        const availableRegions = Object.keys(pricingData.regions);
        
        // 地域内で利用可能なリージョンを見つける
        const regionInArea = areaRegions.find(region => availableRegions.includes(region));
        
        if (regionInArea) {
            // 地域内にリージョンがある場合はそのリージョンの価格を使用
            const regionData = pricingData.regions[regionInArea];
            if (regionData && regionData[priceType]) {
                return regionData[priceType];
            }
        }

        // 地域内にリージョンがない場合は優先順位に基づいて選択
        const fallbackRegion = this.getActualRegionFromPricing(pricingData);
        if (fallbackRegion && pricingData.regions[fallbackRegion] && pricingData.regions[fallbackRegion][priceType]) {
            return pricingData.regions[fallbackRegion][priceType];
        }

        return null;
    }

    getGlobalAveragePrice(pricingData, priceType = 'storage') {
        const allRegions = Object.keys(pricingData.regions);
        const availablePrices = [];

        // 全リージョンの価格を収集
        allRegions.forEach(regionCode => {
            const regionData = pricingData.regions[regionCode];
            if (regionData && regionData[priceType]) {
                availablePrices.push(regionData[priceType]);
            }
        });

        if (availablePrices.length === 0) {
            return null;
        }

        // 全体平均価格を計算
        const avgUsd = availablePrices.reduce((sum, price) => sum + (price.usd || 0), 0) / availablePrices.length;
        const avgJpy = availablePrices.reduce((sum, price) => sum + (price.jpy || 0), 0) / availablePrices.length;

        return {
            usd: Math.round(avgUsd * 1000) / 1000, // 3桁まで
            jpy: Math.round(avgJpy * 100) / 100    // 2桁まで
        };
    }
}