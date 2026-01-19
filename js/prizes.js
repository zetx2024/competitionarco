fetch('https://iarco.org/data/prizes.json')
  .then(response => response.json())
  .then(data => {
    prizesData = data;

    const yearSelect = document.getElementById('yearSelect');
    const years = Object.keys(prizesData).sort((a, b) => b - a);

    // Populate dropdown ONLY ONCE
    years.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });

    // Default: latest year (ONCE)
    const defaultYear = years[0];
    yearSelect.value = defaultYear;
    renderYear(defaultYear);
    initialized = true;

    // Change handler
    yearSelect.addEventListener('change', function () {
      renderYear(this.value);
    });
  });

function renderYear(year) {
  const prize = prizesData[year];
  if (!prize) return;

  // Hero
  document.getElementById('heroTitle').innerHTML =
    `<i class="fas fa-trophy trophy-icon"></i> ${prize.heroTitle}`;
  document.getElementById('heroDesc').textContent = prize.heroDescription;

  // Notes
  document.getElementById('juniorNote').innerHTML =
    `<p><i class="fas fa-info-circle"></i> ${prize.note}</p>`;
  document.getElementById('seniorNote').innerHTML =
    `<p><i class="fas fa-info-circle"></i> ${prize.note}</p>`;

  // Cards
  buildCards('juniorCards', prize.junior);
  buildCards('seniorCards', prize.senior);
}

function buildCards(containerId, cards) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  cards.forEach((card, index) => {
    const col = document.createElement('div');
    col.className = 'col-md-3 mb-4';

    col.innerHTML = `
      <div class="prize-card slide-up" style="animation-delay:${0.1 * (index + 1)}s;">
        <span class="badge">${card.badge}</span>
        <h3>${card.title}</h3>
        <div class="prize-amount">
          <i class="${card.icon}"></i> ${card.amount}
        </div>
        <ul>
          ${card.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `;

    container.appendChild(col);
  });
}
