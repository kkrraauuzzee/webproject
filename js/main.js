

// Базовый URL и ключ API
const API_BASE = 'https://exam-api-courses.std-900.ist.mospolytech.ru/api';
const API_KEY = '2d3260ba-f2ad-4b0a-944f-2d267c6ae53a';

// Глобальные переменные для хранения данных
let courses = [];
let tutors = [];
let filteredCourses = [];
let currentCoursePage = 1;
const COURSES_PER_PAGE = 5;
let selectedCourse = null;
let selectedTutor = null;

// Данные об учебных ресурсах для карты (используем произвольные координаты в Хельсинки)
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

// Инициализация карты и списка учебных ресурсов
function initResources() {
  const mapContainer = document.getElementById('resourcesMap');
  const listContainer = document.getElementById('resourcesList');
  // Если секции нет (например, на других страницах), ничего не делаем
  if (!mapContainer) return;
  // Заполняем список ресурсов
  if (listContainer) {
    resources.forEach((res) => {
      const card = document.createElement('div');
      card.className = 'card mb-3';
      card.innerHTML = `<div class="card-body"><h5 class="card-title">${res.name}</h5>` +
        `<p class="mb-1"><strong>Адрес:</strong> ${res.address}</p>` +
        `<p class="mb-1"><strong>Часы работы:</strong> ${res.hours}</p>` +
        `<p class="mb-1">${res.description}</p></div>`;
      listContainer.appendChild(card);
    });
  }
  if (typeof L !== 'undefined' && typeof L.map === 'function') {
    const map = L.map(mapContainer).setView([60.1699, 24.9384], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(map);
    resources.forEach((res) => {
      const marker = L.marker(res.coords).addTo(map);
      marker.bindPopup(`<strong>${res.name}</strong><br>${res.address}<br>${res.hours}<br>${res.description}`);
    });
    return;
  }

  const avgLat = resources.reduce((acc, r) => acc + r.coords[0], 0) / resources.length;
  const avgLon = resources.reduce((acc, r) => acc + r.coords[1], 0) / resources.length;
  const zoom = 12;
  const TILE_SIZE = 256;
  const n = Math.pow(2, zoom);
  const centerX = (avgLon + 180) / 360 * n;
  const centerY = (1 - Math.log(Math.tan(avgLat * Math.PI / 180) + 1 / Math.cos(avgLat * Math.PI / 180)) / Math.PI) / 2 * n;
  
  const baseX = Math.floor(centerX) - 1;
  const baseY = Math.floor(centerY) - 1;
  
  const mapInner = document.createElement('div');
  mapInner.style.position = 'relative';
  mapInner.style.width = '100%';
  mapInner.style.height = '100%';
  mapInner.style.overflow = 'hidden';
  mapContainer.appendChild(mapInner);
  
  for (let dx = 0; dx < 3; dx++) {
    for (let dy = 0; dy < 3; dy++) {
      const x = baseX + dx;
      const y = baseY + dy;
      const img = document.createElement('img');
      img.src = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
      img.style.position = 'absolute';
      img.style.left = `${(dx / 3) * 100}%`;
      img.style.top = `${(dy / 3) * 100}%`;
      img.style.width = `${100 / 3}%`;
      img.style.height = `${100 / 3}%`;
      img.style.objectFit = 'cover';
      mapInner.appendChild(img);
    }
  }
  // Контейнер для маркеров
  const markersLayer = document.createElement('div');
  markersLayer.style.position = 'absolute';
  markersLayer.style.top = '0';
  markersLayer.style.left = '0';
  markersLayer.style.width = '100%';
  markersLayer.style.height = '100%';
  mapInner.appendChild(markersLayer);
  // Функция для преобразования координат в пиксели относительно верхнего левого угла мозаики
  function getPixelCoords(lat, lon) {
    const xtile = (lon + 180) / 360 * n;
    const ytile = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n;
    const dx = (xtile - baseX) * TILE_SIZE;
    const dy = (ytile - baseY) * TILE_SIZE;
    return { x: dx, y: dy };
  }
  // Отрисовка маркеров с учётом масштаба контейнера
  function renderStaticMarkers() {
    markersLayer.innerHTML = '';
    const width = mapContainer.clientWidth;
    // Ширина мозаики в пикселях (3 тайла)
    const mosaicWidth = 3 * TILE_SIZE;
    const scale = width / mosaicWidth;
    resources.forEach((res) => {
      const pos = getPixelCoords(res.coords[0], res.coords[1]);
      const marker = document.createElement('div');
      marker.className = 'resource-marker';
      marker.style.position = 'absolute';
      marker.style.width = '16px';
      marker.style.height = '16px';
      marker.style.borderRadius = '50%';
      marker.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--bs-primary');
      marker.style.border = '2px solid #fff';
      marker.style.boxShadow = '0 0 4px rgba(0, 0, 0, 0.3)';
      marker.style.cursor = 'pointer';
      marker.style.left = `${pos.x * scale - 8}px`;
      marker.style.top = `${pos.y * scale - 8}px`;
      marker.title = `${res.name}\n${res.address}`;
      markersLayer.appendChild(marker);
    });
  }
  // Вызов при изменении размеров
  window.addEventListener('resize', renderStaticMarkers);
  // Первичная отрисовка
  renderStaticMarkers();
}

// Элемент уведомлений
const notificationsEl = document.getElementById('notifications');

// Утилита для отображения уведомлений
function showNotification(message, type = 'success') {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
  notificationsEl.appendChild(wrapper);
  // Автоматическое скрытие через 5 секунд
  setTimeout(() => {
    const alert = bootstrap.Alert.getOrCreateInstance(wrapper.firstElementChild);
    alert.close();
  }, 5000);
}

// Загрузка курсов с сервера
async function loadCourses() {
  try {
    const response = await fetch(`${API_BASE}/courses?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Не удалось загрузить курсы');
    courses = await response.json();
    // Инициализировать фильтрованный массив
    filteredCourses = [...courses];
    renderCourses();
  } catch (error) {
    // При ошибке загрузки используем тестовые данные, чтобы интерфейс оставался работоспособнымм
    console.warn('Ошибка загрузки курсов, используются демонстрационные данные:', error);
    courses = [
      {
        id: 1,
        name: 'Русский язык для начинающих',
        description: 'Курс для тех, кто только начинает изучать русский язык.',
        teacher: 'Ирина Петровна',
        level: 'Beginner',
        total_length: 8,
        week_length: 2,
        start_dates: ['2025-02-01T09:00:00', '2025-02-01T12:00:00', '2025-03-01T09:00:00'],
        course_fee_per_hour: 200
      },
      {
        id: 2,
        name: 'Английский язык: средний уровень',
        description: 'Углубленный курс английского языка для продолжающих.',
        teacher: 'Джон Смит',
        level: 'Intermediate',
        total_length: 10,
        week_length: 3,
        start_dates: ['2025-02-15T18:00:00', '2025-03-15T18:00:00'],
        course_fee_per_hour: 300
      }
    ];
    filteredCourses = [...courses];
    renderCourses();
    showNotification('Не удалось загрузить курсы, отображены демонстрационные данные', 'warning');
  }
}

// Загрузка репетиторов с сервера
async function loadTutors() {
  try {
    const response = await fetch(`${API_BASE}/tutors?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Не удалось загрузить репетиторов');
    tutors = await response.json();
    renderTutors();
  } catch (error) {
    console.warn('Ошибка загрузки репетиторов, используются демонстрационные данные:', error);
    tutors = [
      {
        id: 1,
        name: 'Ирина Петровна',
        work_experience: 5,
        languages_spoken: ['English', 'Russian'],
        languages_offered: ['Russian'],
        language_level: 'Advanced',
        price_per_hour: 500
      },
      {
        id: 2,
        name: 'Джон Смит',
        work_experience: 3,
        languages_spoken: ['English', 'Spanish'],
        languages_offered: ['English'],
        language_level: 'Intermediate',
        price_per_hour: 400
      }
    ];
    renderTutors();
    showNotification('Не удалось загрузить репетиторов, отображены демонстрационные данные', 'warning');
  }
}

// Рендер курсов с учётом пагинации
function renderCourses(page = 1) {
  currentCoursePage = page;
  const startIndex = (page - 1) * COURSES_PER_PAGE;
  const endIndex = startIndex + COURSES_PER_PAGE;
  const coursesToShow = filteredCourses.slice(startIndex, endIndex);
  const coursesListEl = document.getElementById('coursesList');
  coursesListEl.innerHTML = '';

  coursesToShow.forEach((course) => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';
    // Карточка курса
    col.innerHTML = `
      <div class="card h-100 course-card shadow-sm">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${course.name}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${course.level}</h6>
          <p class="card-text course-description" title="${course.description}">${course.description}</p>
          <p class="small mb-1"><strong>Преподаватель:</strong> ${course.teacher}</p>
          <p class="small mb-1"><strong>Длительность:</strong> ${course.total_length} нед., ${course.week_length} ч/нед.</p>
          <p class="small mb-3"><strong>Цена/час:</strong> ${course.course_fee_per_hour} ₽</p>
          <div class="mt-auto">
            <button class="btn btn-primary w-100" data-course-id="${course.id}">Подать заявку</button>
          </div>
        </div>
      </div>
    `;
    coursesListEl.appendChild(col);
  });
  renderCoursesPagination();
}

// Рендер пагинации для курсов
function renderCoursesPagination() {
  const paginationEl = document.getElementById('coursesPagination');
  paginationEl.innerHTML = '';
  const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
  // Если страниц меньше 2, скрыть пагинацию
  if (totalPages <= 1) return;
  for (let page = 1; page <= totalPages; page++) {
    const li = document.createElement('li');
    li.className = 'page-item' + (page === currentCoursePage ? ' active' : '');
    li.innerHTML = `<a class="page-link" href="#">${page}</a>`;
    li.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      renderCourses(page);
    });
    paginationEl.appendChild(li);
  }
}

// Фильтрация курсов по названию и уровню
function applyCourseFilters() {
  const searchValue = document.getElementById('courseSearch').value.toLowerCase();
  const levelValue = document.getElementById('courseLevel').value;
  filteredCourses = courses.filter((course) => {
    const matchesName = course.name.toLowerCase().includes(searchValue);
    const matchesLevel = levelValue ? course.level === levelValue : true;
    return matchesName && matchesLevel;
  });
  renderCourses(1);
}

// Рендер таблицы репетиторов
function renderTutors() {
  const tbody = document.querySelector('#tutorsTable tbody');
  tbody.innerHTML = '';
  const languageFilter = document.getElementById('tutorLanguage').value.toLowerCase();
  const experienceFilter = parseInt(document.getElementById('tutorExperience').value, 10);
  tutors.forEach((tutor) => {
    // Фильтрация по языку и опыту
    const speaks = tutor.languages_offered.map((lang) => lang.toLowerCase());
    const matchesLanguage = languageFilter
      ? speaks.some((lang) => lang.includes(languageFilter))
      : true;
    const matchesExperience = !isNaN(experienceFilter)
      ? tutor.work_experience >= experienceFilter
      : true;
    if (!matchesLanguage || !matchesExperience) return;
    const tr = document.createElement('tr');
  
    tr.innerHTML = `
      <td>${tutor.name}</td>
      <td>${tutor.language_level}</td>
      <td>${tutor.languages_offered.join(', ')}</td>
      <td>${tutor.work_experience}</td>
      <td>${tutor.price_per_hour}</td>
    `;
    tbody.appendChild(tr);
  });
}


function openOrderModal(course) {
  selectedCourse = course;
  // Установить значения полей
  document.getElementById('orderCourseName').value = course.name;

  document.getElementById('orderTeacher').value = course.teacher;
  document.getElementById('orderDuration').value = course.total_length;
  // Заполнить доступные даты (группировать по дате)
  const dateSelect = document.getElementById('orderDate');
  dateSelect.innerHTML = '<option value="">Выберите дату</option>';
  const dates = [];
  course.start_dates.forEach((dateString) => {
    const dateObj = new Date(dateString);
    const dateOnly = dateObj.toISOString().split('T')[0];
    if (!dates.includes(dateOnly)) dates.push(dateOnly);
  });
  dates.forEach((d) => {
    const option = document.createElement('option');
    option.value = d;
    option.textContent = new Date(d).toLocaleDateString('ru-RU');
    dateSelect.appendChild(option);
  });
  // Очистить время и стоимость
  document.getElementById('orderTime').innerHTML = '';
  document.getElementById('orderTime').disabled = true;
  document.getElementById('orderEndDate').value = '';
  document.getElementById('orderPrice').value = '';
  document.getElementById('orderPersons').value = 1;
  // Сбросить опции
  ['optionSupplementary','optionPersonalized','optionExcursions','optionAssessment','optionInteractive'].forEach(id=>{
    document.getElementById(id).checked = false;
  });
  // Открыть модальное окно
  const modal = new bootstrap.Modal(document.getElementById('orderModal'));
  modal.show();
}

// Заполнение времени в зависимости от выбранной даты
function handleDateChange() {
  const dateValue = document.getElementById('orderDate').value;
  const timeSelect = document.getElementById('orderTime');
  if (!dateValue) {
    timeSelect.innerHTML = '';
    timeSelect.disabled = true;
    return;
  }
  timeSelect.disabled = false;
  timeSelect.innerHTML = '<option value="">Выберите время</option>';
  // Найти все start_dates, соответствующие выбранной дате
  const timesForDate = selectedCourse.start_dates
    .filter((d) => d.startsWith(dateValue))
    .map((d) => {
      const dt = new Date(d);
      // Extract time in HH:MM
      return dt.toISOString().substring(11, 16);
    });
  timesForDate.forEach((time) => {
    const option = document.createElement('option');
    option.value = time;
    option.textContent = time;
    timeSelect.appendChild(option);
  });
}

// Вычислить дату окончания курса
function calculateEndDate(startDate, startTime, totalWeeks) {
  const start = new Date(`${startDate}T${startTime}`);
  // Продолжительность в неделях; к окончанию прибавляем (weeks * 7 days)
  const end = new Date(start);
  end.setDate(end.getDate() + totalWeeks * 7);
  return end;
}

// Расчет стоимости заявки
function calculatePrice() {
  if (!selectedCourse) return 0;
  const date = document.getElementById('orderDate').value;
  const time = document.getElementById('orderTime').value;
  const persons = parseInt(document.getElementById('orderPersons').value, 10) || 1;
  if (!date || !time) return 0;
  const totalLengthWeeks = selectedCourse.total_length;
  const weekHours = selectedCourse.week_length;
  const durationInHours = totalLengthWeeks * weekHours;
  let multiplier = 1;
  // Проверка выходных: суббота (6) или воскресенье (0)
  const startDateTime = new Date(`${date}T${time}`);
  const day = startDateTime.getDay();
  if (day === 0 || day === 6) {
    multiplier = 1.5;
  }
  // Утренний или вечерний тариф
  let morningSurcharge = 0;
  let eveningSurcharge = 0;
  const [hours, minutes] = time.split(':').map(Number);
  if (hours >= 9 && hours < 12) {
    morningSurcharge = 400;
  }
  if (hours >= 18 && hours < 20) {
    eveningSurcharge = 1000;
  }
  // Базовая стоимость
  let price = (selectedCourse.course_fee_per_hour * durationInHours * multiplier + morningSurcharge + eveningSurcharge) * persons;
  // Скидка за раннюю регистрацию (10%) если старт не менее чем за месяц
  const now = new Date();
  const diffDays = (startDateTime - now) / (1000 * 3600 * 24);
  const earlyRegistration = diffDays >= 30;
  // Скидка групповой записи (15%) если >=5 человек
  const groupEnrollment = persons >= 5;
  // Интенсивный курс (добавка 20%) если >=5 часов/неделю
  const intensiveCourse = weekHours >= 5;
  // Опции пользователя
  const supplementary = document.getElementById('optionSupplementary').checked;
  const personalized = document.getElementById('optionPersonalized').checked;
  const excursions = document.getElementById('optionExcursions').checked;
  const assessment = document.getElementById('optionAssessment').checked;
  const interactive = document.getElementById('optionInteractive').checked;
  // Применяем доплаты и надбавки
  if (supplementary) price += 2000 * persons;
  if (personalized) price += 1500 * totalLengthWeeks;
  if (assessment) price += 300;
  // Процентные надбавки
  if (excursions) price *= 1.25;
  if (interactive) price *= 1.5;
  // Процентные скидки/надбавки
  if (intensiveCourse) price *= 1.2;
  if (earlyRegistration) price *= 0.9;
  if (groupEnrollment) price *= 0.85;
  return Math.round(price);
}

// Обновление стоимости и даты окончания
function updatePriceAndEndDate() {
  const date = document.getElementById('orderDate').value;
  const time = document.getElementById('orderTime').value;
  if (date && time) {
    const endDate = calculateEndDate(date, time, selectedCourse.total_length);
    document.getElementById('orderEndDate').value = endDate.toLocaleDateString('ru-RU');
  }
  const price = calculatePrice();
  document.getElementById('orderPrice').value = price ? `${price} ₽` : '';
}

// Отправка заявки на сервер
async function submitOrder() {
  const date = document.getElementById('orderDate').value;
  const time = document.getElementById('orderTime').value;
  const persons = parseInt(document.getElementById('orderPersons').value, 10) || 1;
  const durationInHours = selectedCourse.total_length * selectedCourse.week_length;
  const price = calculatePrice();
  if (!date || !time) {
    showNotification('Пожалуйста, выберите дату и время', 'warning');
    return;
  }
  // Формируем объект заявки
  const orderData = {
    tutor_id: selectedTutor ? selectedTutor.id : 0,
    course_id: selectedCourse.id,
    date_start: date,
    time_start: time,
    duration: durationInHours,
    persons: persons,
    price: price,
    early_registration: false,
    group_enrollment: false,
    intensive_course: false,
    supplementary: document.getElementById('optionSupplementary').checked,
    personalized: document.getElementById('optionPersonalized').checked,
    excursions: document.getElementById('optionExcursions').checked,
    assessment: document.getElementById('optionAssessment').checked,
    interactive: document.getElementById('optionInteractive').checked
  };

  const startDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  const diffDays = (startDateTime - now) / (1000 * 3600 * 24);
  if (diffDays >= 30) orderData.early_registration = true;
  if (persons >= 5) orderData.group_enrollment = true;
  if (selectedCourse.week_length >= 5) orderData.intensive_course = true;
  try {
    const response = await fetch(`${API_BASE}/orders?api_key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Ошибка при оформлении заявки');
    showNotification('Заявка успешно создана!', 'success');
    // Закрыть модальное окно
    const modalEl = document.getElementById('orderModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
  } catch (error) {
    showNotification(error.message, 'danger');
  }
}

// Инициализация событий и загрузка данных
document.addEventListener('DOMContentLoaded', () => {
  // Загрузить данные
  loadCourses();
  loadTutors();
  // Обработчики фильтров курсов
  document.getElementById('courseSearch').addEventListener('input', applyCourseFilters);
  document.getElementById('courseLevel').addEventListener('change', applyCourseFilters);
  // Обработчики фильтров репетиторов
  document.getElementById('tutorLanguage').addEventListener('input', renderTutors);
  document.getElementById('tutorExperience').addEventListener('input', renderTutors);
  
  document.getElementById('coursesList').addEventListener('click', (event) => {
    if (event.target.matches('button[data-course-id]')) {
      const id = parseInt(event.target.getAttribute('data-course-id'), 10);
      const course = courses.find((c) => c.id === id);
      if (course) {
        openOrderModal(course);
      }
    }
  });
  // Обработчики формы заявки
  document.getElementById('orderDate').addEventListener('change', () => {
    handleDateChange();
    updatePriceAndEndDate();
  });
  document.getElementById('orderTime').addEventListener('change', updatePriceAndEndDate);
  document.getElementById('orderPersons').addEventListener('input', updatePriceAndEndDate);
  ['optionSupplementary','optionPersonalized','optionExcursions','optionAssessment','optionInteractive'].forEach((id) => {
    document.getElementById(id).addEventListener('change', updatePriceAndEndDate);
  });
  // Отправка формы
  document.getElementById('orderSubmit').addEventListener('click', submitOrder);

  initResources();
});
