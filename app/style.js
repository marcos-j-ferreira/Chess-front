document.getElementById('theme-toggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    
    const icon = this.querySelector('i');
    if (document.body.classList.contains('light-mode')) {
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
    }
});

document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', function() {
        document.body.classList.remove('theme-brown', 'theme-blue', 'theme-green');
        
        const theme = this.dataset.theme;
        document.body.classList.add(`theme-${theme}`);
        
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.remove('active');
        });
        this.classList.add('active');
    });
});

document.getElementById('new-game').addEventListener('click', function() {
    alert('Nova partida iniciada!');
});