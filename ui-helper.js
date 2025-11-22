// UI Helper Functions
// Функции для управления UI элементами

function showError(message) {
    const container = document.getElementById('error-message');
    if (container) {
        container.textContent = message;
        container.style.display = 'block';
        setTimeout(() => {
            container.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(message) {
    const container = document.getElementById('success-message');
    if (container) {
        container.textContent = message;
        container.style.display = 'block';
        setTimeout(() => {
            container.style.display = 'none';
        }, 3000);
    }
}

function setLoading(buttonElement, isLoading) {
    if (isLoading) {
        // Сохранить оригинальный текст если еще не сохранен
        if (!buttonElement.dataset.originalText) {
            buttonElement.dataset.originalText = buttonElement.innerHTML;
        }
        buttonElement.disabled = true;
        buttonElement.innerHTML = `<span class="inline-block animate-spin mr-2">⏳</span>Загрузка...`;
    } else {
        buttonElement.disabled = false;
        buttonElement.innerHTML = buttonElement.dataset.originalText || 'Отправить';
    }
}

function updateNavigation(user) {
    const loginBtn = document.querySelector('a[href="login.html"]');
    if (loginBtn) {
        if (user) {
            loginBtn.innerHTML = `
                <div class="flex items-center space-x-2">
                    <span>${user.displayName || user.email.split('@')[0]}</span>
                    <button id="logout-btn" class="px-3 py-1 bg-red-600 rounded hover:bg-red-700 transition text-sm">
                        Выход
                    </button>
                </div>
            `;
            
            document.getElementById('logout-btn').addEventListener('click', async (e) => {
                e.preventDefault();
                const { logoutUser } = await import('./auth.js');
                const result = await logoutUser();
                if (result.success) {
                    window.location.href = 'index.html';
                }
            });
        } else {
            loginBtn.innerHTML = 'Вход';
            loginBtn.href = 'login.html';
        }
    }
}

export { showError, showSuccess, setLoading, updateNavigation };
