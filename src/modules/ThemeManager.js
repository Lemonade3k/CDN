export class ThemeManager {
    constructor() {
        this.isSimpleTheme = false;
        this.loadSavedTheme();
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('simpleTheme');
        if (savedTheme === 'true') {
            this.isSimpleTheme = true;
            this.applySimpleTheme();
        }
    }

    toggleTheme() {
        this.isSimpleTheme = !this.isSimpleTheme;
        
        if (this.isSimpleTheme) {
            this.applySimpleTheme();
        } else {
            this.applyFullTheme();
        }

        this.saveThemePreference();
    }

    applySimpleTheme() {
        const body = document.body;
        const themeButton = document.getElementById('themeSwitch');
        const themeText = themeButton?.querySelector('.theme-text');

        body.classList.add('simple-theme');
        if (themeText) themeText.textContent = 'Giao Diện Đầy Đủ';

        // Store current scroll position
        const scrollPos = window.pageYOffset;
        
        // Apply simple theme styles
        document.querySelectorAll('.countdown-card').forEach(card => {
            card.style.transform = 'none';
            card.style.animation = 'none';
        });
        
        // Restore scroll position
        window.scrollTo(0, scrollPos);
    }

    applyFullTheme() {
        const body = document.body;
        const themeButton = document.getElementById('themeSwitch');
        const themeText = themeButton?.querySelector('.theme-text');

        body.classList.remove('simple-theme');
        if (themeText) themeText.textContent = 'Giao Diện Đơn Giản';
    }

    saveThemePreference() {
        localStorage.setItem('simpleTheme', this.isSimpleTheme);
    }

    isSimple() {
        return this.isSimpleTheme;
    }

    applyCustomColor(element, color) {
        const isSimple = this.isSimpleTheme;
        
        if (!isSimple) {
            element.style.borderColor = color;
        }

        const iconEl = element.querySelector('.festival-icon');
        const titleEl = element.querySelector('h3');
        const noteEl = element.querySelector('h3 span');
        const timeValueEls = element.querySelectorAll('.time-block span[id]');
        const timeLabelEls = element.querySelectorAll('.time-block span:not([id])');

        if (iconEl) iconEl.style.color = color;
        if (titleEl) titleEl.style.color = color;
        if (noteEl) noteEl.style.color = color;

        timeValueEls.forEach(el => el.style.color = color);
        timeLabelEls.forEach(el => el.style.color = color);
    }
}