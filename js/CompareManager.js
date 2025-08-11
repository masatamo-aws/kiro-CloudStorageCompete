class CompareManager {
    constructor(storageService, regionManager, currencyManager) {
        this.storageService = storageService;
        this.regionManager = regionManager;
        this.currencyManager = currencyManager;
        this.selectedServices = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 比較ボタン
        const compareBtn = document.getElementById('compareBtn');
        compareBtn.addEventListener('click', () => this.showCompareModal());

        // モーダルクローズ
        const modal = document.getElementById('compareModal');
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => this.hideCompareModal());

        // モーダル外クリックでクローズ
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideCompareModal();
            }
        });
    }

    addService(serviceId) {
        if (!this.selectedServices.includes(serviceId)) {
            this.selectedServices.push(serviceId);
            this.updateCompareButton();
        }
    }

    removeService(serviceId) {
        this.selectedServices = this.selectedServices.filter(id => id !== serviceId);
        this.updateCompareButton();
    }

    toggleService(serviceId) {
        if (this.selectedServices.includes(serviceId)) {
            this.removeService(serviceId);
        } else {
            this.addService(serviceId);
        }
    }

    updateCompareButton() {
        const compareBtn = document.getElementById('compareBtn');
        const selectedCount = document.getElementById('selectedCount');
        
        selectedCount.textContent = this.selectedServices.length;
        compareBtn.disabled = this.selectedServices.length < 2;
    }

    showCompareModal() {
        if (this.selectedServices.length < 2) return;

        const services = this.selectedServices.map(id => 
            this.storageService.getServiceById(id)
        );

        this.renderCompareContent(services);
        document.getElementById('compareModal').style.display = 'block';
    }

    hideCompareModal() {
        document.getElementById('compareModal').style.display = 'none';
    }

    renderCompareContent(services) {
        const compareContent = document.getElementById('compareContent');
        const currencyInfo = this.currencyManager.getCurrentCurrencyInfo();
        
        let locationInfo = '';
        const currentRegion = this.regionManager.getCurrentRegion();
        const currentArea = this.regionManager.getCurrentArea();
        
        if (currentRegion === 'all-regions' || currentArea === 'all-areas') {
            locationInfo = `<p><strong>比較範囲:</strong> 全体平均価格</p>`;
        } else if (this.regionManager.getDisplayMode() === 'region') {
            const regionName = this.regionManager.getCurrentRegionName();
            locationInfo = `<p><strong>比較リージョン:</strong> ${regionName} (${currentRegion})</p>`;
        } else {
            const areaName = this.regionManager.getCurrentAreaName();
            locationInfo = `<p><strong>比較地域:</strong> ${areaName} (地域平均価格)</p>`;
        }
        
        const html = `
            <div class="compare-header">
                ${locationInfo}
                <p><strong>表示通貨:</strong> ${currencyInfo.name}</p>
            </div>
            <table class="compare-table">
                <thead>
                    <tr>
                        <th>項目</th>
                        ${services.map(service => `<th>${service.name}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>プロバイダ</strong></td>
                        ${services.map(service => `<td><span class="provider-badge provider-${service.provider.toLowerCase()}">${service.provider}</span></td>`).join('')}
                    </tr>
                    ${this.getLocationInfoRow(services)}
                    <tr>
                        <td><strong>タイプ</strong></td>
                        ${services.map(service => `<td>${service.type}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>ストレージ価格</strong></td>
                        ${services.map(service => `<td>${this.formatServicePrice(service, 'storage')}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>リクエスト価格</strong></td>
                        ${services.map(service => `<td>${this.formatServicePrice(service, 'requests')}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>耐久性</strong></td>
                        ${services.map(service => `<td>${service.features.durability}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>可用性</strong></td>
                        ${services.map(service => `<td>${service.features.availability}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>暗号化</strong></td>
                        ${services.map(service => `<td>${service.features.encryption ? '✓' : '✗'}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>バージョニング</strong></td>
                        ${services.map(service => `<td>${service.features.versioning ? '✓' : '✗'}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>ライフサイクル管理</strong></td>
                        ${services.map(service => `<td>${service.features.lifecycle ? '✓' : '✗'}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>主な用途</strong></td>
                        ${services.map(service => `<td>${service.useCases.join(', ')}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>説明</strong></td>
                        ${services.map(service => `<td>${service.description}</td>`).join('')}
                    </tr>
                </tbody>
            </table>
        `;

        compareContent.innerHTML = html;
    }

    formatServicePrice(service, priceType = 'storage') {
        if (!service.pricing || !service.pricing.regions) {
            // 旧形式のデータの場合
            return service.pricing && service.pricing[priceType] ? service.pricing[priceType] : 'N/A';
        }

        const regionalPrice = this.regionManager.getRegionalPrice(service.pricing, priceType);
        if (!regionalPrice) {
            return 'N/A';
        }

        if (priceType === 'requests') {
            return this.currencyManager.formatRequestPrice(regionalPrice);
        } else {
            return this.currencyManager.formatPrice(regionalPrice);
        }
    }

    getLocationInfoRow(services) {
        const currentRegion = this.regionManager.getCurrentRegion();
        const currentArea = this.regionManager.getCurrentArea();
        const displayMode = this.regionManager.getDisplayMode();
        
        const locationCells = services.map(service => {
            // 価格データから実際に使用されているリージョンを特定
            let actualRegion = null;
            
            if (currentRegion === 'all-regions' || currentArea === 'all-areas') {
                // 「全て」表示の場合は優先順位に基づいてリージョンを選択
                actualRegion = this.regionManager.getActualRegionFromPricing(service.pricing);
            } else if (displayMode === 'region') {
                // リージョン別表示の場合は選択されたリージョンを使用
                actualRegion = currentRegion;
            } else {
                // 地域別表示の場合は地域内の代表リージョンを使用
                actualRegion = this.getRepresentativeRegionForArea(service, currentArea);
            }

            if (!actualRegion) {
                return '<td><small>リージョン情報なし</small></td>';
            }

            const regionName = this.regionManager.regions[actualRegion] || actualRegion;
            const areaName = this.regionManager.getAreaNameFromRegion(actualRegion);

            // 表示モードに応じてアイコンと表示内容を調整
            let icon = '📍';
            let displayText = '';
            
            if (currentRegion === 'all-regions' || currentArea === 'all-areas') {
                icon = '🌐';
                displayText = `${areaName}<br>${regionName}`;
            } else if (displayMode === 'region') {
                icon = '📍';
                displayText = `${areaName}<br>${regionName}`;
            } else {
                icon = '🗺️';
                displayText = `地域代表<br>${regionName}`;
            }

            return `<td><small>${icon} ${displayText}</small></td>`;
        }).join('');

        // 行のタイトルも表示モードに応じて調整
        let rowTitle = '参照リージョン';
        if (currentRegion === 'all-regions' || currentArea === 'all-areas') {
            rowTitle = '参照リージョン';
        } else if (displayMode === 'region') {
            rowTitle = '選択リージョン';
        } else {
            rowTitle = '地域代表リージョン';
        }

        return `
            <tr>
                <td><strong>${rowTitle}</strong></td>
                ${locationCells}
            </tr>
        `;
    }

    getRepresentativeRegionForArea(service, areaCode) {
        if (!service.pricing || !service.pricing.regions) {
            return null;
        }

        // 地域内の利用可能なリージョンを取得
        const areaRegions = Object.keys(this.regionManager.regionGroups[areaCode]?.regions || {});
        const availableRegions = Object.keys(service.pricing.regions);
        
        // 地域内で利用可能なリージョンを見つける
        const regionInArea = areaRegions.find(region => availableRegions.includes(region));
        
        if (regionInArea) {
            return regionInArea;
        }

        // 地域内にリージョンがない場合は優先順位に基づいて選択
        return this.regionManager.getActualRegionFromPricing(service.pricing);
    }

    getSelectedServices() {
        return this.selectedServices;
    }

    clearSelection() {
        this.selectedServices = [];
        this.updateCompareButton();
    }
}