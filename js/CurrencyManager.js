class CurrencyManager {
    constructor() {
        this.currencies = {
            'usd': { symbol: '$', name: 'USD', format: 'en-US' },
            'jpy': { symbol: '¥', name: 'JPY', format: 'ja-JP' }
        };
        
        this.currentCurrency = this.getStoredCurrency() || 'usd';
        this.initializeCurrencySelector();
    }

    initializeCurrencySelector() {
        const currencySelector = document.getElementById('currencySelector');
        if (currencySelector) {
            // 通貨オプションを生成
            currencySelector.innerHTML = Object.entries(this.currencies)
                .map(([code, info]) => 
                    `<option value="${code}" ${code === this.currentCurrency ? 'selected' : ''}>${info.symbol} ${info.name}</option>`
                ).join('');
            
            // イベントリスナーを追加
            currencySelector.addEventListener('change', (e) => {
                this.setCurrency(e.target.value);
            });
        }
    }

    setCurrency(currencyCode) {
        if (!this.currencies[currencyCode]) {
            console.warn('Invalid currency code:', currencyCode);
            return;
        }

        this.currentCurrency = currencyCode;
        this.storeCurrency(currencyCode);
        
        // 通貨変更イベントを発火
        document.dispatchEvent(new CustomEvent('currencyChanged', {
            detail: { 
                currency: currencyCode, 
                currencyInfo: this.currencies[currencyCode] 
            }
        }));
        
        console.log(`通貨を${this.currencies[currencyCode].name}に変更しました`);
    }

    getCurrentCurrency() {
        return this.currentCurrency;
    }

    getCurrentCurrencyInfo() {
        return this.currencies[this.currentCurrency];
    }

    getCurrencies() {
        return this.currencies;
    }

    getStoredCurrency() {
        return localStorage.getItem('selectedCurrency');
    }

    storeCurrency(currencyCode) {
        localStorage.setItem('selectedCurrency', currencyCode);
    }

    // 価格を現在の通貨でフォーマット
    formatPrice(priceData, unit = '/GB/month') {
        if (!priceData || typeof priceData !== 'object') {
            return 'N/A';
        }

        const price = priceData[this.currentCurrency];
        if (price === undefined || price === null) {
            return 'N/A';
        }

        const currencyInfo = this.currencies[this.currentCurrency];
        
        // 価格をフォーマット
        let formattedPrice;
        if (this.currentCurrency === 'jpy') {
            // 日本円は小数点なしで表示
            formattedPrice = Math.round(price).toLocaleString(currencyInfo.format);
        } else {
            // USDは小数点3桁まで表示
            formattedPrice = price.toLocaleString(currencyInfo.format, {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3
            });
        }

        return `${currencyInfo.symbol}${formattedPrice}${unit}`;
    }

    // リクエスト価格専用のフォーマット
    formatRequestPrice(priceData) {
        if (!priceData || typeof priceData !== 'object') {
            return 'N/A';
        }

        const price = priceData[this.currentCurrency];
        if (price === undefined || price === null) {
            return 'N/A';
        }

        const currencyInfo = this.currencies[this.currentCurrency];
        
        let formattedPrice;
        let unit;
        
        if (this.currentCurrency === 'jpy') {
            // 日本円の場合
            if (price < 1) {
                formattedPrice = (price * 1000).toFixed(1);
                unit = '/1000 requests';
            } else {
                formattedPrice = Math.round(price).toLocaleString(currencyInfo.format);
                unit = '/1000 requests';
            }
        } else {
            // USDの場合
            formattedPrice = price.toLocaleString(currencyInfo.format, {
                minimumFractionDigits: 4,
                maximumFractionDigits: 4
            });
            unit = '/1000 requests';
        }

        return `${currencyInfo.symbol}${formattedPrice}${unit}`;
    }

    // 数値のみを取得（ソート用）
    getPriceValue(priceData) {
        if (!priceData || typeof priceData !== 'object') {
            return 0;
        }
        return priceData[this.currentCurrency] || 0;
    }
}