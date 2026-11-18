const CACHE_NAME = 'yukon-cache-v2'; // Поменяли версию на v2

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './бекпартии/Амнезия.mp3',
    './бекпартии/Мегаполис.mp3',
    './бекпартии/Зачем.mp3',
    './бекпартии/Зачем - делать верить.mp3',
    './бекпартии/Зачем - Аэо Гизара.mp3',
    './бекпартии/Про нас.mp3',
    './бекпартии/Меня больше нет.mp3',
    './бекпартии/Простудента.wav', // <-- Добавили новый файл
    './инструментал/Yukon Flames - Амнезия[rebalanced].mp3',
    './инструментал/Yukon Flames - Мегаполис[rebalanced].mp3',
    './инструментал/Yukon Flames - Зачем[rebalanced].mp3',
    './инструментал/Yukon Flames - Про Нас[rebalanced].mp3',
    './инструментал/Yukon Flames - Отпуск[rebalanced].mp3',
    './инструментал/Yukon Flames - Меня больше нет[rebalanced].mp3',
    './инструментал/Yukon Flames - Песня Про Ленивого Студента[rebalanced].mp3',
    './полноценные/Yukon Flames - Амнезия.mp3',
    './полноценные/Yukon Flames - Мегаполис.mp3',
    './полноценные/Yukon Flames - Зачем_.mp3',
    './полноценные/Yukon Flames - Про Нас.mp3',
    './полноценные/Yukon Flames - Отпуск.mp3',
    './полноценные/Yukon Flames - Меня больше нет.mp3',
    './полноценные/Yukon Flames - Песня Про Ленивого Студента.mp3'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});