(function () {
    const footerHTML = `
    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-content">

                <div class="footer-logo">
                    <img src="assets/logo.png" alt="IARCO Logo">
                    <h3 class="footer-title">Contact Us</h3>
                    <p>Contact us at hello@iarco.org!</p>
                    <p><a data-footer="terms" href="terms-conditions">Terms & Conditions</a></p>
                    <p><a data-footer="privacy" href="privacy-policy">Privacy Policy</a></p>
                </div>

                <div class="footer-links">
                    <h3 class="footer-title">Social Media</h3>
                    <a href="https://www.facebook.com/iarco.org"><i class="fab fa-facebook-f"></i> Facebook</a>
                    <a href="https://www.instagram.com/iarco_org"><i class="fab fa-instagram"></i> Instagram</a>
                    <a href="https://www.youtube.com/@iarco_org"><i class="fab fa-youtube"></i> YouTube</a>
                    <a href="https://www.linkedin.com/company/iarco"><i class="fab fa-linkedin-in"></i> LinkedIn</a>
                </div>

                <div class="footer-links">
                    <h3 class="footer-title">Information</h3>
                    <a data-footer="about" href="what-is-iarco"><i class="fas fa-chart-bar"></i> About Competition</a>
                    <a data-footer="backbone" href="iarco-backbone"><i class="fas fa-users"></i> IARCO Backbone</a>
                    <a data-footer="archive" href="archive"><i class="fab fa-accusoft"></i> Archive</a>
                    <a data-footer="prizes" href="prizes"><i class="fas fa-trophy"></i> Prizes</a>
                    <a data-footer="bootcamps" href="bootcamps"><i class="fas fa-dumbbell"></i> Bootcamp</a>
                    <a href="https://cert.iarco.org/"><i class="fas fa-certificate"></i> Certificate</a>
                </div>

                <div class="footer-subscribe">
                    <h3 class="footer-title">Newsletter</h3>
                    <form class="subscribe-form" id="footer-subscribe-form">
                        <input name="email" type="email" placeholder="Your Email" required>
                        <button type="submit"><i class="fas fa-paper-plane"></i></button>
                    </form>
                    <div class="subscribe-message" id="footer-subscribe-message"></div>
                </div>

            </div>

            <div class="copyright">
                &copy; 2024 - ${new Date().getFullYear()} All Rights Reserved | International Academic Research Competition
            </div>
        </div>
    </footer>
    `;

    document.addEventListener('DOMContentLoaded', () => {
        const footerContainer = document.getElementById('site-footer');
        if (footerContainer) {
            footerContainer.innerHTML = footerHTML;
        }
    });

    // Expose active link setter globally
    window.setActiveFooterLink = function (key) {
        document.addEventListener('DOMContentLoaded', () => {
            document
                .querySelectorAll('[data-footer]')
                .forEach(link => link.classList.remove('active'));

            const activeLink = document.querySelector(
                `[data-footer="${key}"]`
            );
            if (activeLink) {
                activeLink.classList.add('active');
            }
        });
    };
})();
