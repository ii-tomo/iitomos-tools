document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const appCards = document.querySelectorAll('.app-card');

    // Filter apps based on search input
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        appCards.forEach(card => {
            // Ignore the "Add New App" empty card from search filtering or always show it
            if (card.classList.contains('empty-card')) {
                return;
            }

            const title = card.getAttribute('data-title').toLowerCase();
            const heading = card.querySelector('h3').textContent.toLowerCase();
            const desc = card.querySelector('p').textContent.toLowerCase();

            if (title.includes(searchTerm) || heading.includes(searchTerm) || desc.includes(searchTerm)) {
                card.style.display = 'block';
                // Add tiny animation to make it smooth
                card.style.animation = 'fadeIn 0.3s ease forwards';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // Add mouse move effect for glow tracking on cards
    appCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const hoverEffect = card.querySelector('.card-hover-effect');
            if (!hoverEffect) return;

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            hoverEffect.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)`;
        });

        card.addEventListener('mouseleave', () => {
            const hoverEffect = card.querySelector('.card-hover-effect');
            if (!hoverEffect) return;
            // Reset to center on leave
            hoverEffect.style.background = `radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)`;
        });
    });
});
