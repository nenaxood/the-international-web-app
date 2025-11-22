// Admin Module
import { database } from './firebase-init.js';
import {
    ref,
    set,
    get,
    update,
    remove,
    query,
    orderByChild,
    onValue
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js';

// Установить роль админа (используется только один раз при инициализации)
async function setAdminRole(userId) {
    try {
        await update(ref(database, 'users/' + userId), {
            role: 'admin'
        });
        console.log('Роль админа установлена');
        return { success: true };
    } catch (error) {
        console.error('Ошибка установки роли админа:', error);
        return { success: false, error: error.message };
    }
}

// Получить роль пользователя
async function getUserRole(userId) {
    try {
        console.log('[getUserRole] Запрос роли для пользователя:', userId);
        const roleRef = ref(database, 'users/' + userId + '/role');
        console.log('[getUserRole] Путь БД:', roleRef.path);
        const snapshot = await get(roleRef);
        console.log('[getUserRole] Снимок получен, существует:', snapshot.exists());
        if (snapshot.exists()) {
            const role = snapshot.val();
            console.log('[getUserRole] ✅ Роль найдена:', role);
            return role;
        }
        console.log('[getUserRole] ⚠️ Роль не найдена, возвращаем по умолчанию "user"');
        return 'user'; // По умолчанию обычный пользователь
    } catch (error) {
        console.error('[getUserRole] ❌ Ошибка получения роли:', error.message, error.code);
        console.error('[getUserRole] Полная ошибка:', error);
        return 'user';
    }
}

// Проверить, является ли пользователь администратором
async function isAdmin(userId) {
    console.log('[isAdmin] Проверка админ статуса для:', userId);
    const role = await getUserRole(userId);
    const admin = role === 'admin';
    console.log('[isAdmin] Результат проверки: role=' + role + ', isAdmin=' + admin);
    return admin;
}

// Получить все заказы (для админа)
async function getAllOrders() {
    try {
        console.log('[getAllOrders] Начало запроса всех заказов');
        const snapshot = await get(ref(database, 'orders'));
        console.log('[getAllOrders] Снимок получен, существует:', snapshot.exists());
        
        if (snapshot.exists()) {
            const allOrders = [];
            const ordersData = snapshot.val();
            
            for (const userId in ordersData) {
                for (const orderId in ordersData[userId]) {
                    allOrders.push({
                        orderId: orderId,
                        userId: userId,
                        ...ordersData[userId][orderId]
                    });
                }
            }
            
            console.log('[getAllOrders] Заказы получены, количество:', allOrders.length);
            return { success: true, data: allOrders };
        }
        console.log('[getAllOrders] Снимок пуст, заказов нет');
        return { success: true, data: [] };
    } catch (error) {
        console.error('[getAllOrders] ❌ Ошибка получения заказов:', error.message);
        return { success: false, error: error.message };
    }
}

// Получить всех пользователей (для админа)
async function getAllUsers() {
    try {
        console.log('[getAllUsers] Начало запроса всех пользователей');
        const usersRef = ref(database, 'users');
        console.log('[getAllUsers] Путь БД:', usersRef.path);
        
        const snapshot = await get(usersRef);
        console.log('[getAllUsers] Снимок получен, существует:', snapshot.exists());
        console.log('[getAllUsers] Размер снимка:', snapshot.size);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log('[getAllUsers] Данные получены, количество пользователей:', Object.keys(data || {}).length);
            console.log('[getAllUsers] Полные данные:', data);
            return { success: true, data: data };
        }
        console.log('[getAllUsers] ⚠️ Снимок пуст, возвращаем пустой объект');
        console.log('[getAllUsers] Проверьте правила БД - возможно недостаточно прав для чтения');
        return { success: true, data: {} };
    } catch (error) {
        console.error('[getAllUsers] ❌ ОШИБКА получения пользователей:', error.message);
        console.error('[getAllUsers] Полная ошибка:', error);
        console.error('[getAllUsers] Код ошибки:', error.code);
        return { success: false, error: error.message };
    }
}

// Обновить статус заказа (для админа)
async function updateOrderStatus(userId, orderId, status) {
    try {
        console.log('[updateOrderStatus] Обновление статуса заказа:', orderId, '→', status);
        const result = await update(ref(database, `orders/${userId}/${orderId}`), {
            status: status,
            updatedAt: new Date().toISOString()
        });
        console.log('[updateOrderStatus] ✅ Статус обновлен');
        return { success: true };
    } catch (error) {
        console.error('[updateOrderStatus] ❌ Ошибка обновления статуса:', error.message);
        return { success: false, error: error.message };
    }
}

// Удалить заказ (для админа)
async function deleteOrder(userId, orderId) {
    try {
        console.log('[deleteOrder] Удаление заказа:', orderId);
        await remove(ref(database, `orders/${userId}/${orderId}`));
        console.log('[deleteOrder] ✅ Заказ удален');
        return { success: true };
    } catch (error) {
        console.error('[deleteOrder] ❌ Ошибка удаления заказа:', error.message);
        return { success: false, error: error.message };
    }
}

// Удалить пользователя (для админа)
async function deleteUser(userId) {
    try {
        console.log('[deleteUser] Удаление пользователя:', userId);
        await remove(ref(database, `users/${userId}`));
        console.log('[deleteUser] ✅ Пользователь удален из БД');
        console.log('[deleteUser] ℹ️ ВАЖНО: Для полного удаления пользователя из Firebase Authentication нужно использовать Firebase Admin SDK или Console');
        return { success: true };
    } catch (error) {
        console.error('[deleteUser] ❌ Ошибка удаления пользователя:', error.message);
        return { success: false, error: error.message };
    }
}

// Получить статистику (для админа)
async function getAdminStats() {
    try {
        const usersResult = await getAllUsers();
        const ordersResult = await getAllOrders();
        
        const totalUsers = Object.keys(usersResult.data || {}).length;
        const totalOrders = (ordersResult.data || []).length;
        const totalRevenue = (ordersResult.data || []).reduce((sum, order) => sum + (order.total || 0), 0);
        
        return {
            success: true,
            data: {
                totalUsers,
                totalOrders,
                totalRevenue,
                users: usersResult.data,
                orders: ordersResult.data
            }
        };
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        return { success: false, error: error.message };
    }
}

// Слушатель для заказов в реальном времени (для админа)
function onOrdersChange(callback) {
    const ordersRef = ref(database, 'orders');
    return onValue(ordersRef, (snapshot) => {
        if (snapshot.exists()) {
            const allOrders = [];
            const ordersData = snapshot.val();
            
            for (const userId in ordersData) {
                for (const orderId in ordersData[userId]) {
                    allOrders.push({
                        userId: userId,
                        ...ordersData[userId][orderId]
                    });
                }
            }
            
            callback(allOrders);
        } else {
            callback([]);
        }
    });
}

export {
    setAdminRole,
    getUserRole,
    isAdmin,
    getAllOrders,
    getAllUsers,
    updateOrderStatus,
    deleteOrder,
    deleteUser,
    getAdminStats,
    onOrdersChange,
    updateUserPassword
};

// Функция для изменения пароля пользователя (требует Cloud Function или Admin SDK)
async function updateUserPassword(userId, newPassword) {
    console.log('[updateUserPassword] Попытка изменить пароль для:', userId);
    
    // Firebase не позволяет менять пароль другого пользователя из клиента
    // Это требует Admin SDK на сервере или Cloud Function
    // Временное решение: используй Firebase Console
    
    try {
        // Здесь должен быть запрос к Cloud Function
        // Для сейчас возвращаем инструкцию
        const message = `
ОГРАНИЧЕНИЕ FIREBASE:
Менять пароли других пользователей можно только через Admin SDK на сервере или Cloud Function.

Временное решение:
1. Перейди в Firebase Console
2. Authentication → Пользователи
3. Найди пользователя
4. Нажми на три точки → "Удалить пароль"
5. Пользователь сможет установить новый пароль при следующем входе

Постоянное решение:
Необходим Firebase Blaze план (платный) для развертывания Cloud Function.
        `;
        
        console.warn('[updateUserPassword] Ограничение Firebase:', message);
        return {
            success: false,
            error: 'Требуется Cloud Function (Firebase Blaze план) для изменения пароля',
            instruction: message
        };
    } catch (error) {
        console.error('[updateUserPassword] Ошибка:', error);
        return { success: false, error: error.message };
    }
}
