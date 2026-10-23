/**
 * Celsior Detailing — Interactive Vehicle Configurator & Booking Engine
 * Single Source of Truth for Pricing, Durations, Validation & Clipboard Handling
 * Strict Zero-Emoji Architecture
 */

(function () {
  'use strict';

  // Constants & Destination Endpoints
  const DESTINATION_PHONE_DIGITS = '79339955975';
  const STUDIO_WHATSAPP_BASE = 'https://wa.me/' + DESTINATION_PHONE_DIGITS;
  const STUDIO_TELEGRAM_URL = 'https://t.me/celsiorkras';

  // Authoritative Pricing Catalog & Multipliers
  const PRICING_MODEL = {
    classes: {
      coupe_sedan: {
        id: 'coupe_sedan',
        title: 'Купе / Седан',
        examples: 'BMW 4, Porsche 911, Audi A5',
        multiplier: 1.0
      },
      crossover: {
        id: 'crossover',
        title: 'Кроссовер',
        examples: 'Porsche Macan, BMW X3/X4, Lexus RX',
        multiplier: 1.2
      },
      suv_luxury: {
        id: 'suv_luxury',
        title: 'Премиум SUV / Внедорожник',
        examples: 'Porsche Cayenne, Panamera, BMW X5/X7',
        multiplier: 1.45
      }
    },
    services: {
      wash_3phase: {
        id: 'wash_3phase',
        name: '3-фазная детейлинг-мойка + очистка битума и почек',
        basePrice: 3500,
        durationHours: 2.5
      },
      polishing: {
        id: 'polishing',
        name: 'Восстановительная полировка кузова (глубокий глянец)',
        basePrice: 28000,
        durationHours: 14.0
      },
      ceramics_9h: {
        id: 'ceramics_9h',
        name: 'Нанокерамика 9H (2 слоя + гидрофобный TopCoat)',
        basePrice: 32000,
        durationHours: 12.0
      },
      interior_detailing: {
        id: 'interior_detailing',
        name: 'Деликатная химчистка интерьера с разбором',
        basePrice: 18000,
        durationHours: 10.0
      },
      leather_care: {
        id: 'leather_care',
        name: 'Очистка пор и керамическая консервация кожи',
        basePrice: 6500,
        durationHours: 4.0
      },
      ppf_front: {
        id: 'ppf_front',
        name: 'Антигравийная полиуретановая плёнка (Ударная зона / Морда)',
        basePrice: 65000,
        durationHours: 18.0
      }
    }
  };

  /**
   * Returns current calendar date in Krasnoyarsk timezone (UTC+7) in YYYY-MM-DD
   * @returns {string}
   */
  function getKrasnoyarskTodayYMD() {
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const krasTime = new Date(utcMs + (7 * 3600000));
    const yyyy = krasTime.getFullYear();
    const mm = String(krasTime.getMonth() + 1).padStart(2, '0');
    const dd = String(krasTime.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Russian pluralization helper for day counts
   * @param {number} daysVal
   * @returns {string}
   */
  function pluralizeDays(daysVal) {
    const intPart = Math.floor(daysVal);
    if (daysVal !== intPart) {
      return 'дня';
    }
    if (intPart % 10 === 1 && intPart % 100 !== 11) {
      return 'день';
    } else if (intPart % 10 >= 2 && intPart % 10 <= 4 && (intPart % 100 < 10 || intPart % 100 >= 20)) {
      return 'дня';
    }
    return 'дней';
  }

  /**
   * Humanized duration formatter with unified 8h workday standard
   * @param {number} totalHours
   * @returns {string}
   */
  function formatDuration(totalHours) {
    if (totalHours <= 0) return '0 часов';
    if (totalHours < 8.0) {
      const h = totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1);
      if (h == 1) return '1 час';
      if (h >= 2 && h <= 4) return h + ' часа';
      return h + ' часов';
    }
    const days = Math.round((totalHours / 8.0) * 10) / 10;
    const h = totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1);
    return '~' + days + ' ' + pluralizeDays(days) + ' (' + h + ' ч)';
  }

  /**
   * Pure calculation engine
   * @param {string} classId
   * @param {Array<string>} serviceIds
   * @returns {object}
   */
  function calculateEstimate(classId, serviceIds) {
    const carClass = PRICING_MODEL.classes[classId] || PRICING_MODEL.classes.coupe_sedan;
    if (!serviceIds || serviceIds.length === 0) {
      return {
        carClass: carClass,
        selectedServices: [],
        totalPrice: 0,
        totalHours: 0,
        priceFormatted: '0 ₽',
        durationFormatted: '0 часов'
      };
    }

    let rawPrice = 0;
    let totalHours = 0;
    const selectedServices = [];

    serviceIds.forEach(function (id) {
      const srv = PRICING_MODEL.services[id];
      if (srv) {
        selectedServices.push(srv);
        rawPrice += srv.basePrice * carClass.multiplier;
        totalHours += srv.durationHours;
      }
    });

    const roundedPrice = Math.round(rawPrice / 500) * 500;
    const priceFormatted = '~' + roundedPrice.toLocaleString('ru-RU') + ' ₽';
    const durationFormatted = formatDuration(totalHours);

    return {
      carClass: carClass,
      selectedServices: selectedServices,
      totalPrice: roundedPrice,
      totalHours: totalHours,
      priceFormatted: priceFormatted,
      durationFormatted: durationFormatted
    };
  }

  /**
   * Builds the formatted booking text payload and links
   * @param {object} calcState
   * @param {string} clientName
   * @param {string} clientPhone
   * @param {string} preferredDate
   * @returns {object}
   */
  function generateBookingPayload(calcState, clientName, clientPhone, preferredDate) {
    let servicesLines = (calcState.selectedServices || []).map(function (s) {
      return '  • ' + s.name;
    }).join('\n');

    if (!servicesLines) {
      servicesLines = '  • (Услуги не выбраны)';
    }

    const lines = [
      'Здравствуйте, Celsior Detailing!',
      'Хочу записаться на детейлинг на Семафорной 265А:',
      '- Автомобиль: ' + calcState.carClass.title,
      '- Выбранные услуги:\n' + servicesLines,
      '- Предварительный расчёт: ' + calcState.priceFormatted,
      '- Ориентировочный срок: ' + calcState.durationFormatted
    ];

    if (preferredDate && preferredDate.trim()) {
      lines.push('- Желаемая дата: ' + preferredDate.trim());
    }
    if (clientName && clientName.trim()) {
      lines.push('- Клиент: ' + clientName.trim());
    }
    if (clientPhone && clientPhone.trim()) {
      lines.push('- Телефон: ' + clientPhone.trim());
    }

    const plainMessage = lines.join('\n');
    const encodedQuery = encodeURIComponent(plainMessage);
    const whatsappUrl = STUDIO_WHATSAPP_BASE + '?text=' + encodedQuery;

    return {
      plainMessage: plainMessage,
      encodedQuery: encodedQuery,
      whatsappUrl: whatsappUrl,
      telegramUrl: STUDIO_TELEGRAM_URL
    };
  }

  /**
   * DOM Configurator Controller
   */
  function initConfiguratorUI() {
    const classRadios = document.querySelectorAll('input[name="car-class"]');
    const serviceBoxes = document.querySelectorAll('input[name="service-item"]');
    const nameInput = document.getElementById('bookingClientName');
    const phoneInput = document.getElementById('bookingClientPhone');
    const dateInput = document.getElementById('bookingClientDate');

    const outClassName = document.getElementById('calcCarClassName');
    const outDuration = document.getElementById('calcTotalDuration');
    const outPrice = document.getElementById('calcTotalPrice');

    const btnWhatsApp = document.getElementById('btnBookWhatsApp');
    const btnTelegram = document.getElementById('btnBookTelegram');
    const btnCopy = document.getElementById('btnCopyBooking');
    const toast = document.getElementById('bookingToast');

    if (!classRadios.length || !serviceBoxes.length) return;

    // Restrict date input so past dates cannot be selected (UTC+7 Krasnoyarsk)
    const todayKras = getKrasnoyarskTodayYMD();
    if (dateInput) {
      dateInput.min = todayKras;
      dateInput.addEventListener('change', function () {
        validateDate();
        recalculate();
      });
    }

    function validateDate() {
      if (!dateInput) return true;
      const val = dateInput.value;
      if (!val) {
        dateInput.classList.remove('is-invalid');
        return true;
      }
      if (val < todayKras) {
        dateInput.classList.add('is-invalid');
        return false;
      }
      dateInput.classList.remove('is-invalid');
      return true;
    }

    let toastTimer = null;
    function showToast(customTitle, customText) {
      if (!toast) return;
      const titleEl = toast.querySelector('.booking-toast-title');
      const textEl = toast.querySelector('.booking-toast-text');
      if (titleEl && customTitle) titleEl.textContent = customTitle;
      if (textEl && customText) textEl.textContent = customText;

      toast.classList.add('active');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.classList.remove('active');
      }, 3500);
    }

    function copyToClipboard(text, customTitle, customText) {
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(function () {
            showToast(customTitle, customText);
          })
          .catch(function () {
            fallbackCopy(text, customTitle, customText);
          });
      } else {
        fallbackCopy(text, customTitle, customText);
      }
    }

    function fallbackCopy(text, customTitle, customText) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      let copySucceeded = false;
      try {
        copySucceeded = document.execCommand('copy');
      } catch (err) {
        console.warn('Fallback execCommand copy error:', err);
      }
      document.body.removeChild(textarea);

      if (copySucceeded) {
        showToast(customTitle, customText);
      } else {
        window.prompt('Скопируйте текст заявки (Ctrl+C / Cmd+C):', text);
      }
    }

    function recalculate() {
      // 1. Get selected car class
      let selectedClassId = 'coupe_sedan';
      classRadios.forEach(function (radio) {
        if (radio.checked) {
          selectedClassId = radio.value;
        }
      });

      // Update pill classes in UI
      classRadios.forEach(function (radio) {
        const pill = radio.closest('.class-pill');
        if (pill) {
          if (radio.checked) {
            pill.classList.add('active');
          } else {
            pill.classList.remove('active');
          }
        }
      });

      // 2. Get selected services
      const selectedServiceIds = [];
      serviceBoxes.forEach(function (box) {
        const wrap = box.closest('.checkbox-toggle-wrap');
        if (box.checked) {
          if (wrap) wrap.classList.add('checked');
          selectedServiceIds.push(box.value);
        } else {
          if (wrap) wrap.classList.remove('checked');
        }
      });

      // 3. Compute estimates
      const estimate = calculateEstimate(selectedClassId, selectedServiceIds);

      // 4. Update UI labels
      if (outClassName) outClassName.textContent = estimate.carClass.title;
      if (outDuration) outDuration.textContent = estimate.durationFormatted;
      if (outPrice) outPrice.textContent = estimate.priceFormatted;

      // 5. Generate message payload
      const clientName = nameInput ? nameInput.value : '';
      const clientPhone = phoneInput ? phoneInput.value : '';
      const isDateValid = validateDate();
      const clientDate = (dateInput && isDateValid) ? dateInput.value : '';

      const payload = generateBookingPayload(estimate, clientName, clientPhone, clientDate);

      // 6. Update action buttons
      if (btnWhatsApp) {
        btnWhatsApp.href = payload.whatsappUrl;
      }
      if (btnTelegram) {
        btnTelegram.href = payload.telegramUrl;
      }

      return payload.plainMessage;
    }

    // Attach input listeners
    classRadios.forEach(function (radio) {
      radio.addEventListener('change', recalculate);
    });

    serviceBoxes.forEach(function (box) {
      box.addEventListener('change', recalculate);
    });

    if (nameInput) nameInput.addEventListener('input', recalculate);
    if (phoneInput) phoneInput.addEventListener('input', recalculate);
    if (dateInput) dateInput.addEventListener('input', recalculate);

    // Initial calculation run
    recalculate();

    // Clipboard Copy Button Handler
    if (btnCopy) {
      btnCopy.addEventListener('click', function (e) {
        e.preventDefault();
        const textToCopy = recalculate();
        copyToClipboard(textToCopy, 'Расчёт скопирован в буфер', 'Текст заявки готов для вставки в мессенджер');
      });
    }

    // Telegram button auto-copies formatted payload to clipboard before navigating
    if (btnTelegram) {
      btnTelegram.addEventListener('click', function () {
        const textToCopy = recalculate();
        copyToClipboard(textToCopy, 'Расчёт скопирован для Telegram', 'Вставьте скопированный текст заявки в чат со студией');
      });
    }

    return {
      recalculate: recalculate,
      calculateEstimate: calculateEstimate,
      generateBookingPayload: generateBookingPayload
    };
  }

  // Expose global interface for unit tests and verification
  window.CelsiorConfigurator = {
    PRICING_MODEL: PRICING_MODEL,
    calculateEstimate: calculateEstimate,
    generateBookingPayload: generateBookingPayload,
    formatDuration: formatDuration,
    getKrasnoyarskTodayYMD: getKrasnoyarskTodayYMD,
    init: initConfiguratorUI
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfiguratorUI);
  } else {
    initConfiguratorUI();
  }
})();
