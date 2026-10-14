/**
 * Adana 7/24 Akü Takviye & Mobil Şarj Platform
 * Client Application Logic
 * Domain: adanaakutakviye.com.tr
 * Phone: 0530 478 84 09
 */

document.addEventListener('DOMContentLoaded', () => {
  initGeolocation();
  initDispatchForm();
  initEvDiagnostic();
  initDistrictRadar();
  initServiceChips();
  initFaqAccordion();
  initMobileMenu();
  initPwaPrompt();
});

// Default Contact Parameters
const CONTACT_PHONE = '0530 478 84 09';
const WHATSAPP_RAW_PHONE = '905304788409';

/**
 * Helper: Safely parse static SVG string into DOM element without innerHTML
 */
function createSvgElement(svgMarkup) {
  const doc = new DOMParser().parseFromString(svgMarkup.trim(), 'image/svg+xml');
  return doc.documentElement;
}

/**
 * Helper: Build button content with SVG + text safely
 */
function setButtonContent(btn, svgMarkup, labelText, wrapSpan = false) {
  btn.replaceChildren();
  if (svgMarkup) {
    btn.appendChild(createSvgElement(svgMarkup));
  }
  if (wrapSpan) {
    const span = document.createElement('span');
    span.textContent = labelText;
    btn.appendChild(span);
  } else {
    btn.appendChild(document.createTextNode(' ' + labelText));
  }
}

/**
 * WhatsApp Dispatch Helper
 */
function openWhatsApp(text, phone = WHATSAPP_RAW_PHONE) {
  const cleanPhone = phone.replace(/\D/g, '');
  const targetUrl = text
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${cleanPhone}`;
  const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
  if (!win || win.closed || typeof win.closed === 'undefined') {
    window.location.href = targetUrl;
  }
}

const SPINNER_SVG_18 = `<svg xmlns="http://www.w3.org/2000/svg" class="spinner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-linecap="round"></path></svg>`;
const SPINNER_SVG_16 = `<svg xmlns="http://www.w3.org/2000/svg" class="spinner-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg>`;
const CHECK_SVG_16 = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const PIN_SVG_16 = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>`;

/**
 * 1. Geolocation Integration & Direct Location Sharing
 */
function shareLocationWithWhatsApp(customPrefix = '', btnElement = null) {
  const setWait = () => { document.body.style.cursor = 'wait'; };
  const setDefault = () => { document.body.style.cursor = 'default'; };

  let savedChildren = [];
  if (btnElement) {
    savedChildren = Array.from(btnElement.childNodes).map(n => n.cloneNode(true));
    btnElement.classList.add('loading');
    setButtonContent(btnElement, SPINNER_SVG_18, 'Konum Alınıyor...', true);
  }

  const restoreBtn = () => {
    if (btnElement) {
      btnElement.classList.remove('loading');
      btnElement.replaceChildren(...savedChildren);
    }
  };

  const defaultMsg = customPrefix || "Merhaba, Adana'da akü takviye ve acil yol yardım talebim var.";

  if ('geolocation' in navigator) {
    setWait();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDefault();
        restoreBtn();
        const { latitude, longitude } = position.coords;
        const lat = latitude.toFixed(6);
        const lng = longitude.toFixed(6);
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        const msg = `${defaultMsg}\n\nCanlı Konumum:\n${mapsUrl}`;
        openWhatsApp(msg);
      },
      () => {
        setDefault();
        restoreBtn();
        const fallbackMsg = `${defaultMsg}\n\n(Konumumu WhatsApp üzerinden manuel olarak göndereceğim)`;
        openWhatsApp(fallbackMsg);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  } else {
    restoreBtn();
    alertSafe('Tarayıcınız konum özelliğini desteklemiyor. WhatsApp üzerinden konumunuzu paylaşabilirsiniz.');
    openWhatsApp(defaultMsg);
  }
}

function initGeolocation() {
  // 1. One-click instant location sharing on CTA buttons (Hero, Sticky bar, Floating button)
  const locationButtons = document.querySelectorAll('.btn-share-location, .btn-hero-whatsapp, .btn-sticky-whatsapp, .floating-location-btn');
  locationButtons.forEach((btn) => {
    // Skip EV diagnostic button which updates its own href dynamically
    if (btn.id === 'btnRequestEvSupport' || btn.id === 'btnModalWhatsApp' || btn.id === 'radarBtnWhatsApp') return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const customPrefix = btn.getAttribute('data-msg') || '';
      shareLocationWithWhatsApp(customPrefix, btn);
    });
  });

  // 2. Form GPS Location Picker Button
  const getGpsBtn = document.getElementById('btnGetGps');
  const locationInput = document.getElementById('dispatchLocation');
  const gpsStatus = document.getElementById('gpsStatusText');

  if (!getGpsBtn || !locationInput) return;

  getGpsBtn.addEventListener('click', () => {
    if (!('geolocation' in navigator)) {
      alertSafe('Tarayıcınız konum servisini desteklemiyor. Lütfen adresinizi veya yakındaki belirgin noktayı elle yazınız.');
      return;
    }

    getGpsBtn.disabled = true;
    setButtonContent(getGpsBtn, SPINNER_SVG_16, 'Konum Alınıyor...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        locationInput.value = `Canlı GPS Konumu: ${lat}, ${lng} (${mapsUrl})`;
        locationInput.dataset.lat = lat;
        locationInput.dataset.lng = lng;
        locationInput.dataset.mapsUrl = mapsUrl;

        getGpsBtn.disabled = false;
        getGpsBtn.style.background = 'rgba(34, 197, 94, 0.2)';
        getGpsBtn.style.borderColor = 'rgba(34, 197, 94, 0.5)';
        getGpsBtn.style.color = '#4ade80';
        setButtonContent(getGpsBtn, CHECK_SVG_16, 'Konum Alındı!');

        if (gpsStatus) {
          gpsStatus.textContent = `📍 GPS Koordinatları başarıyla kaydedildi (${lat}, ${lng})`;
          gpsStatus.style.color = '#4ade80';
        }
      },
      (error) => {
        getGpsBtn.disabled = false;
        setButtonContent(getGpsBtn, PIN_SVG_16, 'Konumumu Al');

        let msg = 'Konum izni alınamadı. Lütfen bulunduğunuz yeri veya cadde/ilçe bilgisini yazınız.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Konum erişimine izin verilmedi. Lütfen konum bilginizi kutuya elle yazınız.';
        }
        if (gpsStatus) {
          gpsStatus.textContent = msg;
          gpsStatus.style.color = '#f87171';
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}

/**
 * 2. Quick Dispatch Form Handling
 * Stores ticket in local CRM (localStorage) and redirects to WhatsApp with complete payload
 */
function initDispatchForm() {
  const form = document.getElementById('quickDispatchForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('dispatchName')?.value.trim() || 'İsimsiz Sürücü';
    const phone = document.getElementById('dispatchPhone')?.value.trim() || '';
    const vehicle = document.getElementById('dispatchVehicle')?.value.trim() || 'Belirtilmedi';
    const vehicleType = document.getElementById('dispatchVehicleType')?.value || 'Benzinli / Dizel';
    const issue = document.getElementById('dispatchIssue')?.value || 'Akü Bitti';
    const location = document.getElementById('dispatchLocation')?.value.trim() || 'Adana Merkez';
    const notes = document.getElementById('dispatchNotes')?.value.trim() || 'Acil yardım talebi.';

    if (!phone) {
      alertSafe('Lütfen size ulaşabileceğimiz telefon numaranızı giriniz.');
      return;
    }

    // Generate unique Ticket ID
    const ticketId = 'ADANA-' + Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date().toLocaleString('tr-TR');

    const newTicket = {
      id: ticketId,
      name,
      phone,
      vehicle,
      vehicleType,
      issue,
      location,
      notes,
      date: dateStr,
      status: 'Yeni Talep',
      cost: 'Belirlenmedi',
      paymentMethod: 'Beklemede'
    };

    // Save to local storage for Admin Panel
    saveTicketToStorage(newTicket);

    // Build structured WhatsApp message
    const waText =
`🚨 *YENİ ACİL YOL YARDIM TALEBİ* 🚨
---------------------------------
*Takip Kodu:* ${ticketId}
*Ad Soyad:* ${name}
*Telefon:* ${phone}
*Araç:* ${vehicle} (${vehicleType})
*Bildirilen Sorun:* ${issue}
*Bulunduğu Konum:* ${location}
*Açıklama:* ${notes}
---------------------------------
_Adana 7/24 Akü Takviye ve Mobil Şarj ekibi için sistemden iletilmiştir._`;

    const encodedMsg = encodeURIComponent(waText);
    const whatsappUrl = `https://wa.me/${WHATSAPP_RAW_PHONE}?text=${encodedMsg}`;

    // Show Confirmation Modal
    showConfirmationModal(ticketId, name, whatsappUrl);
  });
}

function saveTicketToStorage(ticket) {
  try {
    const existing = JSON.parse(localStorage.getItem('adana_tickets') || '[]');
    existing.unshift(ticket);
    localStorage.setItem('adana_tickets', JSON.stringify(existing));
  } catch {
    // Ignore storage quota errors safely
  }
}

function showConfirmationModal(ticketId, name, whatsappUrl) {
  const modal = document.getElementById('confirmationModal');
  const ticketRefSpan = document.getElementById('modalTicketRef');
  const confirmWaBtn = document.getElementById('btnModalWhatsApp');

  if (ticketRefSpan) ticketRefSpan.textContent = ticketId;
  if (confirmWaBtn) {
    confirmWaBtn.href = whatsappUrl;
    confirmWaBtn.onclick = () => {
      if (modal) modal.classList.remove('active');
    };
  }

  if (modal) {
    modal.classList.add('active');
  } else {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}

// Close confirmation modal
window.closeConfirmModal = function() {
  const modal = document.getElementById('confirmationModal');
  if (modal) modal.classList.remove('active');
};

/**
 * 3. EV Diagnostic & 12V Auxiliary Support Logic
 */
const EV_DIAG_DATA = {
  'dead-12v': {
    badge: 'Yerinde 12V Takviye Çözümü',
    icon: '🔋',
    title: '12V Yardımcı Destek Aküsü Boşalmış',
    explanation: 'Elektrikli araçlarda ana batarya dolu olsa dahi 12V akü boşaldığında kapılar açılmaz, ekranlar kararır ve kontaktörler kilitlenir. Ekiplerimiz regülasyonlu cihazla sistemi yerinde uyandırır.',
    action: '12V Sistem Uyandırma',
    note: '* Ters kutup ve hassas BMS beyin korumalı mikroişlemcili cihazla takviye yapılır.',
    btnText: 'WhatsApp ile 12V Uyandırma İste ➔',
    waMsg: (car) => `Merhaba, ${car} aracımda 12V yardımcı akü boşaldı (kapılar/ekranlar açılmıyor). Adana'da yerinde 12V uyandırma takviyesi talep ediyorum.`
  },
  'empty-hv': {
    badge: 'Özel Platform Çekici Hizmeti',
    icon: '🛞',
    title: 'Ana Çekiş Bataryası (%0) Tükenmiş',
    explanation: 'Yüksek voltaj ana bataryası tamamen bitmiş araçların yürütülmesi motorlara zarar verir. Aracınızı Adana içindeki en yakın hızlı DC şarj istasyonuna güvenle ulaştıracak tekerlek aparatlı platform çekici yönlendiriyoruz.',
    action: 'DC İstasyona Transfer',
    note: '* Trugo, ZES, Astor ve E-Şarj istasyonlarına hızlı ve güvenli nakil sağlanır.',
    btnText: 'DC İstasyonuna Çekici İste ➔',
    waMsg: (car) => `Merhaba, ${car} aracımın ana çekiş bataryası %0 seviyesine indi ve araç hareket etmiyor. En yakın DC istasyona güvenli çekici desteği talep ediyorum.`
  },
  'locked-cable': {
    badge: 'Mekanik & Elektriksel Destek',
    icon: '🔌',
    title: 'Şarj Kablosu / Kapağı Kilitli Kaldı',
    explanation: 'İstasyonda veya prizde kablonun kilitli kalması genellikle 12V solenoid kilitlemesinden kaynaklanır. Ekiplerimiz yerinde 12V akım desteği ve acil manuel kilit açma mandalı yönlendirmesi sağlar.',
    action: 'Kilit Açma Desteği',
    note: '* Araç soketine veya istasyon girişine zarar verilmeden güvenle ayrıştırılır.',
    btnText: 'Kablo Kilit Çözümü İçin Ulaşın ➔',
    waMsg: (car) => `Merhaba, ${car} aracımda şarj kablosu sokette kilitli kaldı ve ayrılmıyor. Acil yerinde destek talep ediyorum.`
  }
};

function initEvDiagnostic() {
  const modelSelect = document.getElementById('diagEvModel');
  const issueSelect = document.getElementById('diagIssueType');
  const badgeEl = document.getElementById('diagBadge');
  const iconEl = document.getElementById('diagIcon');
  const titleEl = document.getElementById('diagTitle');
  const expEl = document.getElementById('diagExplanation');
  const actionEl = document.getElementById('diagAction');
  const noteEl = document.getElementById('diagNote');
  const btnEl = document.getElementById('btnRequestEvSupport');

  if (!modelSelect || !issueSelect) return;

  function updateDiagnostic() {
    const issueKey = issueSelect.value || 'dead-12v';
    const carName = modelSelect.value || 'Elektrikli Araç';
    const data = EV_DIAG_DATA[issueKey] || EV_DIAG_DATA['dead-12v'];

    if (badgeEl) badgeEl.textContent = data.badge;
    if (iconEl) iconEl.textContent = data.icon;
    if (titleEl) titleEl.textContent = data.title;
    if (expEl) expEl.textContent = data.explanation;
    if (actionEl) actionEl.textContent = data.action;
    if (noteEl) noteEl.textContent = data.note;

    if (btnEl) {
      btnEl.textContent = data.btnText;
      const msg = data.waMsg(carName);
      btnEl.href = `https://wa.me/${WHATSAPP_RAW_PHONE}?text=${encodeURIComponent(msg)}`;
    }
  }

  modelSelect.addEventListener('change', updateDiagnostic);
  issueSelect.addEventListener('change', updateDiagnostic);

  updateDiagnostic();
}

/**
 * 3.1. Interactive Adana District & ETA Live Radar
 */
const DISTRICT_RADAR_DATA = {
  'seyhan': {
    name: 'Seyhan (Adana Merkez)',
    eta: '15 - 20 Dk',
    patrol: 'Barajyolu, Ziyapaşa ve Gazipaşa Bulvarları Nöbetçi Devriye Ekibi',
    neighborhoods: ['Barajyolu', 'Ziyapaşa', 'Gazipaşa', 'Reşatbey', 'Gürselpaşa', 'Tellidere', 'Yeşilyurt', 'Sümer', 'Fevzipaşa', 'Şakirpaşa', 'Cemalpaşa', 'Kurtuluş', 'Mithatpaşa', '2000 Evler', 'Adana Otogarı'],
    equipment: '12V/24V Mikroişlemcili Akü Booster, DC Mobil Hızlı Şarj Ünitesi, 60-72Ah Varta/İnci Akü Stoğu',
    link: '/seyhan-aku-takviye'
  },
  'cukurova': {
    name: 'Çukurova (Kuzey Merkez)',
    eta: '15 - 20 Dk',
    patrol: 'Turgut Özal Bulvarı & Kenan Evren Bulvarı Kavşağı Nöbetçi Ekip',
    neighborhoods: ['Turgut Özal Bulvarı', 'Kenan Evren', 'Süleyman Demirel', 'Güzelyalı', 'Beyazevler', 'Mahfesığmaz', 'Huzurevleri', 'Toros', '100. Yıl', 'Kurttepe', 'Karslılar', 'Belediye Evleri'],
    equipment: 'Start-Stop AGM/EFB Akü Kodlama Cihazı, ECU Koruma Ünitesi, Togg/Tesla CCS2 Şarj Transferi',
    link: '/cukurova-aku-takviye'
  },
  'yuregir': {
    name: 'Yüreğir (Doğu Merkez)',
    eta: '15 - 25 Dk',
    patrol: 'D400 Karayolu, Optimum AVM & Adana Şehir Hastanesi Nöbetçi İstasyonu',
    neighborhoods: ['Optimum Çevresi', 'Adana Şehir Hastanesi', 'Kışla', 'Yavuzlar', 'Akıncılar', 'Atakent', 'Serinevler', 'Doğankent', 'Karataş Yolu', 'D400 Aksı'],
    equipment: 'Ağır Vasıta 24V Çift Akü Desteği, Binek Akü Değişimi, Alternatör Şarj Ölçümü',
    link: '/yuregir-aku-takviye'
  },
  'saricam': {
    name: 'Sarıçam & Çukurova Ünv.',
    eta: '15 - 25 Dk',
    patrol: 'Çukurova Üniversitesi Balcalı Hastanesi & Gültepe Devriyesi',
    neighborhoods: ['Çukurova Üniversitesi', 'Balcalı Hastanesi', 'Gültepe', 'Çarkıpare', 'Yeşiltepe', 'Kozan Yolu', 'Yeni Adana Stadyumu', 'Buruk', 'Sofulu'],
    equipment: 'Mobil Akü Takviyesi, Yerinde Sıfır Akü Satışı ve Garantili Montaj, EV Acil Mobil Enerji',
    link: '/saricam-aku-takviye'
  },
  'aosb': {
    name: 'Adana Hacı Sabancı OSB (AOSB)',
    eta: '20 - 25 Dk',
    patrol: 'Adana Organize Sanayi Bölgesi Girişi Ağır Vasıta ve EV Mobil Üssü',
    neighborhoods: ['AOSB Tüm Fabrikalar ve Bulvarlar', 'Lojistik Ambarları', 'TIR Garajı', 'Yakapınar', 'TAG Otoyolu OSB Bağlantısı'],
    equipment: '24V Yüksek Amperli Endüstriyel Takviye (TIR, Kamyon, İş Makinesi), Kurumsal Faturalı Hizmet',
    link: '/adana-osb-elektrikli-arac-mobil-sarj'
  },
  'ceyhan': {
    name: 'Ceyhan & Otoyol Aksı',
    eta: '30 - 40 Dk',
    patrol: 'Ceyhan D400 Girişi ve TAG Otoyol Mobil Destek Ekibi',
    neighborhoods: ['Ceyhan Merkez', 'Sanayi Bölgesi', 'Yumurtalık Kavşağı', 'BOTAŞ Yolu', 'Mustafabeyli'],
    equipment: 'Otoyol Hızlı Müdahale Donanımı, Uzun Yol 12V/24V Akü Desteği, EV Acil Şarj',
    link: '/ceyhan-aku-takviye'
  },
  'pozanti': {
    name: 'Pozantı & Akçatekir Yaylası',
    eta: 'Otoyol Hazır Ekip',
    patrol: 'Pozantı Otoyol Gişeleri ve Tekir Yayla Rampaları Devriyesi',
    neighborhoods: ['Pozantı Merkez', 'Akçatekir Rampaları', 'Gülek Boğazı', 'Şekerpınarı Dinlenme Tesisleri'],
    equipment: 'Rampa & Eğim Yol Destek Kiti, 24V ve 12V Akü Booster, Acil Çekici Koordinasyonu',
    link: '/pozanti-aku-takviye'
  }
};

function initDistrictRadar() {
  const tabBtns = document.querySelectorAll('.radar-tab-btn');
  const districtTitle = document.getElementById('radarDistrictTitle');
  const districtEta = document.getElementById('radarDistrictEta');
  const districtPatrol = document.getElementById('radarDistrictPatrol');
  const districtNhoods = document.getElementById('radarDistrictNhoods');
  const districtEquip = document.getElementById('radarDistrictEquip');
  const districtLink = document.getElementById('radarDistrictLink');
  const districtWaBtn = document.getElementById('radarBtnWhatsApp');
  const districtCallBtn = document.getElementById('radarBtnCall');

  if (!tabBtns.length || !districtTitle) return;

  function updateDistrict(key) {
    const data = DISTRICT_RADAR_DATA[key] || DISTRICT_RADAR_DATA['seyhan'];

    // Update active tab styling & ARIA
    tabBtns.forEach(btn => {
      const isSelected = btn.dataset.district === key;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    // Update DOM safely without innerHTML
    districtTitle.textContent = `📍 ${data.name}`;
    if (districtEta) {
      districtEta.replaceChildren();
      districtEta.appendChild(document.createTextNode('⚡ Ortalama Varış: '));
      const strong = document.createElement('strong');
      strong.textContent = data.eta;
      districtEta.appendChild(strong);
    }
    if (districtPatrol) districtPatrol.textContent = data.patrol;
    if (districtEquip) districtEquip.textContent = data.equipment;
    if (districtLink) {
      districtLink.href = data.link;
      districtLink.textContent = `${data.name} Özel Rehberi & Mahalle Detayları →`;
    }

    // Neighborhood tags built safely with createElement
    if (districtNhoods) {
      districtNhoods.replaceChildren();
      const frag = document.createDocumentFragment();
      data.neighborhoods.forEach(n => {
        const span = document.createElement('span');
        span.className = 'radar-nhood-tag';
        span.textContent = n;
        frag.appendChild(span);
      });
      districtNhoods.appendChild(frag);
    }

    // Update 1-click CTA buttons
    const customWaMsg = `Merhaba, ${data.name} bölgesindeyim. Acil akü takviyesi / mobil destek talep ediyorum. Konumumu göndereceğim.`;
    if (districtWaBtn) {
      districtWaBtn.href = `https://wa.me/${WHATSAPP_RAW_PHONE}?text=${encodeURIComponent(customWaMsg)}`;
    }
    if (districtCallBtn) {
      districtCallBtn.href = `tel:${CONTACT_PHONE.replace(/\s/g, '')}`;
    }
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.district;
      if (key) updateDistrict(key);
    });
  });

  // Default initialize with Seyhan
  updateDistrict('seyhan');
}

/**
 * 3.2. Quick Service Filter Chips
 */
function initServiceChips() {
  const chips = document.querySelectorAll('.chip-item');
  const issueSelect = document.getElementById('dispatchIssue');

  if (!chips.length) return;

  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      const targetIssue = chip.dataset.issue;
      const targetAnchor = chip.getAttribute('href');

      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (issueSelect && targetIssue) {
        issueSelect.value = targetIssue;
      }

      if (targetAnchor && targetAnchor.startsWith('#')) {
        const el = document.querySelector(targetAnchor);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
}

/**
 * 4. FAQ Accordion (Accessible with Keyboard Support)
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.setAttribute('role', 'button');
    question.setAttribute('tabindex', '0');
    question.setAttribute('aria-expanded', item.classList.contains('active') ? 'true' : 'false');

    const toggleItem = () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach((other) => {
        other.classList.remove('active');
        const q = other.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });
      if (!isActive) {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
      }
    };

    question.addEventListener('click', toggleItem);
    question.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleItem();
      }
    });
  });
}

/**
 * 5. Mobile Navigation Menu
 */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileNavToggle');
  const navLinks = document.getElementById('navLinks') || document.querySelector('.nav-links');

  if (!toggleBtn || !navLinks) return;

  toggleBtn.setAttribute('aria-expanded', 'false');

  toggleBtn.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });

  // Close mobile menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/**
 * 6. PWA Install Banner & Service Worker Registration
 */
function initPwaPrompt() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

  let deferredPrompt = null;
  const pwaBtn = document.getElementById('btnInstallPwa');

  if (pwaBtn) {
    pwaBtn.addEventListener('click', () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        deferredPrompt = null;
        pwaBtn.style.display = 'none';
      });
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (pwaBtn) {
      pwaBtn.style.display = 'inline-flex';
    }
  });
}

/**
 * Helper: Secure alert replacement
 */
function alertSafe(message) {
  const banner = document.createElement('div');
  banner.setAttribute('role', 'alert');
  banner.style.position = 'fixed';
  banner.style.top = '20px';
  banner.style.left = '50%';
  banner.style.transform = 'translateX(-50%)';
  banner.style.background = '#ef4444';
  banner.style.color = '#ffffff';
  banner.style.padding = '12px 24px';
  banner.style.borderRadius = '8px';
  banner.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
  banner.style.zIndex = '9999';
  banner.style.fontWeight = '600';
  banner.style.fontSize = '0.92rem';
  banner.textContent = message;

  document.body.appendChild(banner);
  setTimeout(() => {
    banner.remove();
  }, 4000);
}
