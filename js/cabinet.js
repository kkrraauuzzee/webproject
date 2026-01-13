

const API_BASE = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';
const API_KEY = '2d3260ba-f2ad-4b0a-944f-2d267c6ae53a';

let orders = [];
let coursesCache = {};
let tutorsCache = {};
const ORDERS_PER_PAGE = 5;
let currentOrderPage = 1;

const notificationsEl = document.getElementById('notifications');

function showNotification(message, type = 'success') {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
  notificationsEl.appendChild(wrapper);
  setTimeout(() => {
    const alert = bootstrap.Alert.getOrCreateInstance(wrapper.firstElementChild);
    alert.close();
  }, 5000);
}

async function loadOrders() {
  try {
    const response = await fetch(`${API_BASE}/orders?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Не удалось загрузить заявки');
    orders = await response.json();
    renderOrders(1);
  } catch (error) {
    console.warn('Ошибка загрузки заявок, используются демонстрационные данные:', error);
    orders = [
      {
        id: 1,
        tutor_id: 0,
        course_id: 1,
        date_start: '2025-01-15',
        time_start: '14:00',
        duration: 1,
        persons: 2,
        price: 2500,
        early_registration: true,
        group_enrollment: false,
        intensive_course: true,
        supplementary: true,
        personalized: false,
        excursions: false,
        assessment: false,
        interactive: true
      }
    ];
    // Заполним кэш курсов для демонстрационных данных
    coursesCache[1] = {
      id: 1,
      name: 'Русский язык для начинающих',
      week_length: 2,
      total_length: 8,
      course_fee_per_hour: 200
    };
    renderOrders(1);
    showNotification('Не удалось загрузить заявки, отображены демонстрационные данные', 'warning');
  }
}

// Получить название курса по ID, кэшировать для последующих запросов
async function getCourseName(id) {
  if (!id) return '';
  if (coursesCache[id]) return coursesCache[id].name;
  try {
    const response = await fetch(`${API_BASE}/course/${id}?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Ошибка получения курса');
    const course = await response.json();
    coursesCache[id] = course;
    return course.name;
  } catch {
    return '';
  }
}

// Получить имя репетитора по ID
async function getTutorName(id) {
  if (!id) return '';
  if (tutorsCache[id]) return tutorsCache[id].name;
  try {
    const response = await fetch(`${API_BASE}/tutors/${id}?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Ошибка получения репетитора');
    const tutor = await response.json();
    tutorsCache[id] = tutor;
    return tutor.name;
  } catch {
    return '';
  }
}

// Рендер таблицы заявок
async function renderOrders(page) {
  currentOrderPage = page;
  const startIndex = (page - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const ordersToShow = orders.slice(startIndex, endIndex);
  const tbody = document.querySelector('#ordersTable tbody');
  tbody.innerHTML = '';
  // Асинхронно получить названия курсов/репетиторов
  for (let i = 0; i < ordersToShow.length; i++) {
    const order = ordersToShow[i];
    const tr = document.createElement('tr');
    const courseName = await getCourseName(order.course_id);
    const tutorName = await getTutorName(order.tutor_id);
    const title = courseName || tutorName || '';
    tr.innerHTML = `
      <td>${startIndex + i + 1}</td>
      <td>${title}</td>
      <td>${order.date_start}</td>
      <td>${order.time_start}</td>
      <td>${order.persons}</td>
      <td>${order.price}</td>
      <td>
        <button class="btn btn-sm btn-outline-info me-1" data-action="view" data-id="${order.id}">Подробнее</button>
        <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${order.id}">Изменить</button>
        <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${order.id}">Удалить</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
  renderOrdersPagination();
}

function renderOrdersPagination() {
  const paginationEl = document.getElementById('ordersPagination');
  paginationEl.innerHTML = '';
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  if (totalPages <= 1) return;
  for (let page = 1; page <= totalPages; page++) {
    const li = document.createElement('li');
    li.className = 'page-item' + (page === currentOrderPage ? ' active' : '');
    li.innerHTML = `<a class="page-link" href="#">${page}</a>`;
    li.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      renderOrders(page);
    });
    paginationEl.appendChild(li);
  }
}

// Обработчик кликов по кнопкам действий
document.getElementById('ordersTable').addEventListener('click', (event) => {
  const id = event.target.getAttribute('data-id');
  const action = event.target.getAttribute('data-action');
  if (!id || !action) return;
  const orderId = parseInt(id, 10);
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;
  if (action === 'view') {
    openViewModal(order);
  } else if (action === 'edit') {
    openEditModal(order);
  } else if (action === 'delete') {
    openDeleteModal(order);
  }
});

// Открыть модал для просмотра информации
async function openViewModal(order) {
  const viewInfo = document.getElementById('viewInfo');
  const form = document.getElementById('editForm');
  // Переключить на режим просмотра: скрыть форму, показать инфо
  form.classList.add('d-none');
  viewInfo.classList.remove('d-none');
  // Составить информацию
  const courseName = await getCourseName(order.course_id);
  const tutorName = await getTutorName(order.tutor_id);
  const details = `
    <p><strong>Курс/Репетитор:</strong> ${courseName || tutorName}</p>
    <p><strong>Дата:</strong> ${order.date_start}</p>
    <p><strong>Время:</strong> ${order.time_start}</p>
    <p><strong>Студенты:</strong> ${order.persons}</p>
    <p><strong>Стоимость:</strong> ${order.price} ₽</p>
    <p><strong>Опции:</strong> ${getOptionsList(order).join(', ') || 'Нет'}</p>
  `;
  viewInfo.innerHTML = details;
  document.getElementById('editModalLabel').textContent = 'Просмотр заявки';
  document.getElementById('editSaveBtn').classList.add('d-none');
  const modal = new bootstrap.Modal(document.getElementById('editModal'));
  modal.show();
}

function getOptionsList(order) {
  const opts = [];
  if (order.early_registration) opts.push('ранняя регистрация');
  if (order.group_enrollment) opts.push('групповая запись');
  if (order.intensive_course) opts.push('интенсивный курс');
  if (order.supplementary) opts.push('материалы');
  if (order.personalized) opts.push('индивидуальные');
  if (order.excursions) opts.push('экскурсии');
  if (order.assessment) opts.push('оценка уровня');
  if (order.interactive) opts.push('онлайн‑платформа');
  return opts;
}

// Открыть модал для редактирования
async function openEditModal(order) {
  // Показать форму и скрыть инфо
  const form = document.getElementById('editForm');
  const viewInfo = document.getElementById('viewInfo');
  form.classList.remove('d-none');
  viewInfo.classList.add('d-none');
  document.getElementById('editModalLabel').textContent = 'Редактирование заявки';
  document.getElementById('editSaveBtn').classList.remove('d-none');
  // Заполнить форму
  document.getElementById('editOrderId').value = order.id;
  document.getElementById('editCourseId').value = order.course_id;
  document.getElementById('editTutorId').value = order.tutor_id;
  document.getElementById('editDate').value = order.date_start;
  document.getElementById('editTime').value = order.time_start;
  document.getElementById('editDuration').value = order.duration;
  document.getElementById('editPersons').value = order.persons;
  document.getElementById('editPrice').value = order.price;
  // Чекбоксы
  document.getElementById('editSupplementary').checked = !!order.supplementary;
  document.getElementById('editPersonalized').checked = !!order.personalized;
  document.getElementById('editExcursions').checked = !!order.excursions;
  document.getElementById('editAssessment').checked = !!order.assessment;
  document.getElementById('editInteractive').checked = !!order.interactive;
  // Показать модальное окно
  const modal = new bootstrap.Modal(document.getElementById('editModal'));
  modal.show();
}

// Обновить цену при изменении полей
function updateEditPrice() {
  const persons = parseInt(document.getElementById('editPersons').value, 10) || 1;
  const date = document.getElementById('editDate').value;
  const time = document.getElementById('editTime').value;
  const duration = parseInt(document.getElementById('editDuration').value, 10) || 1;
  // Для вычисления стоимости нам потребуется информация о курсе или репетиторе.
  // Если выбран курс, используем соответствующий объект из кэша.
  const courseId = parseInt(document.getElementById('editCourseId').value, 10);
  let course = coursesCache[courseId];
  if (!course && courseId) {
    // Если нет в кэше, ничего не обновляем.
    document.getElementById('editPrice').value = '';
    return;
  }
  // В случае заявки к репетитору без курса, оставляем цену прежней.
  if (!course) {
    return;
  }
  if (!date || !time) return;
  // Расчёт стоимости аналогичен функции calculatePrice из main.js
  const weekLength = course.week_length;
  const totalWeeks = course.total_length;
  const durationInHours = totalWeeks * weekLength;
  let multiplier = 1;
  const startDateTime = new Date(`${date}T${time}`);
  const day = startDateTime.getDay();
  if (day === 0 || day === 6) multiplier = 1.5;
  let morningSurcharge = 0;
  let eveningSurcharge = 0;
  const [hh] = time.split(':').map(Number);
  if (hh >= 9 && hh < 12) morningSurcharge = 400;
  if (hh >= 18 && hh < 20) eveningSurcharge = 1000;
  let price = (course.course_fee_per_hour * durationInHours * multiplier + morningSurcharge + eveningSurcharge) * persons;
  // Опции
  const supplementary = document.getElementById('editSupplementary').checked;
  const personalized = document.getElementById('editPersonalized').checked;
  const excursions = document.getElementById('editExcursions').checked;
  const assessment = document.getElementById('editAssessment').checked;
  const interactive = document.getElementById('editInteractive').checked;
  if (supplementary) price += 2000 * persons;
  if (personalized) price += 1500 * totalWeeks;
  if (assessment) price += 300;
  if (excursions) price *= 1.25;
  if (interactive) price *= 1.5;
  if (weekLength >= 5) price *= 1.2;
  // Скидки
  const now = new Date();
  const diffDays = (startDateTime - now) / (1000 * 3600 * 24);
  if (diffDays >= 30) price *= 0.9;
  if (persons >= 5) price *= 0.85;
  document.getElementById('editPrice').value = Math.round(price);
}

// Сохранение изменений заявки
async function saveEdit() {
  const orderId = parseInt(document.getElementById('editOrderId').value, 10);
  if (!orderId) return;
  const body = {};
  // Собираем изменённые поля (для простоты отправляем все поля)
  body.date_start = document.getElementById('editDate').value;
  body.time_start = document.getElementById('editTime').value;
  body.persons = parseInt(document.getElementById('editPersons').value, 10) || 1;
  body.price = parseInt(document.getElementById('editPrice').value, 10) || 0;
  body.supplementary = document.getElementById('editSupplementary').checked;
  body.personalized = document.getElementById('editPersonalized').checked;
  body.excursions = document.getElementById('editExcursions').checked;
  body.assessment = document.getElementById('editAssessment').checked;
  body.interactive = document.getElementById('editInteractive').checked;
  // Скидки и интенсивность пересчитываем на основе условий
  const persons = body.persons;
  const startDateTime = new Date(`${body.date_start}T${body.time_start}`);
  const now = new Date();
  const diffDays = (startDateTime - now) / (1000 * 3600 * 24);
  body.early_registration = diffDays >= 30;
  body.group_enrollment = persons >= 5;
  // Определяем интенсивность, если есть курс
  const courseId = parseInt(document.getElementById('editCourseId').value, 10);
  if (courseId && coursesCache[courseId]) {
    body.intensive_course = coursesCache[courseId].week_length >= 5;
  }
  try {
    const response = await fetch(`${API_BASE}/orders/${orderId}?api_key=${API_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Ошибка при обновлении');
    showNotification('Заявка обновлена', 'success');
    // Обновить локальные данные
    const index = orders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...body };
    }
    renderOrders(currentOrderPage);
    const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
    modal.hide();
  } catch (error) {
    showNotification(error.message, 'danger');
  }
}

let orderToDelete = null;
function openDeleteModal(order) {
  orderToDelete = order;
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
}

async function confirmDelete() {
  if (!orderToDelete) return;
  const id = orderToDelete.id;
  try {
    const response = await fetch(`${API_BASE}/orders/${id}?api_key=${API_KEY}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      await response.json();
      showNotification('Заявка удалена', 'success');
    } else {
      // Если удаление не удалось, но у нас локальные данные, всё равно продолжим
      const result = await response.json().catch(() => ({}));
      console.warn('Ошибка при удалении через API', result);
      showNotification('Удаление недоступно, заявка удалена локально', 'warning');
    }
  } catch (error) {
    console.warn('Ошибка при удалении через API', error);
    showNotification('Удаление недоступно, заявка удалена локально', 'warning');
  }
  // Удалить локально и обновить таблицу
  orders = orders.filter((o) => o.id !== id);
  renderOrders(1);
  const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
  modal.hide();
  orderToDelete = null;
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  // Обновление цены при изменении полей
  ['editDate','editTime','editPersons','editSupplementary','editPersonalized','editExcursions','editAssessment','editInteractive'].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener('change', updateEditPrice);
    if (el.tagName === 'INPUT') {
      el.addEventListener('input', updateEditPrice);
    }
  });
  document.getElementById('editSaveBtn').addEventListener('click', saveEdit);
  document.getElementById('deleteConfirmBtn').addEventListener('click', confirmDelete);
});
