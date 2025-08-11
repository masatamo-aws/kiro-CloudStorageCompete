class DataFetcher {
    constructor() {
        // 各社の公式価格API情報
        this.apiEndpoints = {
            aws: {
                pricing: 'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/index.json',
                s3: 'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonS3/current/index.json',
                ebs: 'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEBS/current/index.json',
                efs: 'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEFS/current/index.json',
                dynamodb: 'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonDynamoDB/current/index.json'
            },
            azure: {
                retail: 'https://prices.azure.com/api/retail/prices',
                storage: 'https://prices.azure.com/api/retail/prices?$filter=serviceName eq \'Storage\'',
                compute: 'https://prices.azure.com/api/retail/prices?$filter=serviceName eq \'Virtual Machines\''
            },
            gcp: {
                billing: 'https://cloudbilling.googleapis.com/v1/services',
                storage: 'https://cloudbilling.googleapis.com/v1/services/95FF-2EF5-5EA1/skus',
                compute: 'https://cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus'
            },
            oracle: {
                pricing: 'https://www.oracle.com/cloud/price-list/',
                api: 'https://apexapps.oracle.com/pls/apex/cetools/api/v1/products'
            },
            ibm: {
                pricing: 'https://cloud.ibm.com/pricing/configure',
                catalog: 'https://globalcatalog.cloud.ibm.com/api/v1'
            }
        };
        
        // 為替レート取得用API
        this.exchangeRateAPI = 'https://api.exchangerate-api.com/v4/latest/USD';
        
        this.lastUpdated = localStorage.getItem('lastUpdated');
        this.cachedData = this.getCachedData();
        this.exchangeRate = this.getCachedExchangeRate();
    }

    async getData() {
        try {
            console.log('最新の価格情報を取得中...');
            
            // 為替レートを取得
            await this.updateExchangeRate();
            
            // まずJSONファイルからベースデータを読み込み
            const baseServices = await this.loadBaseServices();
            
            // 価格データを最新の為替レートで更新
            const updatedServices = this.updateServicesWithExchangeRate(baseServices);
            
            // データをキャッシュ
            this.cacheData(updatedServices);
            
            return updatedServices;
        } catch (error) {
            console.error('データ読み込みエラー:', error);
            
            // キャッシュがあれば使用
            if (this.cachedData && this.cachedData.length > 0) {
                console.log('キャッシュデータを使用します');
                return this.cachedData;
            }
            
            // フォールバックデータを使用
            return this.getFallbackData();
        }
    }

    async loadBaseServices() {
        try {
            const response = await fetch('./data/storage-services.json?t=' + Date.now());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.services || [];
        } catch (error) {
            console.error('JSONファイル読み込みエラー:', error);
            throw error;
        }
    }

    updateServicesWithExchangeRate(services) {
        const currentRate = this.exchangeRate || 150;
        
        return services.map(service => {
            // 既に新しい形式の場合はそのまま返す
            if (service.pricing && service.pricing.regions) {
                return {
                    ...service,
                    lastUpdated: new Date().toISOString(),
                    source: 'JSON + Live Exchange Rate'
                };
            }
            
            // 古い形式の場合は新しい形式に変換
            if (service.pricing && typeof service.pricing.storage === 'string') {
                const storagePrice = this.parsePrice(service.pricing.storage);
                const requestPrice = this.parsePrice(service.pricing.requests);
                
                const regions = {};
                const regionGroups = {
                    'japan': ['ap-northeast-1', 'ap-northeast-3'],
                    'usa': ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'],
                    'east-asia': ['ap-northeast-2', 'ap-east-2'],
                    'southeast-asia': ['ap-east-1', 'ap-southeast-1']
                };
                
                Object.values(regionGroups).flat().forEach(regionCode => {
                        regions[regionCode] = {
                            storage: {
                                usd: storagePrice,
                                jpy: Math.round(storagePrice * currentRate * 100) / 100
                            },
                            requests: {
                                usd: requestPrice,
                                jpy: Math.round(requestPrice * currentRate * 100) / 100
                            }
                        };
                });
                
                return {
                    ...service,
                    pricing: {
                        ...service.pricing,
                        regions: regions
                    },
                    lastUpdated: new Date().toISOString(),
                    source: 'JSON + Live Exchange Rate'
                };
            }
            
            return service;
        });
    }

    parsePrice(priceString) {
        if (!priceString || priceString === 'Included') return 0;
        
        // "$0.023/GB/month" のような形式から数値を抽出
        const match = priceString.match(/\$?([\d.]+)/);
        return match ? parseFloat(match[1]) : 0;
    }

    async fetchLatestData() {
        try {
            console.log('最新データを強制取得中...');
            
            // 為替レートを強制更新
            await this.updateExchangeRate(true);
            
            // ベースサービスを読み込み
            const baseServices = await this.loadBaseServices();
            
            // 価格データを最新の為替レートで更新
            const updatedServices = this.updateServicesWithExchangeRate(baseServices);
            
            // キャッシュを更新
            this.cacheData(updatedServices);
            
            return updatedServices;
        } catch (error) {
            console.error('最新データ取得エラー:', error);
            return this.getFallbackData();
        }
    }

    async updateExchangeRate(forceUpdate = false) {
        try {
            // キャッシュされた為替レートの有効性をチェック
            const cachedRate = this.getCachedExchangeRate();
            const lastRateUpdate = localStorage.getItem('lastExchangeRateUpdate');
            
            if (!forceUpdate && cachedRate && lastRateUpdate) {
                const rateAge = Date.now() - new Date(lastRateUpdate).getTime();
                const maxRateAge = 60 * 60 * 1000; // 1時間
                
                if (rateAge < maxRateAge) {
                    this.exchangeRate = cachedRate;
                    return;
                }
            }

            console.log('最新の為替レートを取得中...');
            const response = await fetch(this.exchangeRateAPI);
            
            if (!response.ok) {
                throw new Error(`Exchange rate API error: ${response.status}`);
            }
            
            const data = await response.json();
            this.exchangeRate = data.rates.JPY || 150; // デフォルト値
            
            // 為替レートをキャッシュ
            localStorage.setItem('exchangeRate', this.exchangeRate.toString());
            localStorage.setItem('lastExchangeRateUpdate', new Date().toISOString());
            
            console.log(`為替レート更新: 1 USD = ${this.exchangeRate} JPY`);
            
        } catch (error) {
            console.error('為替レート取得エラー:', error);
            // デフォルト値を使用
            this.exchangeRate = this.getCachedExchangeRate() || 150;
        }
    }

    getCachedExchangeRate() {
        const cached = localStorage.getItem('exchangeRate');
        return cached ? parseFloat(cached) : null;
    }





    isCacheValid() {
        if (!this.cachedData || !this.lastUpdated) {
            return false;
        }

        const cacheAge = Date.now() - new Date(this.lastUpdated).getTime();
        const maxAge = 60 * 60 * 1000; // 1時間（より頻繁に更新）

        return cacheAge < maxAge;
    }

    getCachedData() {
        try {
            const cached = localStorage.getItem('storageServicesData');
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('キャッシュデータの読み込みエラー:', error);
            return null;
        }
    }

    cacheData(services) {
        try {
            localStorage.setItem('storageServicesData', JSON.stringify(services));
            localStorage.setItem('lastUpdated', new Date().toISOString());
            this.cachedData = services;
            this.lastUpdated = localStorage.getItem('lastUpdated');
        } catch (error) {
            console.error('データキャッシュエラー:', error);
        }
    }

    getProviderFallbackData(provider) {
        const exchangeRate = this.exchangeRate || 150;
        
        switch (provider) {
            case 'AWS':
                return this.getAWSFallbackData(exchangeRate);
            case 'Azure':
                return this.getAzureFallbackData(exchangeRate);
            case 'GCP':
                return this.getGCPFallbackData(exchangeRate);
            case 'Oracle':
                return this.getOracleFallbackData(exchangeRate);
            case 'IBM':
                return this.getIBMFallbackData(exchangeRate);
            default:
                return [];
        }
    }

    getAWSFallbackData(exchangeRate) {
        const createRegionPricing = (baseStorage, baseRequests, multipliers) => {
            const regions = {};
            Object.entries(multipliers).forEach(([region, multiplier]) => {
                regions[region] = {
                    storage: {
                        usd: baseStorage * multiplier,
                        jpy: Math.round(baseStorage * multiplier * exchangeRate * 100) / 100
                    },
                    requests: {
                        usd: baseRequests,
                        jpy: Math.round(baseRequests * exchangeRate * 100) / 100
                    }
                };
            });
            return regions;
        };

        const regionMultipliers = {
            'ap-northeast-1': 1.0,
            'ap-northeast-3': 1.0,
            'us-east-1': 1.0,
            'us-east-2': 1.09,
            'us-west-1': 1.13,
            'us-west-2': 1.0,
            'ap-northeast-2': 1.09,
            'ap-east-1': 1.09,
            'ap-east-2': 1.09,
            'ap-southeast-1': 1.09
        };

        return [
            {
                id: "aws-s3",
                name: "Amazon S3",
                provider: "AWS",
                type: "Object Storage",
                category: "Object",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.023, 0.0004, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: true,
                    lifecycle: true
                },
                useCases: ["Web applications", "Backup", "Archive"],
                description: "Scalable object storage service",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "aws-s3-glacier",
                name: "Amazon S3 Glacier",
                provider: "AWS",
                type: "Archive Storage",
                category: "Archive",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.004, 0.05, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: true,
                    lifecycle: true
                },
                useCases: ["Long-term backup", "Archive", "Compliance"],
                description: "Low-cost archive storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "aws-s3-deep-archive",
                name: "Amazon S3 Glacier Deep Archive",
                provider: "AWS",
                type: "Archive Storage",
                category: "Archive",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.00099, 0.10, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: true,
                    lifecycle: true
                },
                useCases: ["Long-term archive", "Compliance", "Digital preservation"],
                description: "Lowest-cost archive storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "aws-ebs",
                name: "Amazon EBS",
                provider: "AWS",
                type: "Block Storage",
                category: "Block",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.10, 0, regionMultipliers)
                },
                features: {
                    durability: "99.999%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: false,
                    lifecycle: false
                },
                useCases: ["EC2 instances", "Database storage"],
                description: "High-performance block storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "aws-efs",
                name: "Amazon EFS",
                provider: "AWS",
                type: "File Storage",
                category: "File",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.30, 0, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: false,
                    lifecycle: true
                },
                useCases: ["Shared file storage", "Content management", "Web serving"],
                description: "Fully managed NFS file system",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "aws-fsx",
                name: "Amazon FSx",
                provider: "AWS",
                type: "File Storage",
                category: "File",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.13, 0, regionMultipliers)
                },
                features: {
                    durability: "99.999%",
                    availability: "99.9%",
                    encryption: true,
                    versioning: false,
                    lifecycle: false
                },
                useCases: ["High-performance computing", "Machine learning", "Media processing"],
                description: "High-performance file systems",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "aws-dynamodb",
                name: "Amazon DynamoDB",
                provider: "AWS",
                type: "NoSQL Database",
                category: "Database",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.25, 1.25, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: false,
                    lifecycle: true
                },
                useCases: ["Web applications", "Gaming", "IoT"],
                description: "Fully managed NoSQL database",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            }
        ];
    }

    getAzureFallbackData(exchangeRate) {
        const createRegionPricing = (baseStorage, baseRequests, multipliers) => {
            const regions = {};
            Object.entries(multipliers).forEach(([region, multiplier]) => {
                regions[region] = {
                    storage: {
                        usd: baseStorage * multiplier,
                        jpy: Math.round(baseStorage * multiplier * exchangeRate * 100) / 100
                    },
                    requests: {
                        usd: baseRequests,
                        jpy: Math.round(baseRequests * exchangeRate * 100) / 100
                    }
                };
            });
            return regions;
        };

        const regionMultipliers = {
            'ap-northeast-1': 1.0,
            'ap-northeast-3': 1.0,
            'us-east-1': 1.0,
            'us-east-2': 1.08,
            'us-west-1': 1.15,
            'us-west-2': 1.0,
            'ap-northeast-2': 1.08,
            'ap-east-1': 1.08,
            'ap-east-2': 1.08,
            'ap-southeast-1': 1.08
        };

        return [
            {
                id: "azure-blob",
                name: "Azure Blob Storage",
                provider: "Azure",
                type: "Object Storage",
                category: "Object",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.024, 0.0004, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.9%",
                    encryption: true,
                    versioning: true,
                    lifecycle: true
                },
                useCases: ["Web applications", "Backup", "Analytics"],
                description: "Massively scalable object storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "azure-archive",
                name: "Azure Archive Storage",
                provider: "Azure",
                type: "Archive Storage",
                category: "Archive",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.00099, 0.10, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.9%",
                    encryption: true,
                    versioning: true,
                    lifecycle: true
                },
                useCases: ["Long-term backup", "Compliance", "Archive"],
                description: "Ultra-low-cost archive storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "azure-disk",
                name: "Azure Managed Disks",
                provider: "Azure",
                type: "Block Storage",
                category: "Block",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.12, 0, regionMultipliers)
                },
                features: {
                    durability: "99.999%",
                    availability: "99.9%",
                    encryption: true,
                    versioning: false,
                    lifecycle: false
                },
                useCases: ["Virtual machines", "Database storage"],
                description: "High-performance managed disks",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "azure-files",
                name: "Azure Files",
                provider: "Azure",
                type: "File Storage",
                category: "File",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.06, 0.0004, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.9%",
                    encryption: true,
                    versioning: false,
                    lifecycle: true
                },
                useCases: ["File shares", "Lift and shift", "Configuration files"],
                description: "Fully managed file shares",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "azure-netapp",
                name: "Azure NetApp Files",
                provider: "Azure",
                type: "File Storage",
                category: "File",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.50, 0, regionMultipliers)
                },
                features: {
                    durability: "99.99%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: true,
                    lifecycle: false
                },
                useCases: ["Enterprise applications", "SAP", "High-performance computing"],
                description: "Enterprise-grade NFS and SMB file storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "azure-cosmos",
                name: "Azure Cosmos DB",
                provider: "Azure",
                type: "NoSQL Database",
                category: "Database",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.25, 0.008, regionMultipliers)
                },
                features: {
                    durability: "99.999%",
                    availability: "99.999%",
                    encryption: true,
                    versioning: false,
                    lifecycle: true
                },
                useCases: ["Global applications", "IoT", "Gaming"],
                description: "Globally distributed multi-model database",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "azure-data-lake",
                name: "Azure Data Lake Storage",
                provider: "Azure",
                type: "Data Lake",
                category: "Analytics",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.021, 0.0004, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.9%",
                    encryption: true,
                    versioning: true,
                    lifecycle: true
                },
                useCases: ["Big data analytics", "Data warehousing", "Machine learning"],
                description: "Scalable data lake for analytics",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            }
        ];
    }

    getGCPFallbackData(exchangeRate) {
        const createRegionPricing = (baseStorage, baseRequests, multipliers) => {
            const regions = {};
            Object.entries(multipliers).forEach(([region, multiplier]) => {
                regions[region] = {
                    storage: {
                        usd: baseStorage * multiplier,
                        jpy: Math.round(baseStorage * multiplier * exchangeRate * 100) / 100
                    },
                    requests: {
                        usd: baseRequests,
                        jpy: Math.round(baseRequests * exchangeRate * 100) / 100
                    }
                };
            });
            return regions;
        };

        const regionMultipliers = {
            'ap-northeast-1': 1.0,
            'ap-northeast-3': 1.0,
            'us-east-1': 1.0,
            'us-east-2': 1.0,
            'us-west-1': 1.15,
            'us-west-2': 1.0,
            'ap-northeast-2': 1.15,
            'ap-east-1': 1.2,
            'ap-east-2': 1.2,
            'ap-southeast-1': 1.15
        };

        return [
            {
                id: "gcp-storage",
                name: "Google Cloud Storage",
                provider: "GCP",
                type: "Object Storage",
                category: "Object",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.020, 0.0004, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.95%",
                    encryption: true,
                    versioning: true,
                    lifecycle: true
                },
                useCases: ["Web applications", "Analytics", "Backup"],
                description: "Unified object storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "gcp-coldline",
                name: "Google Cloud Storage Coldline",
                provider: "GCP",
                type: "Archive Storage",
                category: "Archive",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.004, 0.05, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.0%",
                    encryption: true,
                    versioning: true,
                    lifecycle: true
                },
                useCases: ["Backup", "Archive", "Disaster recovery"],
                description: "Low-cost storage for infrequently accessed data",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "gcp-archive",
                name: "Google Cloud Storage Archive",
                provider: "GCP",
                type: "Archive Storage",
                category: "Archive",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.0012, 0.10, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.0%",
                    encryption: true,
                    versioning: true,
                    lifecycle: true
                },
                useCases: ["Long-term archive", "Compliance", "Digital preservation"],
                description: "Lowest-cost storage for long-term archive",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "gcp-disk",
                name: "Google Persistent Disk",
                provider: "GCP",
                type: "Block Storage",
                category: "Block",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.10, 0, regionMultipliers)
                },
                features: {
                    durability: "99.999%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: false,
                    lifecycle: false
                },
                useCases: ["Compute Engine", "Database storage"],
                description: "High-performance block storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "gcp-local-ssd",
                name: "Google Local SSD",
                provider: "GCP",
                type: "Block Storage",
                category: "Block",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.218, 0, regionMultipliers)
                },
                features: {
                    durability: "99.9%",
                    availability: "99.9%",
                    encryption: true,
                    versioning: false,
                    lifecycle: false
                },
                useCases: ["High-performance computing", "Database caching", "Analytics"],
                description: "High-performance local SSD storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "gcp-filestore",
                name: "Google Filestore",
                provider: "GCP",
                type: "File Storage",
                category: "File",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.20, 0, regionMultipliers)
                },
                features: {
                    durability: "99.99%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: false,
                    lifecycle: false
                },
                useCases: ["Application migration", "Content management", "Web serving"],
                description: "Fully managed NFS file storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "gcp-firestore",
                name: "Google Firestore",
                provider: "GCP",
                type: "NoSQL Database",
                category: "Database",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.18, 0.06, regionMultipliers)
                },
                features: {
                    durability: "99.999%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: false,
                    lifecycle: false
                },
                useCases: ["Mobile applications", "Web applications", "Real-time sync"],
                description: "NoSQL document database",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            }
        ];
    }

    getOracleFallbackData(exchangeRate) {
        const createRegionPricing = (baseStorage, baseRequests, multipliers) => {
            const regions = {};
            Object.entries(multipliers).forEach(([region, multiplier]) => {
                regions[region] = {
                    storage: {
                        usd: baseStorage * multiplier,
                        jpy: Math.round(baseStorage * multiplier * exchangeRate * 100) / 100
                    },
                    requests: {
                        usd: baseRequests,
                        jpy: Math.round(baseRequests * exchangeRate * 100) / 100
                    }
                };
            });
            return regions;
        };

        const regionMultipliers = {
            'ap-northeast-1': 1.0,
            'ap-northeast-3': 1.0,
            'us-east-1': 1.0,
            'us-east-2': 1.0,
            'us-west-1': 1.0,
            'us-west-2': 1.0,
            'ap-northeast-2': 1.0,
            'ap-east-1': 1.0,
            'ap-east-2': 1.0,
            'ap-southeast-1': 1.0
        };

        return [
            {
                id: "oracle-object",
                name: "Oracle Object Storage",
                provider: "Oracle",
                type: "Object Storage",
                category: "Object",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.025, 0.0004, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.9%",
                    encryption: true,
                    versioning: true,
                    lifecycle: true
                },
                useCases: ["Web applications", "Backup", "Archive"],
                description: "Scalable object storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "oracle-archive",
                name: "Oracle Archive Storage",
                provider: "Oracle",
                type: "Archive Storage",
                category: "Archive",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.0025, 0.10, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.9%",
                    encryption: true,
                    versioning: true,
                    lifecycle: true
                },
                useCases: ["Long-term backup", "Compliance", "Digital preservation"],
                description: "Low-cost archive storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "oracle-block",
                name: "Oracle Block Volume",
                provider: "Oracle",
                type: "Block Storage",
                category: "Block",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.0255, 0, regionMultipliers)
                },
                features: {
                    durability: "99.999%",
                    availability: "99.95%",
                    encryption: true,
                    versioning: false,
                    lifecycle: false
                },
                useCases: ["Compute instances", "Database storage"],
                description: "High-performance block storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "oracle-file",
                name: "Oracle File Storage",
                provider: "Oracle",
                type: "File Storage",
                category: "File",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.05, 0, regionMultipliers)
                },
                features: {
                    durability: "99.999%",
                    availability: "99.95%",
                    encryption: true,
                    versioning: false,
                    lifecycle: false
                },
                useCases: ["Shared file storage", "Content management", "Application data"],
                description: "Fully managed NFS file storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "oracle-autonomous",
                name: "Oracle Autonomous Database",
                provider: "Oracle",
                type: "Database Storage",
                category: "Database",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.02, 0, regionMultipliers)
                },
                features: {
                    durability: "99.995%",
                    availability: "99.995%",
                    encryption: true,
                    versioning: false,
                    lifecycle: true
                },
                useCases: ["Enterprise applications", "Data warehousing", "Analytics"],
                description: "Self-driving database storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            }
        ];
    }

    getIBMFallbackData(exchangeRate) {
        const createRegionPricing = (baseStorage, baseRequests, multipliers) => {
            const regions = {};
            Object.entries(multipliers).forEach(([region, multiplier]) => {
                regions[region] = {
                    storage: {
                        usd: baseStorage * multiplier,
                        jpy: Math.round(baseStorage * multiplier * exchangeRate * 100) / 100
                    },
                    requests: {
                        usd: baseRequests,
                        jpy: Math.round(baseRequests * exchangeRate * 100) / 100
                    }
                };
            });
            return regions;
        };

        const regionMultipliers = {
            'ap-northeast-1': 1.0,
            'ap-northeast-3': 1.0,
            'us-east-1': 1.0,
            'us-east-2': 1.0,
            'us-west-1': 1.0,
            'us-west-2': 1.0,
            'ap-northeast-2': 1.0,
            'ap-east-1': 1.0,
            'ap-east-2': 1.0,
            'ap-southeast-1': 1.0
        };

        return [
            {
                id: "ibm-cos",
                name: "IBM Cloud Object Storage",
                provider: "IBM",
                type: "Object Storage",
                category: "Object",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.023, 0.0004, regionMultipliers)
                },
                features: {
                    durability: "99.999999999%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: true,
                    lifecycle: true
                },
                useCases: ["Web applications", "Analytics", "Backup"],
                description: "Flexible object storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "ibm-block",
                name: "IBM Block Storage",
                provider: "IBM",
                type: "Block Storage",
                category: "Block",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.13, 0, regionMultipliers)
                },
                features: {
                    durability: "99.999%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: false,
                    lifecycle: false
                },
                useCases: ["Virtual servers", "Database storage"],
                description: "High-performance block storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "ibm-file",
                name: "IBM File Storage",
                provider: "IBM",
                type: "File Storage",
                category: "File",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.13, 0, regionMultipliers)
                },
                features: {
                    durability: "99.999%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: false,
                    lifecycle: false
                },
                useCases: ["Shared file storage", "Content management", "Backup"],
                description: "NFS-based file storage",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "ibm-cloudant",
                name: "IBM Cloudant",
                provider: "IBM",
                type: "NoSQL Database",
                category: "Database",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(1.00, 0.015, regionMultipliers)
                },
                features: {
                    durability: "99.99%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: true,
                    lifecycle: false
                },
                useCases: ["Web applications", "Mobile applications", "IoT"],
                description: "Fully managed NoSQL JSON database",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            },
            {
                id: "ibm-db2",
                name: "IBM Db2 on Cloud",
                provider: "IBM",
                type: "Database Storage",
                category: "Database",
                pricing: {
                    model: "Pay-as-you-go",
                    regions: createRegionPricing(0.58, 0, regionMultipliers)
                },
                features: {
                    durability: "99.99%",
                    availability: "99.99%",
                    encryption: true,
                    versioning: false,
                    lifecycle: true
                },
                useCases: ["Enterprise applications", "Data warehousing", "Analytics"],
                description: "Fully managed SQL database",
                lastUpdated: new Date().toISOString(),
                source: "Fallback Data"
            }
        ];
    }

    getFallbackData() {
        console.log('フォールバックデータを使用します');
        const exchangeRate = this.exchangeRate || 150;
        
        return [
            ...this.getAWSFallbackData(exchangeRate),
            ...this.getAzureFallbackData(exchangeRate),
            ...this.getGCPFallbackData(exchangeRate),
            ...this.getOracleFallbackData(exchangeRate),
            ...this.getIBMFallbackData(exchangeRate)
        ];
    }
}