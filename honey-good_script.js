const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxvipMFYAJLJAx7zmLxnwx66T3DkgdkWelLGIhf4izoCkxZqDBcj2Ia1rqCZSlfNOY/exec';
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDdQ1E3sY1ioicqCXsCoFf7ErZ83M7ogfWKVDNmhoA879At2LQL54giQL3Pe_QIt8gxv1PzujbKGxm/pub?gid=0&single=true&output=csv';

let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
  const productListEl = document.getElementById('product-list');
  if (productListEl) {
    initProductPage();
  }

  const orderFormEl = document.getElementById('orderForm');
  const itemsInputEl = document.getElementById('items');
  const totalInputEl = document.getElementById('total');
  if (orderFormEl || itemsInputEl || totalInputEl) {
    initOrderPage();
  }

  const ordersTableBodyEl = document.querySelector('#ordersTable tbody');
  if (ordersTableBodyEl) {
    initAdminPage(ordersTableBodyEl);
  }
});

async function initProductPage() {
  const productListEl = document.getElementById('product-list');
  const filterBarEl = document.getElementById('filter-bar');

  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error('ไม่สามารถโหลดไฟล์ products.json ได้');
    allProducts = await response.json();

    const urlParams = new URLSearchParams(window.location.search);
    const initialMood = (urlParams.get('mood') || 'all').toLowerCase();

    renderFilterButtons(filterBarEl, initialMood);
    renderProducts(initialMood, productListEl);
  } catch (error) {
    console.error('Error loading products:', error);
    if (productListEl) {
      productListEl.innerHTML = '<p style="text-align:center; width:100%;">ไม่สามารถโหลดข้อมูลสินค้าได้ในขณะนี้</p>';
    }
  }
}

function renderFilterButtons(filterBarEl, activeMood) {
  if (!filterBarEl) return;

  const moods = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'fresh', label: 'Fresh' },
    { key: 'sweet', label: 'Sweet' },
    { key: 'confident', label: 'Confident' },
    { key: 'romance', label: 'Romance' }
  ];

  if (filterBarEl.children.length === 0) {
    filterBarEl.innerHTML = moods.map(m => `
      <button type="button" class="btn btn-sm ${m.key === activeMood ? 'active' : ''}" data-mood="${m.key}">
        ${m.label}
      </button>
    `).join('');
  }

  const buttons = filterBarEl.querySelectorAll('[data-mood]');
  buttons.forEach(btn => {
    const btnMood = btn.getAttribute('data-mood').toLowerCase();
    if (btnMood === activeMood) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const productListEl = document.getElementById('product-list');
      renderProducts(btnMood, productListEl);
    });
  });
}

function renderProducts(mood, container) {
  if (!container) return;

  const filtered = (mood === 'all' || !mood)
    ? allProducts
    : allProducts.filter(p => p.mood && p.mood.toLowerCase() === mood);

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; width:100%;">ไม่พบสินค้าในหมวดหมู่นี้</p>';
    return;
  }

  container.innerHTML = filtered.map(product => {
    const moodClass = product.mood ? `mood-${product.mood.toLowerCase()}` : '';
    const moodLabel = product.mood ? product.mood.toUpperCase() : '';
    const orderUrl = `order.html?item=${encodeURIComponent(product.name)}&price=${encodeURIComponent(product.price)}`;

    return `
      <div class="product-card ${moodClass}">
        <div class="product-image-wrap">
          <img src="${product.image}" alt="${product.name}">
        </div>
        ${moodLabel ? `
          <div class="mood-tag">
            <span class="mood-dot"></span>
            <span>${moodLabel}</span>
          </div>
        ` : ''}
        <h3>${product.name}</h3>
        <div class="mood-underline"></div>
        <p>${product.description || ''}</p>
        <div class="product-meta">
          <span class="product-size">${product.size}</span>
          <span class="product-price">${Number(product.price).toLocaleString()} บาท</span>
        </div>
        <div style="margin-top: 1.5rem;">
          <a href="${orderUrl}" class="btn btn-gold" style="width: 100%; text-align: center;">สั่งซื้อ</a>
        </div>
      </div>
    `;
  }).join('');
}

function initOrderPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemParam = urlParams.get('item');
  const priceParam = urlParams.get('price');

  const itemsInput = document.getElementById('items');
  const totalInput = document.getElementById('total');

  if (itemsInput && itemParam !== null) {
    itemsInput.value = itemParam;
  }
  if (totalInput && priceParam !== null) {
    totalInput.value = priceParam;
  }

  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = orderForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'กำลังบันทึกคำสั่งซื้อ...';
      }

      const payload = {
        customerName: document.getElementById('customerName')?.value || '',
        contact: document.getElementById('contact')?.value || '',
        items: document.getElementById('items')?.value || '',
        total: document.getElementById('total')?.value || '',
        note: document.getElementById('note')?.value || ''
      };

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      .then(() => {
        window.location.href = 'thankyou.html';
      })
      .catch(error => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'ยืนยันสั่งซื้อ';
        }
      });
    });
  }
}

async function initAdminPage(tbodyEl) {
  tbodyEl.innerHTML = '<tr><td colspan="6" style="text-align:center;">กำลังโหลดข้อมูลคำสั่งซื้อ...</td></tr>';

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูล CSV ได้');
    const csvText = await response.text();

    const rows = parseCSV(csvText);
    if (rows.length <= 1) {
      tbodyEl.innerHTML = '<tr><td colspan="6" style="text-align:center;">ยังไม่มีรายการสั่งซื้อ</td></tr>';
      return;
    }

    const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim() !== '')).reverse();

    tbodyEl.innerHTML = dataRows.map(cols => {
      const timestamp = escapeHTML(cols[0] || '-');
      const customerName = escapeHTML(cols[1] || '-');
      const contact = escapeHTML(cols[2] || '-');
      const items = escapeHTML(cols[3] || '-');
      const total = cols[4] ? `${Number(cols[4]).toLocaleString()} บาท` : '-';
      const note = escapeHTML(cols[5] || '-');

      return `
        <tr>
          <td>${timestamp}</td>
          <td>${customerName}</td>
          <td>${contact}</td>
          <td>${items}</td>
          <td>${total}</td>
          <td>${note}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading admin CSV:', error);
    tbodyEl.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#C87D7D;">เกิดข้อผิดพลาดในการโหลดข้อมูลจาก Google Sheet</td></tr>';
  }
}

function parseCSV(text) {
  const result = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      if (char === '\r') i++;
      row.push(current.trim());
      result.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    result.push(row);
  }

  return result;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
