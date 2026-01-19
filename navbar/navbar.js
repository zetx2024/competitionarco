

(async function () {
    const root = document.getElementById("navbar-root");
    if (!root) return;

    // Fetch JSON menu
    const res = await fetch("https://iarco.org/navbar/navbar.json");
    const data = await res.json();

    // Build dropdown menu HTML
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

    // Build single link HTML
    const buildLink = (item) => `
        <li class="nav-item">
            <a class="nav-link" href="${item.href}">
                <i class="${item.icon}"></i> ${item.label}
            </a>
        </li>
    `;

    // Inject navbar HTML
    root.innerHTML = `
        <nav class="navbar fixed-top navbar-expand-lg navbar-light bg-light shadow-sm">
            <div class="container">
                <a class="navbar-brand text-uppercase" href="${data.brand.href}">
                    <img src="${data.brand.logo}"
                         width="${data.brand.width}"
                         height="${data.brand.height}">
                </a>

                <button class="navbar-toggler" type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent"
                        aria-expanded="false"
                        aria-label="Toggle navigation">
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

    // Add body padding equal to navbar height to prevent overlap
    const navbar = document.querySelector(".navbar");
    const navbarHeight = navbar.offsetHeight;
    document.body.style.paddingTop = navbarHeight + "px";

    // Handle active links based on current page URL
    const current = window.location.pathname.replace("/", "").replace(".html", "");

    document.querySelectorAll(".navbar a[href]").forEach(link => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;

        if (href === current || (current === "" && href === "/")) {
            link.classList.add("active");

            const dropdown = link.closest(".dropdown");
            if (dropdown) {
                dropdown.querySelector(".nav-link").classList.add("active");
            }
        }
    });
})();
