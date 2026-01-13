

// Массив с данными об учебных ресурсах. Координаты приведены для Хельсинки.
const resources = [
  {
    name: 'Языковой клуб «Lingua»',
    address: 'Aleksanterinkatu 10, Helsinki',
    coords: [60.1699, 24.9384],
    hours: 'Пн–Пт: 10:00–18:00',
    description: 'Разговорная практика и мероприятия для всех уровней.'
  },
  {
    name: 'Центр изучения языков',
    address: 'Kaisaniemenkatu 5, Helsinki',
    coords: [60.1730, 24.9400],
    hours: 'Пн–Сб: 9:00–20:00',
    description: 'Полные курсы для начинающих и продвинутых студентов.'
  },
  {
    name: 'Публичная библиотека',
    address: 'Rikhardinkatu 3, Helsinki',
    coords: [60.1684, 24.9460],
    hours: 'Пн–Вс: 9:00–21:00',
    description: 'Большой выбор книг и учебных материалов на иностранных языках.'
  }
];

function initMap() {
  const mapElement = document.getElementById('resourcesMap');
  const listElement = document.getElementById('resourcesList');
  if (!mapElement) return;

  // Создаём карту с центром в Хельсинки.
  const map = new ymaps.Map(mapElement, {
    center: [60.1699, 24.9384],
    zoom: 12,
    controls: ['zoomControl']
  });

  // Добавляем метки для каждого ресурса.
  resources.forEach((res) => {
    const placemark = new ymaps.Placemark(
      res.coords,
      {
        balloonContentHeader: `<strong>${res.name}</strong>`,
        balloonContentBody: `<p><strong>Адрес:</strong> ${res.address}<br>` +
          `<strong>Время работы:</strong> ${res.hours}<br>` +
          `${res.description}</p>`
      },
      {
        preset: 'islands#blueIcon'
      }
    );
    map.geoObjects.add(placemark);
  });

  // Заполняем список ресурсов карточками.
  if (listElement) {
    resources.forEach((res) => {
      const card = document.createElement('div');
      card.className = 'card mb-3';
      card.innerHTML =
        `<div class="card-body">` +
        `<h5 class="card-title">${res.name}</h5>` +
        `<p class="mb-1"><strong>Адрес:</strong> ${res.address}</p>` +
        `<p class="mb-1"><strong>Часы работы:</strong> ${res.hours}</p>` +
        `<p class="mb-1">${res.description}</p>` +
        `</div>`;
      listElement.appendChild(card);
    });
  }
}


if (typeof ymaps !== 'undefined') {
  ymaps.ready(initMap);
}