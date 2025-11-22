// Authentication Module
import { auth } from './firebase-init.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    setPersistence,
    browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// Установить сохранение сессии
setPersistence(auth, browserLocalPersistence).catch(err => {
    console.warn('Не удалось установить сохранение сессии:', err);
});

// Регистрация нового пользователя
async function registerUser(email, password, displayName) {
    try {
        console.log('[auth] Регистрация нового пользователя:', email);
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('[auth] ✅ Аккаунт создан в Firebase Auth');
        
        const userId = userCredential.user.uid;
        console.log('[auth] UID пользователя:', userId);
        
        // Обновить профиль пользователя с именем (с небольшой задержкой)
        if (displayName) {
            try {
                // Добавляем задержку для стабильности
                await new Promise(resolve => setTimeout(resolve, 500));
                await updateProfile(userCredential.user, {
                    displayName: displayName
                });
                console.log('[auth] ✅ Профиль обновлен в Firebase Auth');
            } catch (profileError) {
                console.warn('[auth] ⚠️ Ошибка обновления профиля:', profileError.message);
            }
        }
        
        // Сохранить профиль в Realtime Database
        try {
            console.log('[auth] Сохранение профиля в БД...');
            console.log('[auth] Попытка импорта database.js...');
            const databaseModule = await import('./database.js');
            console.log('[auth] ✅ database.js загружен, содержит:', Object.keys(databaseModule));
            const { saveUserProfile } = databaseModule;
            console.log('[auth] ✅ saveUserProfile загружена:', typeof saveUserProfile);
            
            const profileData = {
                email: email,
                displayName: displayName || 'Пользователь',
                role: 'user',
                createdAt: new Date().toISOString()
            };
            console.log('[auth] Данные для сохранения:', profileData);
            
            const result = await saveUserProfile(userId, profileData);
            console.log('[auth] ✅ Профиль сохранен в БД:', result);
        } catch (dbError) {
            console.error('[auth] ❌ КРИТИЧЕСКАЯ ОШИБКА при сохранении в БД:', dbError);
            console.error('[auth] Stack:', dbError.stack);
            console.error('[auth] Ошибка:', dbError.message);
            console.error('[auth] Код ошибки:', dbError.code);
            // Продолжаем даже если БД недоступна
        }
        
        console.log('[auth] ✅ Пользователь успешно зарегистрирован:', email);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('[auth] ❌ Ошибка регистрации:', error);
        return { 
            success: false, 
            error: getErrorMessage(error.code)
        };
    }
}

// Вход пользователя
async function loginUser(email, password) {
    try {
        console.log('[auth] Вход пользователя:', email);
        
        await setPersistence(auth, browserLocalPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('[auth] ✅ Пользователь успешно вошел:', email);
        
        // Убедимся что пользователь есть в БД
        try {
            console.log('[auth] Проверка профиля в БД...');
            const { getUserProfile, saveUserProfile } = await import('./database.js');
            const profileResult = await getUserProfile(userCredential.user.uid);
            
            if (!profileResult.data || !profileResult.data.role) {
                console.log('[auth] ⚠️ Профиль не полный, обновляем...');
                await saveUserProfile(userCredential.user.uid, {
                    email: email,
                    displayName: userCredential.user.displayName || 'Пользователь',
                    role: 'user',
                    createdAt: new Date().toISOString()
                });
                console.log('[auth] ✅ Профиль обновлен в БД');
            }
        } catch (dbError) {
            console.warn('[auth] ⚠️ Не удалось проверить профиль:', dbError.message);
        }
        
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('[auth] ❌ Ошибка входа:', error);
        return { 
            success: false, 
            error: getErrorMessage(error.code)
        };
    }
}

// Выход пользователя
async function logoutUser() {
    try {
        await signOut(auth);
        console.log('Пользователь успешно вышел');
        return { success: true };
    } catch (error) {
        console.error('Ошибка выхода:', error);
        return { 
            success: false, 
            error: getErrorMessage(error.code)
        };
    }
}

// Сброс пароля
async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        console.log('Письмо для сброса пароля отправлено на:', email);
        return { success: true };
    } catch (error) {
        console.error('Ошибка сброса пароля:', error);
        return { 
            success: false, 
            error: getErrorMessage(error.code)
        };
    }
}

// Слушатель изменения состояния авторизации
function onAuthChange(callback) {
    return onAuthStateChanged(auth, (user) => {
        callback(user);
    });
}

// Получить текущего пользователя
function getCurrentUser() {
    return auth.currentUser;
}

// Преобразовать коды ошибок Firebase в русские сообщения
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Этот адрес электронной почты уже используется',
        'auth/invalid-email': 'Неверный адрес электронной почты',
        'auth/operation-not-allowed': 'Эта операция не разрешена',
        'auth/weak-password': 'Пароль слишком простой (минимум 6 символов)',
        'auth/user-disabled': 'Этот аккаунт был отключен',
        'auth/user-not-found': 'Пользователь не найден',
        'auth/wrong-password': 'Неверный пароль',
        'auth/too-many-requests': 'Слишком много неудачных попыток входа. Попробуйте позже',
        'auth/account-exists-with-different-credential': 'Аккаунт существует с другим методом входа'
    };
    
    return errorMessages[errorCode] || 'Произошла ошибка. Попробуйте позже.';
}

export {
    registerUser,
    loginUser,
    logoutUser,
    resetPassword,
    onAuthChange,
    getCurrentUser,
    getErrorMessage
};
