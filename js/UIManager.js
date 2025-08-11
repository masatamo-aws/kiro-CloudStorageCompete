class UIManager {
    constructor(compareManager, regionManager, currencyManager) {
        this.compareManager = compareManager;
        this.regionManager = regionManager;
        this.currencyManager = currencyManager;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 全選択チェックボックス
        const selectAllCheckbox = document.getElementById('selectAll');
        selectAllCheckbox.addEventListener('change', (e) => this.handleSelectAll(e.target.checked));

        // リージョン・通貨・表示モード変更イベント
        document.addEventListener('regionChanged', () => this.updatePriceHeader());
        document.addEventListener('areaChanged', () => this.updatePriceHeader());
        document.addEventListener('displayModeChanged', () => this.updateDisplayModeUI());
        document.addEventListener('currencyChanged', () => this.updatePriceHeader());
    }

    updateServiceTable(services) {
        const tableBody = document.getElementById('servicesTableBody');
        
        if (services.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">該当するサービスが見つかりません</td></tr>';
            return;
        }

        const html = services.map(service => {
            const storagePrice = this.formatServicePrice(service, 'storage');
            const dataSource = service.source || 'Static Data';
            const lastUpdated = service.lastUpdated ? new Date(service.lastUpdated).toLocaleString('ja-JP') : '';
            
            // 地域・リージョン情報を取得
            const locationInfo = this.getServiceLocationInfo(service);
            
            // 地域別表示の場合、利用可能性をチェック
            let availabilityInfo = '';
            if (this.regionManager.getDisplayMode() === 'area') {
                const currentArea = this.regionManager.getCurrentArea();
                
                // 「全ての地域」が選択されている場合は利用可能性を表示しない
                if (currentArea !== 'all-areas') {
                    const isAvailable = this.regionManager.isProviderAvailableInArea(service.provider, currentArea);
                    availabilityInfo = isAvailable ? 
                        `<span class="availability-indicator available" title="この地域で利用可能">✓</span>` :
                        `<span class="availability-indicator unavailable" title="この地域では利用不可">✗</span>`;
                }
            }
            
            return `
                <tr title="データソース: ${dataSource}${lastUpdated ? ' | 更新: ' + lastUpdated : ''}">
                    <td>
                        <input type="checkbox" 
                               class="service-checkbox" 
                               value="${service.id}"
                               ${this.compareManager.getSelectedServices().includes(service.id) ? 'checked' : ''}>
                    </td>
                    <td>
                        ${service.name}
                        <div class="data-source">${dataSource}</div>
                        ${locationInfo}
                    </td>
                    <td>
                        <span class="provider-badge provider-${service.provider.toLowerCase()}">
                            ${service.provider}
                        </span>
                        ${availabilityInfo}
                    </td>
                    <td>${service.type}</td>
                    <td>${storagePrice}</td>
                    <td>${service.features.availability}</td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = html;

        // チェックボックスイベントリスナーを追加
        this.attachCheckboxListeners();
        
        // 価格ヘッダーを更新
        this.updatePriceHeader();
    }

    attachCheckboxListeners() {
        const checkboxes = document.querySelectorAll('.service-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const serviceId = e.target.value;
                this.compareManager.toggleService(serviceId);
                this.updateSelectAllCheckbox();
            });
        });
    }

    handleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.service-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const serviceId = checkbox.value;
            
            if (checked) {
                this.compareManager.addService(serviceId);
            } else {
                this.compareManager.removeService(serviceId);
            }
        });
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAll');
        const serviceCheckboxes = document.querySelectorAll('.service-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.service-checkbox:checked');

        if (checkedCheckboxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCheckboxes.length === serviceCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    showLoading() {
        const tableBody = document.getElementById('servicesTableBody');
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">読み込み中...</td></tr>';
    }

    showError(message) {
        const tableBody = document.getElementById('servicesTableBody');
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #e74c3c;">${message}</td></tr>`;
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

    updatePriceHeader() {
        const priceHeader = document.getElementById('priceHeader');
        const currencyInfo = this.currencyManager.getCurrentCurrencyInfo();
        
        if (priceHeader) {
            const currentRegion = this.regionManager.getCurrentRegion();
            const currentArea = this.regionManager.getCurrentArea();
            const displayMode = this.regionManager.getDisplayMode();
            
            if (currentRegion === 'all-regions' || currentArea === 'all-areas') {
                priceHeader.textContent = `価格 (全体平均, ${currencyInfo.name})`;
            } else if (displayMode === 'region') {
                const regionName = this.regionManager.getCurrentRegionName();
                const areaName = this.regionManager.getAreaNameFromRegion(currentRegion);
                priceHeader.textContent = `価格 (${areaName} - ${regionName}, ${currencyInfo.name})`;
            } else {
                const areaName = this.regionManager.getCurrentAreaName();
                priceHeader.textContent = `価格 (${areaName}地域代表, ${currencyInfo.name})`;
            }
        }
    }

    updateDisplayModeUI() {
        const regionSelectorLabel = document.getElementById('regionSelectorLabel');
        const displayMode = this.regionManager.getDisplayMode();
        
        if (regionSelectorLabel) {
            regionSelectorLabel.textContent = displayMode === 'region' ? 'リージョン:' : '地域:';
        }
        
        this.updatePriceHeader();
    }

    getServiceLocationInfo(service) {
        const currentRegion = this.regionManager.getCurrentRegion();
        const currentArea = this.regionManager.getCurrentArea();
        const displayMode = this.regionManager.getDisplayMode();
        
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
            return '<div class="location-info">リージョン情報なし</div>';
        }

        const regionName = this.regionManager.regions[actualRegion] || actualRegion;
        const areaName = this.regionManager.getAreaNameFromRegion(actualRegion);

        // 表示モードに応じてアイコンと表示内容を調整
        let icon = '📍';
        let displayText = '';
        
        if (currentRegion === 'all-regions' || currentArea === 'all-areas') {
            icon = '🌐';
            displayText = `参照: ${areaName} - ${regionName}`;
        } else if (displayMode === 'region') {
            icon = '📍';
            displayText = `${areaName} - ${regionName}`;
        } else {
            icon = '🗺️';
            displayText = `地域代表: ${regionName}`;
        }

        return `<div class="location-info">${icon} ${displayText}</div>`;
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
}