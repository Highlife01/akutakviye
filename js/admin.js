/**
 * TakviyeJet | Adana 7/24 Akü Takviye & Mobil Şarj
 * Admin CRM & Fleet Management Engine
 * Domain: www.takviyejet.com.tr
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboard();
});

function createAdminSvg(svgMarkup) {
  const doc = new DOMParser().parseFromString(svgMarkup.trim(), 'image/svg+xml');
  return doc.documentElement;
}

function showAdminToast(message, isError = false) {
  const banner = document.createElement('div');
  banner.setAttribute('role', 'status');
  banner.style.position = 'fixed';
  banner.style.top = '20px';
  banner.style.left = '50%';
  banner.style.transform = 'translateX(-50%)';
  banner.style.background = isError ? '#ef4444' : '#0284c7';
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
  }, 3500);
}

// Initial Seed Data if empty
const SEED_TICKETS = [
  {
    id: 'ADANA-849201',
    name: 'Mehmet Ali Yılmaz',
    phone: '0533 456 78 90',
    vehicle: 'Togg T10X (Elektrikli)',
    vehicleType: 'Elektrikli',
    issue: 'Elektrikli aracın şarjı bitti (%2 kaldı)',
    location: 'Seyhan, Barajyolu 6. Durak Kavşağı',
    notes: 'Kavşakta sağ şeritte kaldım, acil istasyona yetecek takviye rica ederim.',
    date: '07.09.2026 07:45',
    status: 'Yeni Talep',
    cost: '1.450 ₺',
    paymentMethod: 'Kredi Kartı',
    assignedStaff: 'Mobil Ekip 1 (Hasan Usta)'
  },
  {
    id: 'ADANA-849188',
    name: 'Selin Karaca',
    phone: '0542 321 44 55',
    vehicle: 'Volkswagen Golf 1.5 eTSI (Start-Stop)',
    vehicleType: 'Benzinli / Dizel',
    issue: 'Akü bitti / Marş basmıyor',
    location: 'Çukurova, Turgut Özal Bulvarı Carrefour Yanı',
    notes: 'Start-stop akü takviyesi ve gerekirse yerinde akü değişimi.',
    date: '07.09.2026 06:15',
    status: 'Ekip Yola Çıktı',
    cost: '850 ₺',
    paymentMethod: 'Nakit',
    assignedStaff: 'Mobil Ekip 2 (Murat Teknisyen)'
  },
  {
    id: 'ADANA-849140',
    name: 'Ahmet Demir (Özdemir Lojistik)',
    phone: '0505 889 11 22',
    vehicle: 'Ford Cargo 1842T (Çekici TIR)',
    vehicleType: 'Ticari Araç (24V)',
    issue: '24V Akü Takviyesi Gerekli',
    location: 'Sarıçam, Adana Organize Sanayi Bölgesi (AOSB) 4. Cadde',
    notes: 'Sabah sevkiyat için çift 24V akü takviyesi istendi.',
    date: '07.09.2026 05:20',
    status: 'İşlem Tamamlandı',
    cost: '2.200 ₺',
    paymentMethod: 'Havale / EFT',
    assignedStaff: 'Ağır Ticari Ekibi (Kemal Usta)'
  },
  {
    id: 'ADANA-849092',
    name: 'Burak Keskin',
    phone: '0535 777 99 00',
    vehicle: 'Tesla Model Y',
    vehicleType: 'Elektrikli',
    issue: '12V Destek Aküsü Arızası (Ekran açılmıyor)',
    location: 'Yüreğir, D400 Karayolu Optimum AVM Yakını',
    notes: 'Kapı kilitleri açılmadı, 12V acil jump-start desteği verildi.',
    date: '06.09.2026 23:40',
    status: 'İşlem Tamamlandı',
    cost: '1.100 ₺',
    paymentMethod: 'Kredi Kartı',
    assignedStaff: 'Mobil Ekip 1 (Hasan Usta)'
  }
];

let allTickets = [];

function initAdminDashboard() {
  loadTickets();
  setupFilterHandlers();
  setupNewTicketModal();
  renderInventory();
}

function loadTickets() {
  const saved = localStorage.getItem('adana_tickets');
  if (saved) {
    try {
      allTickets = JSON.parse(saved);
    } catch {
      allTickets = SEED_TICKETS;
    }
  } else {
    allTickets = SEED_TICKETS;
    localStorage.setItem('adana_tickets', JSON.stringify(allTickets));
  }
  renderDashboard();
}

function renderDashboard(filterStatus = 'all', searchQuery = '') {
  renderStats();
  renderTicketsTable(filterStatus, searchQuery);
}

function renderStats() {
  const totalCount = allTickets.length;
  const newCount = allTickets.filter(t => t.status === 'Yeni Talep').length;
  const onWayCount = allTickets.filter(t => t.status === 'Ekip Yola Çıktı' || t.status === 'Müşteriye Ulaşıldı').length;
  const completedCount = allTickets.filter(t => t.status === 'İşlem Tamamlandı').length;

  let totalRevenue = 0;
  allTickets.forEach(t => {
    if (t.status === 'İşlem Tamamlandı' && t.cost) {
      const num = parseInt(t.cost.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num)) totalRevenue += num;
    }
  });

  const elTotal = document.getElementById('statTotal');
  const elNew = document.getElementById('statNew');
  const elOnWay = document.getElementById('statOnWay');
  const elCompleted = document.getElementById('statCompleted');
  const elRevenue = document.getElementById('statRevenue');

  if (elTotal) elTotal.textContent = totalCount;
  if (elNew) elNew.textContent = newCount;
  if (elOnWay) elOnWay.textContent = onWayCount;
  if (elCompleted) elCompleted.textContent = completedCount;
  if (elRevenue) elRevenue.textContent = `${totalRevenue.toLocaleString('tr-TR')} ₺`;
}

function renderTicketsTable(filterStatus = 'all', searchQuery = '') {
  const tbody = document.getElementById('ticketsTableBody');
  if (!tbody) return;

  tbody.replaceChildren();

  let filtered = allTickets;
  if (filterStatus !== 'all') {
    filtered = filtered.filter(t => t.status === filterStatus);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t =>
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.phone && t.phone.toLowerCase().includes(q)) ||
      (t.vehicle && t.vehicle.toLowerCase().includes(q)) ||
      (t.location && t.location.toLowerCase().includes(q)) ||
      (t.id && t.id.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    const emptyRow = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 8;
    td.style.textAlign = 'center';
    td.style.padding = '2rem';
    td.style.color = '#94a3b8';
    td.textContent = 'Kriterlere uygun kayıtlı yardım talebi bulunamadı.';
    emptyRow.appendChild(td);
    tbody.appendChild(emptyRow);
    return;
  }

  const mapPinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>`;
  const waIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/></svg>`;
  const trashIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

  filtered.forEach(ticket => {
    const tr = document.createElement('tr');

    // 1. ID & Date
    const tdId = document.createElement('td');
    const divId = document.createElement('strong');
    divId.textContent = ticket.id;
    divId.style.display = 'block';
    divId.style.color = '#0284c7';
    const divDate = document.createElement('span');
    divDate.textContent = ticket.date;
    divDate.style.fontSize = '0.75rem';
    divDate.style.color = '#64748b';
    tdId.appendChild(divId);
    tdId.appendChild(divDate);

    // 2. Customer & Phone
    const tdCustomer = document.createElement('td');
    const divName = document.createElement('strong');
    divName.textContent = ticket.name;
    divName.style.display = 'block';
    divName.style.color = '#0f172a';
    const linkPhone = document.createElement('a');
    linkPhone.href = `tel:${ticket.phone.replace(/[^0-9]/g, '')}`;
    linkPhone.textContent = ticket.phone;
    linkPhone.style.fontSize = '0.8rem';
    linkPhone.style.color = '#15803d';
    tdCustomer.appendChild(divName);
    tdCustomer.appendChild(linkPhone);

    // 3. Vehicle & Problem
    const tdVehicle = document.createElement('td');
    const divVeh = document.createElement('strong');
    divVeh.textContent = ticket.vehicle;
    divVeh.style.display = 'block';
    const divIssue = document.createElement('span');
    divIssue.textContent = ticket.issue;
    divIssue.style.fontSize = '0.8rem';
    divIssue.style.color = '#475569';
    tdVehicle.appendChild(divVeh);
    tdVehicle.appendChild(divIssue);

    // 4. Location & Map Link
    const tdLocation = document.createElement('td');
    const spanLoc = document.createElement('span');
    spanLoc.textContent = ticket.location;
    spanLoc.style.display = 'block';
    spanLoc.style.fontSize = '0.84rem';

    const mapBtn = document.createElement('a');
    mapBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.location)}`;
    mapBtn.target = '_blank';
    mapBtn.rel = 'noopener noreferrer';
    mapBtn.className = 'btn-table-map';
    mapBtn.style.display = 'inline-flex';
    mapBtn.style.alignItems = 'center';
    mapBtn.style.gap = '4px';
    mapBtn.style.fontSize = '0.75rem';
    mapBtn.style.color = '#0284c7';
    mapBtn.style.marginTop = '4px';
    mapBtn.appendChild(createAdminSvg(mapPinSvg));
    mapBtn.appendChild(document.createTextNode(' Haritada Aç'));
    tdLocation.appendChild(spanLoc);
    tdLocation.appendChild(mapBtn);

    // 5. Assigned Staff
    const tdStaff = document.createElement('td');
    const selectStaff = document.createElement('select');
    selectStaff.className = 'form-control form-control-sm';
    selectStaff.style.fontSize = '0.78rem';
    selectStaff.style.padding = '0.3rem 0.5rem';
    const staffOptions = [
      'Atanmadı',
      'Mobil Ekip 1 (Hasan Usta - Seyhan/Çukurova)',
      'Mobil Ekip 2 (Murat Teknisyen - Yüreğir/Sarıçam)',
      'Ağır Ticari Ekibi (Kemal Usta - Ceyhan/AOSB)'
    ];
    staffOptions.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      if (ticket.assignedStaff === s) opt.selected = true;
      selectStaff.appendChild(opt);
    });
    selectStaff.addEventListener('change', (e) => {
      ticket.assignedStaff = e.target.value;
      saveAllTickets();
    });
    tdStaff.appendChild(selectStaff);

    // 6. Status Selector
    const tdStatus = document.createElement('td');
    const selectStatus = document.createElement('select');
    selectStatus.className = 'form-control form-control-sm';
    selectStatus.style.fontSize = '0.78rem';
    selectStatus.style.padding = '0.3rem 0.5rem';
    selectStatus.style.fontWeight = '700';

    const statuses = ['Yeni Talep', 'Ekip Yola Çıktı', 'Müşteriye Ulaşıldı', 'İşlem Tamamlandı', 'İptal'];
    statuses.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st;
      opt.textContent = st;
      if (ticket.status === st) opt.selected = true;
      selectStatus.appendChild(opt);
    });

    updateStatusColor(selectStatus, ticket.status);

    selectStatus.addEventListener('change', (e) => {
      ticket.status = e.target.value;
      updateStatusColor(selectStatus, ticket.status);
      saveAllTickets();
      renderStats();
    });
    tdStatus.appendChild(selectStatus);

    // 7. Payment & Cost
    const tdPayment = document.createElement('td');
    const inputCost = document.createElement('input');
    inputCost.type = 'text';
    inputCost.value = ticket.cost || '';
    inputCost.placeholder = '0 ₺';
    inputCost.className = 'form-control form-control-sm';
    inputCost.style.fontSize = '0.78rem';
    inputCost.style.padding = '0.3rem 0.5rem';
    inputCost.style.width = '80px';
    inputCost.addEventListener('change', (e) => {
      ticket.cost = e.target.value;
      saveAllTickets();
      renderStats();
    });

    const selectPay = document.createElement('select');
    selectPay.className = 'form-control form-control-sm';
    selectPay.style.fontSize = '0.75rem';
    selectPay.style.padding = '0.2rem 0.4rem';
    selectPay.style.marginTop = '4px';
    ['Nakit', 'Kredi Kartı', 'Havale / EFT', 'Beklemede'].forEach(pm => {
      const opt = document.createElement('option');
      opt.value = pm;
      opt.textContent = pm;
      if (ticket.paymentMethod === pm) opt.selected = true;
      selectPay.appendChild(opt);
    });
    selectPay.addEventListener('change', (e) => {
      ticket.paymentMethod = e.target.value;
      saveAllTickets();
    });

    tdPayment.appendChild(inputCost);
    tdPayment.appendChild(selectPay);

    // 8. Actions
    const tdActions = document.createElement('td');
    tdActions.style.whiteSpace = 'nowrap';

    const waBtn = document.createElement('a');
    waBtn.href = `https://wa.me/${ticket.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Merhaba ${ticket.name} Bey/Hanım, Adana 7/24 Akü Takviye & Mobil Şarj ekibimiz yola çıkmıştır.`)}`;
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer';
    waBtn.style.color = '#22c55e';
    waBtn.style.marginRight = '8px';
    waBtn.title = 'Müşteriye WhatsApp Mesajı Gönder';
    waBtn.appendChild(createAdminSvg(waIconSvg));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.style.background = 'transparent';
    delBtn.style.border = 'none';
    delBtn.style.color = '#ef4444';
    delBtn.style.cursor = 'pointer';
    delBtn.title = 'Talebi Sil';
    delBtn.appendChild(createAdminSvg(trashIconSvg));

    let confirmDeletePending = false;
    delBtn.addEventListener('click', () => {
      if (!confirmDeletePending) {
        confirmDeletePending = true;
        delBtn.style.color = '#fbbf24';
        showAdminToast(`"${ticket.id}" silmek için sil butonuna tekrar tıklayın.`, true);
        setTimeout(() => {
          confirmDeletePending = false;
          delBtn.style.color = '#ef4444';
        }, 3500);
        return;
      }
      allTickets = allTickets.filter(t => t.id !== ticket.id);
      saveAllTickets();
      renderDashboard();
      showAdminToast(`Talep (${ticket.id}) silindi.`);
    });

    tdActions.appendChild(waBtn);
    tdActions.appendChild(delBtn);

    tr.appendChild(tdId);
    tr.appendChild(tdCustomer);
    tr.appendChild(tdVehicle);
    tr.appendChild(tdLocation);
    tr.appendChild(tdStaff);
    tr.appendChild(tdStatus);
    tr.appendChild(tdPayment);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}

function updateStatusColor(selectEl, status) {
  if (status === 'Yeni Talep') {
    selectEl.style.color = '#0284c7';
    selectEl.style.borderColor = 'rgba(56, 189, 248, 0.4)';
  } else if (status === 'Ekip Yola Çıktı') {
    selectEl.style.color = '#d97706';
    selectEl.style.borderColor = 'rgba(245, 158, 11, 0.4)';
  } else if (status === 'Müşteriye Ulaşıldı') {
    selectEl.style.color = '#7e22ce';
    selectEl.style.borderColor = 'rgba(192, 132, 252, 0.4)';
  } else if (status === 'İşlem Tamamlandı') {
    selectEl.style.color = '#15803d';
    selectEl.style.borderColor = 'rgba(74, 222, 128, 0.4)';
  } else {
    selectEl.style.color = '#dc2626';
    selectEl.style.borderColor = 'rgba(248, 113, 113, 0.4)';
  }
}

function saveAllTickets() {
  localStorage.setItem('adana_tickets', JSON.stringify(allTickets));
}

function setupFilterHandlers() {
  const statusFilter = document.getElementById('filterStatus');
  const searchInput = document.getElementById('searchTickets');
  const exportBtn = document.getElementById('btnExportCsv');

  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      renderTicketsTable(statusFilter.value, searchInput?.value || '');
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderTicketsTable(statusFilter?.value || 'all', searchInput.value);
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', exportToCsv);
  }
}

function exportToCsv() {
  if (allTickets.length === 0) {
    showAdminToast('Dışa aktarılacak talep verisi bulunmuyor.', true);
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
  csvContent += 'Takip No,Ad Soyad,Telefon,Araç,Tür,Sorun,Konum,Tarih,Durum,Tutar,Ödeme,Personel\n';

  allTickets.forEach(t => {
    const row = [
      t.id,
      `"${(t.name || '').replace(/"/g, '""')}"`,
      `"${t.phone || ''}"`,
      `"${(t.vehicle || '').replace(/"/g, '""')}"`,
      `"${t.vehicleType || ''}"`,
      `"${(t.issue || '').replace(/"/g, '""')}"`,
      `"${(t.location || '').replace(/"/g, '""')}"`,
      `"${t.date || ''}"`,
      `"${t.status || ''}"`,
      `"${t.cost || ''}"`,
      `"${t.paymentMethod || ''}"`,
      `"${(t.assignedStaff || '').replace(/"/g, '""')}"`
    ];
    csvContent += row.join(',') + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `adana-yol-yardim-talepleri-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function setupNewTicketModal() {
  const btnOpen = document.getElementById('btnNewTicketModal');
  const modal = document.getElementById('adminNewTicketModal');
  const form = document.getElementById('adminNewTicketForm');

  if (!btnOpen || !modal || !form) return;

  btnOpen.addEventListener('click', () => {
    modal.classList.add('active');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('newTicketName').value;
    const phone = document.getElementById('newTicketPhone').value;
    const vehicle = document.getElementById('newTicketVehicle').value;
    const vehicleType = document.getElementById('newTicketVehicleType').value;
    const issue = document.getElementById('newTicketIssue').value;
    const location = document.getElementById('newTicketLocation').value;
    const cost = document.getElementById('newTicketCost').value || 'Belirlenmedi';
    const staff = document.getElementById('newTicketStaff').value;

    const ticket = {
      id: 'ADANA-' + Math.floor(100000 + Math.random() * 900000),
      name,
      phone,
      vehicle,
      vehicleType,
      issue,
      location,
      notes: 'Manuel yönetim paneli kaydı.',
      date: new Date().toLocaleString('tr-TR'),
      status: 'Yeni Talep',
      cost: cost.includes('₺') ? cost : `${cost} ₺`,
      paymentMethod: 'Beklemede',
      assignedStaff: staff
    };

    allTickets.unshift(ticket);
    saveAllTickets();
    renderDashboard();
    modal.classList.remove('active');
    form.reset();
    showAdminToast('Yeni yardım talebi başarıyla kaydedildi.');
  });
}

function renderInventory() {
  const stockContainer = document.getElementById('inventoryContainer');
  if (!stockContainer) return;

  const stockItems = [
    { name: '12V 60 Ah Standart Akü (İnci / Varta)', count: 18, status: 'Yeterli' },
    { name: '12V 72 Ah Standart Akü (Mutlu / Çelik)', count: 14, status: 'Yeterli' },
    { name: '12V 70-80 Ah Start-Stop EFB / AGM Akü', count: 9, status: 'Orta' },
    { name: '24V 135-180 Ah Ağır Ticari Akü', count: 6, status: 'Orta' },
    { name: 'Mobil EV DC Acil Şarj Ünitesi (25 kW Powerbank)', battery: '%92', status: 'Operasyona Hazır' },
    { name: '12V / 24V Profesyonel Jump-Starter Takımı', count: 4, status: 'Aktif' }
  ];

  stockContainer.replaceChildren();
  stockItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'district-card';
    card.style.background = '#f8fafc';

    const h = document.createElement('h5');
    h.textContent = item.name;
    h.style.color = '#0f172a';
    h.style.fontSize = '0.9rem';

    const p = document.createElement('p');
    p.textContent = item.battery ? `Batarya Doluluk: ${item.battery}` : `Stok Adedi: ${item.count} adet`;
    p.style.fontSize = '0.8rem';
    p.style.color = '#0284c7';

    const badge = document.createElement('span');
    badge.textContent = item.status;
    badge.className = 'status-badge status-completed';
    badge.style.marginTop = '6px';
    badge.style.width = 'fit-content';

    card.appendChild(h);
    card.appendChild(p);
    card.appendChild(badge);
    stockContainer.appendChild(card);
  });
}

window.closeAdminModal = function() {
  const modal = document.getElementById('adminNewTicketModal');
  if (modal) modal.classList.remove('active');
};
