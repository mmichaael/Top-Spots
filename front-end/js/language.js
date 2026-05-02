const LANGUAGE_MAP = {
    en: {
        home: 'AI assistant', nearby: 'Nearby', topshops: 'Top Shops',
        categories: 'Categories', contact: 'Contact', about: 'About',
        searchPlaceholder: 'Search places', signUp: 'Sign Up',
        aiSuggestion1: 'Where to stay today?', aiSuggestion2: 'Most popular now',
        aiWelcome: 'Hi! I am the Top Spots AI assistant. I will help you find great places!',
        aiStatus: 'Online', chatPlaceholder: 'Ask something', sendBtn: 'Send',
        restaurant: '🍽️ Restaurants', cafe: '☕ Cafes', lodging: '🏨 Hotels',
        museum: '🏛️ Museums', shopping_mall: '🛍️ Shopping Malls',
        park: '🌳 Parks', beach: '🏖️ Beaches', resort: '⛷️ Resorts',
        cat_restaurant: 'Restaurants', cat_lodging: 'Hotels', cat_park: 'Parks',
        cat_museum: 'Museums', cat_cafe: 'Cafes', cat_shopping_mall: 'Shopping',
        brandDesc: "Your personal guide to the city's best places. Discover, save, share!",
        footerUseful: 'Useful links', footerAbout: 'About', footerBlog: 'Blog',
        footerPartners: 'Partners', footerCareers: 'Careers', footerSupport: 'Support',
        footerHelp: 'Help', footerPrivacy: 'Privacy', footerTerms: 'Terms',
        footerFaq: 'FAQ', footerContact: 'Contact',
        copyright: '© 2026 Top Spots. All rights reserved.'
    },
    uk: {
        home: 'ШІ-помічник', nearby: 'Поблизу', topshops: 'Топ Місця',
        categories: 'Категорії', contact: 'Контакт', about: 'Про нас',
        searchPlaceholder: 'Пошук місць', signUp: 'Реєстрація',
        aiSuggestion1: 'Де зупинитись сьогодні?', aiSuggestion2: 'Найпопулярніше зараз',
        aiWelcome: 'Привіт! Я помічник Top Spots AI. Допоможу знайти чудові місця!',
        aiStatus: 'Онлайн', chatPlaceholder: 'Запитайте щось', sendBtn: 'Надіслати',
        restaurant: '🍽️ Ресторани', cafe: '☕ Кафе', lodging: '🏨 Готелі',
        museum: '🏛️ Музеї', shopping_mall: '🛍️ Торгові центри',
        park: '🌳 Парки', beach: '🏖️ Пляжі', resort: '⛷️ Курорти',
        cat_restaurant: 'Ресторани', cat_lodging: 'Готелі', cat_park: 'Парки',
        cat_museum: 'Музеї', cat_cafe: 'Кафе', cat_shopping_mall: 'Шопінг',
        brandDesc: 'Ваш особистий гід по найкращих місцях міста. Відкривайте, зберігайте, діліться!',
        footerUseful: 'Корисні посилання', footerAbout: 'Про нас', footerBlog: 'Блог',
        footerPartners: 'Партнери', footerCareers: 'Кар\'єра', footerSupport: 'Підтримка',
        footerHelp: 'Допомога', footerPrivacy: 'Конфіденційність', footerTerms: 'Умови',
        footerFaq: 'FAQ', footerContact: 'Контакт',
        copyright: '© 2026 Top Spots. Всі права захищено.'
    },
    de: {
        home: 'KI-Assistent', nearby: 'In der Nähe', topshops: 'Top Shops',
        categories: 'Kategorien', contact: 'Kontakt', about: 'Über uns',
        searchPlaceholder: 'Orte suchen', signUp: 'Registrieren',
        aiSuggestion1: 'Wo soll ich heute bleiben?', aiSuggestion2: 'Aktuell beliebt',
        aiWelcome: 'Hallo! Ich bin der Top Spots AI-Assistent. Ich helfe dir tolle Orte zu finden!',
        aiStatus: 'Online', chatPlaceholder: 'Etwas fragen', sendBtn: 'Senden',
        restaurant: '🍽️ Restaurants', cafe: '☕ Cafés', lodging: '🏨 Hotels',
        museum: '🏛️ Museen', shopping_mall: '🛍️ Einkaufszentren',
        park: '🌳 Parks', beach: '🏖️ Strände', resort: '⛷️ Resorts',
        cat_restaurant: 'Restaurants', cat_lodging: 'Hotels', cat_park: 'Parks',
        cat_museum: 'Museen', cat_cafe: 'Cafés', cat_shopping_mall: 'Shopping',
        brandDesc: 'Ihr persönlicher Stadtführer für die besten Orte. Entdecken, speichern, teilen!',
        footerUseful: 'Nützliche Links', footerAbout: 'Über uns', footerBlog: 'Blog',
        footerPartners: 'Partner', footerCareers: 'Karriere', footerSupport: 'Support',
        footerHelp: 'Hilfe', footerPrivacy: 'Datenschutz', footerTerms: 'Nutzungsbedingungen',
        footerFaq: 'FAQ', footerContact: 'Kontakt',
        copyright: '© 2026 Top Spots. Alle Rechte vorbehalten.'
    },
    pl: {
        home: 'Asystent AI', nearby: 'Blisko', topshops: 'Top Miejsca',
        categories: 'Kategorie', contact: 'Kontakt', about: 'O nas',
        searchPlaceholder: 'Szukaj miejsc', signUp: 'Rejestracja',
        aiSuggestion1: 'Gdzie spać dziś?', aiSuggestion2: 'Teraz najpopularniejsze',
        aiWelcome: 'Cześć! Jestem asystentem AI Top Spots. Pomogę Ci znaleźć wspaniałe miejsca!',
        aiStatus: 'Online', chatPlaceholder: 'Zapytaj o coś', sendBtn: 'Wyślij',
        restaurant: '🍽️ Restauracje', cafe: '☕ Kawiarnie', lodging: '🏨 Hotele',
        museum: '🏛️ Muzea', shopping_mall: '🛍️ Centra handlowe',
        park: '🌳 Parki', beach: '🏖️ Plaże', resort: '⛷️ Kurorty',
        cat_restaurant: 'Restauracje', cat_lodging: 'Hotele', cat_park: 'Parki',
        cat_museum: 'Muzea', cat_cafe: 'Kawiarnie', cat_shopping_mall: 'Zakupy',
        brandDesc: 'Twój osobisty przewodnik po najlepszych miejscach w mieście. Odkrywaj, zapisuj, udostępniaj!',
        footerUseful: 'Przydatne linki', footerAbout: 'O nas', footerBlog: 'Blog',
        footerPartners: 'Partnerzy', footerCareers: 'Kariera', footerSupport: 'Wsparcie',
        footerHelp: 'Pomoc', footerPrivacy: 'Prywatność', footerTerms: 'Warunki',
        footerFaq: 'FAQ', footerContact: 'Kontakt',
        copyright: '© 2026 Top Spots. Wszelkie prawa zastrzeżone.'
    }
};

function getSavedLanguage() {
    return localStorage.getItem('topspots_locale') || 'en';
}

function setSavedLanguage(locale) {
    localStorage.setItem('topspots_locale', locale);
    applyLanguage(locale);
}

function applyLanguage(locale) {
    const dict = LANGUAGE_MAP[locale] || LANGUAGE_MAP.en;

    // Nav buttons
    document.querySelectorAll('#navMenu button[data-section]').forEach(btn => {
        const key = btn.getAttribute('data-section');
        if (dict[key]) btn.textContent = dict[key];
    });

    // Language select sync
    const sel = document.getElementById('pageLanguageSelect');
    if (sel) sel.value = locale;

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.placeholder = dict.searchPlaceholder;

    // Sign Up button
    const signupBtn = document.getElementById('SignUp');
    if (signupBtn) {
        const span = signupBtn.querySelector('span');
        if (span) span.textContent = dict.signUp;
        else signupBtn.textContent = dict.signUp;
    }

    // AI suggestions
    const suggestions = document.querySelectorAll('.suggestion');
    if (suggestions[0]) suggestions[0].textContent = dict.aiSuggestion1;
    if (suggestions[1]) suggestions[1].textContent = dict.aiSuggestion2;

    // AI welcome
    const aiWelcome = document.getElementById('aiWelcomeText');
    if (aiWelcome) aiWelcome.textContent = dict.aiWelcome;

    // AI status
    const aiStatus = document.getElementById('aiStatus');
    if (aiStatus) aiStatus.textContent = dict.aiStatus;

    // Chat input
    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.placeholder = dict.chatPlaceholder;

    // Send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.textContent = dict.sendBtn;

    // Search category chips
    document.querySelectorAll('.search-category').forEach(span => {
        const type = span.getAttribute('data-type');
        if (dict[type]) span.textContent = dict[type];
    });

    // Category cards
    document.querySelectorAll('.cat-card').forEach(card => {
        const category = card.getAttribute('data-category');
        const span = card.querySelector('span');
        if (span && dict['cat_' + category]) span.textContent = dict['cat_' + category];
    });

    // Footer brand description
    const brandDesc = document.querySelector('.brand-description');
    if (brandDesc) brandDesc.textContent = dict.brandDesc;

    // Footer column headings
    const footerHeadings = document.querySelectorAll('.footer-column h4');
    ['footerUseful', 'footerSupport', 'footerContact'].forEach((key, i) => {
        if (footerHeadings[i] && dict[key]) footerHeadings[i].textContent = dict[key];
    });

    // Useful links column
    const usefulLinks = document.querySelectorAll('.footer-column:nth-child(1) ul li a');
    ['footerAbout', 'footerBlog', 'footerPartners', 'footerCareers'].forEach((key, i) => {
        if (usefulLinks[i] && dict[key]) usefulLinks[i].textContent = dict[key];
    });

    // Support column
    const supportLinks = document.querySelectorAll('.footer-column:nth-child(2) ul li a');
    ['footerHelp', 'footerPrivacy', 'footerTerms', 'footerFaq'].forEach((key, i) => {
        if (supportLinks[i] && dict[key]) supportLinks[i].textContent = dict[key];
    });

    // Copyright
    const copyright = document.querySelector('.copyright');
    if (copyright) copyright.textContent = dict.copyright;
}

// Ініціалізація
document.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('pageLanguageSelect');
    if (sel) {
        sel.addEventListener('change', (e) => setSavedLanguage(e.target.value));
    }
    applyLanguage(getSavedLanguage());
});