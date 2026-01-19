fetch('https://iarco.org/data/prizes.json')
  .then(res => res.json())
  .then(data => {
    const years = Object.keys(data).sort((a, b) => b - a);
    const latestYear = years[0];

    const yearSelect = document.getElementById('yearSelect');
    years.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });

    yearSelect.value = latestYear;
    renderYear(latestYear);

    yearSelect.addEventListener('change', e => {
      renderYear(e.target.value);
    });

    function renderYear(year) {
      const prize = data[year];

      document.getElementById('heroTitle').innerHTML =
        `<i class="fas fa-trophy trophy-icon"></i> ${prize.heroTitle}`;
      document.getElementById('heroDesc').textContent = prize.heroDescription;

      document.getElementById('juniorNote').innerHTML =
        `<p><i class="fas fa-info-circle"></i> ${prize.note}</p>`;
      document.getElementById('seniorNote').innerHTML =
        `<p><i class="fas fa-info-circle"></i> ${prize.note}</p>`;

      renderCards('juniorCards', prize.junior);
      renderCards('seniorCards', prize.senior);
    }

    function renderCards(containerId, cards) {
      const container = document.getElementById(containerId);
      container.innerHTML = '';

      cards.forEach((card, index) => {
        container.innerHTML += `
          <div class="col-md-3 mb-4">
            <div class="prize-card slide-up" style="animation-delay:${0.1 * (index + 1)}s;">
              <span class="badge">${card.badge}</span>
              <h3>${card.title}</h3>
              <div class="prize-amount">
                <i class="${card.icon}"></i> ${card.amount}
              </div>
              <ul>
                ${card.items.map(i => `<li>${i}</li>`).join('')}
              </ul>
            </div>
          </div>`;
      });
    }
  });
