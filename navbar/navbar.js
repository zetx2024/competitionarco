(async function () {
    const root = document.getElementById("navbar-root");
    if (!root) return;

    const res = await fetch("/assets/data/navbar.json");
    const data = await res.json();

    const buildDropdown = (item) => `
        <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" role="button"
               data-bs-toggle="dropdown" aria-expanded="false">
               <i class="${item.icon}"></i> ${item.label}
            </a>
            <ul class="dropdown-menu">
                ${item.items.map(sub => `
                    <li>
                        <a class="dropdown-item" href="${sub.href}">
                            ${sub.icon ? `<i class="${sub.icon}"></i>` : ""} ${sub.label}
                        </a>
                    </li>
                `).join("")}
            </ul>
        </li>
    `;

    const buildLink = (item) => `
        <li class="nav-item">
            <a class="nav-link" href="${item.href}">
                <i class="${item.icon}"></i> ${item.label}
            </a>
        </li>
    `;

    root.innerHTML = `
        <nav class="navbar sticky-top navbar-expand-lg navbar-light">
            <div class="container">
                <a class="navbar-brand text-uppercase" href="${data.brand.href}">
                    <img src="${data.brand.logo}"
                         width="${data.brand.width}"
                         height="${data.brand.height}">
                </a>

                <button class="navbar-toggler" type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul class="navbar-nav ms-auto">
                        ${data.menu.map(item =>
                            item.type === "dropdown"
                                ? buildDropdown(item)
                                : buildLink(item)
                        ).join("")}
                    </ul>
                </div>
            </div>
        </nav>
    `;

    // Active link handling
    const current = window.location.pathname.replace("/", "").replace(".html", "");

    document.querySelectorAll(".navbar a[href]").forEach(link => {
        const href = link.getAttribute("href");
        if (href === current || (current === "" && href === "/")) {
            link.classList.add("active");

            const dropdown = link.closest(".dropdown");
            if (dropdown) {
                dropdown.querySelector(".nav-link").classList.add("active");
            }
        }
    });
})();
