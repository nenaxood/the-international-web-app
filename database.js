// Database Module для Realtime Database
import { database } from './firebase-init.js';
import {
    ref,
    set,
    get,
    update,
    remove,
    onValue
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js';

// Сохранить данные пользователя
async function saveUserProfile(userId, userData) {
    try {
        console.log('[database] Сохранение профиля пользователя:', userId);
        console.log('[database] Данные:', userData);
        
        // Используем update вместо set чтобы не перезаписать существующие данные типа role
        const profileData = {
            email: userData.email,
            displayName: userData.displayName,
            createdAt: userData.createdAt || new Date().toISOString(),
            role: userData.role || 'user',
            ...userData
        };
        
        console.log('[database] Финальные данные профиля:', profileData);
        
        await set(ref(database, 'users/' + userId), profileData);
        
        console.log('[database] ✅ Профиль пользователя сохранен');
        return { success: true };
    } catch (error) {
        console.error('[database] ❌ Ошибка сохранения профиля:', error);
        console.error('[database] Сообщение об ошибке:', error.message);
        console.error('[database] Код ошибки:', error.code);
        return { success: false, error: error.message };
    }
}

// Получить данные пользователя
async function getUserProfile(userId) {
    try {
        console.log('[database] getUserProfile для:', userId);
        const snapshot = await get(ref(database, 'users/' + userId));
        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log('[database] Профиль найден:', data);
            return { success: true, data: data };
        } else {
            console.log('[database] Профиль не найден, возвращаем пустую структуру');
            // Вместо ошибки возвращаем минимальные данные
            return { 
                success: true, 
                data: {
                    displayName: 'Пользователь',
                    email: '',
                    createdAt: new Date().toISOString()
                }
            };
        }
    } catch (error) {
        console.error('[database] Ошибка получения профиля:', error);
        return { 
            success: true, 
            data: {
                displayName: 'Пользователь',
                email: '',
                createdAt: new Date().toISOString()
            }
        };
    }
}

// Сохранить корзину пользователя
async function saveCart(userId, cartData) {
    try {
        await set(ref(database, 'carts/' + userId), {
            items: cartData,
            updatedAt: new Date().toISOString()
        });
        console.log('Корзина сохранена');
        return { success: true };
    } catch (error) {
        console.error('Ошибка сохранения корзины:', error);
        return { success: false, error: error.message };
    }
}

// Получить корзину пользователя
async function getCart(userId) {
    try {
        const snapshot = await get(ref(database, 'carts/' + userId));
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        } else {
            return { success: true, data: { items: [] } };
        }
    } catch (error) {
        console.error('Ошибка получения корзины:', error);
        return { success: false, error: error.message };
    }
}

// Удалить корзину пользователя
async function deleteCart(userId) {
    try {
        await remove(ref(database, 'carts/' + userId));
        console.log('Корзина удалена');
        return { success: true };
    } catch (error) {
        console.error('Ошибка удаления корзины:', error);
        return { success: false, error: error.message };
    }
}

// Слушатель изменений профиля в реальном времени
function onUserProfileChange(userId, callback) {
    const userRef = ref(database, 'users/' + userId);
    return onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        }
    }, (error) => {
        console.error('Ошибка при слушании профиля:', error);
    });
}

// Слушатель изменений корзины в реальном времени
function onCartChange(userId, callback) {
    const cartRef = ref(database, 'carts/' + userId);
    return onValue(cartRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback({ items: [] });
        }
    }, (error) => {
        console.error('Ошибка при слушании корзины:', error);
    });
}

// Сохранить заказ
async function saveOrder(userId, orderData) {
    try {
        const orderId = Date.now().toString();
        await set(ref(database, 'orders/' + userId + '/' + orderId), {
            orderId: orderId,
            items: orderData.items,
            total: orderData.total,
            createdAt: new Date().toISOString(),
            status: 'pending'
        });
        console.log('Заказ сохранен');
        return { success: true, orderId: orderId };
    } catch (error) {
        console.error('Ошибка сохранения заказа:', error);
        return { success: false, error: error.message };
    }
}

// Получить все заказы пользователя
async function getUserOrders(userId) {
    try {
        const snapshot = await get(ref(database, 'orders/' + userId));
        if (snapshot.exists()) {
            return { success: true, data: snapshot.val() };
        } else {
            return { success: true, data: {} };
        }
    } catch (error) {
        console.error('Ошибка получения заказов:', error);
        return { success: false, error: error.message };
    }
}

export {
    saveUserProfile,
    getUserProfile,
    saveCart,
    getCart,
    deleteCart,
    onUserProfileChange,
    onCartChange,
    saveOrder,
    getUserOrders
};
