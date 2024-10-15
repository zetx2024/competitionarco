// Function to create and add profile items to the page
        function createProfileItems(data) {
            const container = document.getElementById('profileContainer');

            data.students.forEach(student => {
                // Create profile item
                const profileItem = document.createElement('div');
                profileItem.className = 'profile-item';

                // Create profile image
                const profileImg = document.createElement('img');
                profileImg.src = student.image;
                profileImg.alt = student.name;
                profileImg.dataset.medal = student.medal; // Set medal type
                profileItem.appendChild(profileImg);

                // Create badge container
                const badgeContainer = document.createElement('div');
                badgeContainer.className = 'badge-container';

                // Add badge based on medal type
                const badgeItem = document.createElement('div');
                badgeItem.className = 'badge-item';
                badgeItem.innerHTML = data.medals[student.medal];
                badgeContainer.appendChild(badgeItem);
                profileItem.appendChild(badgeContainer);

                // Create profile text
                const profileText = document.createElement('div');
                profileText.className = 'profile-text';
                profileText.innerHTML = `
                    <p class="profile-name">${student.name}</p>
                    <p class="profile-institution">${student.institution}</p>
                    <p class="profile-medal">${student.medal.charAt(0).toUpperCase() + student.medal.slice(1)} Medal</p>
                    <p class="profile-program">${student.program}</p>
                    <a href="${student.profileLink}" class="view-profile-btn" target="_blank">View Article</a>
                `;
                profileItem.appendChild(profileText);

                // Add profile item to container
                container.appendChild(profileItem);

                // Trigger confetti based on medal type
                profileImg.onload = function() {
                    triggerConfetti(student.medal);
                };
            });
        }

        // Function to trigger confetti effect
        function triggerConfetti(medalType) {
            if (typeof confetti === 'function') {
                let colors = [];
                switch (medalType) {
                    case 'gold':
                        colors = ['#FFD700', '#FFDF00']; // Gold colors
                        break;
                    case 'silver':
                        colors = ['#C0C0C0', '#A9A9A9']; // Silver colors
                        break;
                    case 'bronze':
                        colors = ['#cd7f32', '#A0522D']; // Bronze colors
                        break;
                    default:
                        colors = ['#00F', '#F00']; // Default colors
                }

                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: colors
                });
            } else {
                console.error('Confetti library is not loaded.');
            }
        }

        // Fetch student and medal data, then create profile items
        fetch('../awardsdata.json')
            .then(response => response.json())
            .then(data => createProfileItems(data))
            .catch(error => console.error('Error loading data:', error));
