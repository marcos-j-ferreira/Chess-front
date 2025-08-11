// Tema dark/light
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

// Temas do tabuleiro
document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', function() {
        // Remove todas as classes de tema primeiro
        document.body.classList.remove('theme-brown', 'theme-blue', 'theme-green');
        
        // Adiciona a classe do tema selecionado
        const theme = this.dataset.theme;
        document.body.classList.add(`theme-${theme}`);
        
        // Atualiza o botão ativo
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.remove('active');
        });
        this.classList.add('active');
    });
});

// Nova partida
document.getElementById('new-game').addEventListener('click', function() {
    // Aqui você implementará a lógica para reiniciar o jogo
    alert('Nova partida iniciada!');
    // Você precisará reiniciar o tabuleiro e o estado do jogo aqui
});