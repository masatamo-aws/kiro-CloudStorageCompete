class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'light';
        this.initializeTheme();
        this.initializeEventListeners();
    }

    initializeTheme() {
        // テーマをHTMLに適用
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        // ラジオボタンの状態を更新
        const themeRadios = document.querySelectorAll('input[name="theme"]');
        themeRadios.forEach(radio => {
            radio.checked = radio.value === this.currentTheme;
        });
    }

    initializeEventListeners() {
        // テーマ切り替えラジオボタンのイベントリスナー
        const themeRadios = document.querySelectorAll('input[name="theme"]');
        themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.setTheme(e.target.value);
                }
            });
        });
    }

    setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            console.warn('Invalid theme:', theme);
            return;
        }

        this.currentTheme = theme;
        
        // HTMLにテーマを適用
        document.documentElement.setAttribute('data-theme', theme);
        
        // ローカルストレージに保存
        this.storeTheme(theme);
        
        console.log(`テーマを${theme === 'dark' ? 'ダーク' : 'ライト'}モードに変更しました`);
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    storeTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        
        // ラジオボタンの状態を更新
        const themeRadio = document.querySelector(`input[name="theme"][value="${newTheme}"]`);
        if (themeRadio) {
            themeRadio.checked = true;
        }
    }

    // システムのダークモード設定を検出
    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // システムテーマ変更の監視
    watchSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!this.getStoredTheme()) {
                    // ユーザーが手動でテーマを設定していない場合のみシステムテーマに従う
                    const systemTheme = e.matches ? 'dark' : 'light';
                    this.setTheme(systemTheme);
                    
                    // ラジオボタンの状態を更新
                    const themeRadio = document.querySelector(`input[name="theme"][value="${systemTheme}"]`);
                    if (themeRadio) {
                        themeRadio.checked = true;
                    }
                }
            });
        }
    }
}