// ВАЖНО: Версия кеша. Если вы добавите новые песни, меняйте v3 на v4 и т.д.
const CACHE_NAME = 'yukon-cache-v4';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    // --- БЕК-ВОКАЛ ---
    './бекпартии/Амнезия.mp3',
    './бекпартии/Мегаполис.mp3',
    './бекпартии/Зачем.mp3',
    './бекпартии/Зачем-делать-верить.mp3',
    './бекпартии/Зачем-Аэо-Гизара.mp3',
    './бекпартии/Про-нас.mp3',
    './бекпартии/Меня-больше-нет.mp3',
    './бекпартии/Простудента.wav',
    
    // --- ИНСТРУМЕНТАЛ (БЕЗ ВОКАЛА) ---
    './инструментал/Yukon Flames - Амнезия[rebalanced].mp3',
    './инструментал/Yukon Flames - Мегаполис[rebalanced].mp3',
    './инструментал/Yukon Flames - Зачем[rebalanced].mp3',
    './инструментал/Yukon Flames - Про Нас[rebalanced].mp3',
    './инструментал/Yukon Flames - Отпуск[rebalanced].mp3',
    './инструментал/Yukon Flames - Меня больше нет[rebalanced].mp3',
    './инструментал/Yukon Flames - Песня Про Ленивого Студента[rebalanced].mp3',
    
    // --- ПОЛНОЦЕННЫЕ (С ВОКАЛОМ) ---
    './полноценные/Yukon Flames - Амнезия.mp3',
    './полноценные/Yukon Flames - Мегаполис.mp3',
    './полноценные/Yukon Flames - Зачем_.mp3',
    './полноценные/Yukon Flames - Про Нас.mp3',
    './полноценные/Yukon - Отпуск.mp3', // Обратите внимание: тут "Yukon - Отпуск", как в вашем списке
    './полноценные/Yukon Flames - Меня больше нет.mp3',
    './полноценные/Yukon Flames - Песня Про Ленивого Студента.mp3'
];

// Установка - скачиваем всё в кеш
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Начинаем кеширование всех песен...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // Активируем новый Service Worker немедленно
    self.skipWaiting();
});

// Активация - удаляем старый кеш, если версия изменилась
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Удаляем старый кеш:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Захватываем контроль над страницей сразу
    self.clients.claim();
});

// Перехват запросов - сначала ищем в кеше, потом в интернете
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response; // Нашли в кеше - отдаем мгновенно
            }
            return fetch(event.request); // Нет в кеше - качаем из сети
        })
    );
});