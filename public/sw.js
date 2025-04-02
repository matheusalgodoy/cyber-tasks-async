// Configurações do service worker
const CACHE_NAME = 'cyber-tasks-v1';
const OFFLINE_URL = '/';

let settings = {
  notificationsEnabled: false,
  soundEnabled: true,
  advanceReminder: 15
};

let cachedTasks = [];

// Armazenar em cache os recursos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        '/index.html',
        '/notification-sound.mp3',
        '/pwa-icon-192.png',
        '/pwa-icon-512.png'
      ]);
    })
  );
  self.skipWaiting();
});

// Limpar caches antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Configurar verificação periódica de lembretes
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkReminders());
  }
});

// Comunicação com o aplicativo
self.addEventListener('message', (event) => {
  if (event.data.type === 'SETTINGS_UPDATED') {
    settings = event.data.settings;
  } 
  else if (event.data.type === 'TASKS_UPDATED') {
    cachedTasks = event.data.tasks;
  }
  else if (event.data === 'GET_SETTINGS') {
    event.source.postMessage({
      type: 'SETTINGS',
      settings: settings
    });
  }
  else if (event.data === 'GET_TASKS') {
    event.source.postMessage({
      type: 'TASKS',
      tasks: cachedTasks
    });
  }
});

// Verificar lembretes em background
async function checkReminders() {
  if (!settings.notificationsEnabled) return;

  try {
    // Obter as tarefas mais recentes
    const allClients = await self.clients.matchAll();
    if (allClients.length > 0) {
      const client = allClients[0];
      client.postMessage('GET_TASKS');
    }

    // Verificar lembretes
    const now = Date.now();
    
    cachedTasks.forEach(task => {
      if (task.completed || !task.reminder || !task.dueDate) return;
      
      const dueDate = new Date(task.dueDate);
      if (task.dueTime) {
        const [hours, minutes] = task.dueTime.split(':').map(Number);
        dueDate.setHours(hours, minutes, 0, 0);
      } else {
        dueDate.setHours(9, 0, 0, 0);
      }
      
      const reminderTime = new Date(dueDate.getTime() - (settings.advanceReminder * 60 * 1000));
      const reminderTimestamp = reminderTime.getTime();
      
      // Verificar se está dentro de um minuto do lembrete
      const timeDiff = Math.abs(now - reminderTimestamp);
      if (timeDiff < 60000) { // Dentro de 1 minuto
        showNotification(task);
      }
    });
  } catch (error) {
    console.error('Erro ao verificar lembretes:', error);
  }
}

// Mostrar notificação
async function showNotification(task) {
  const title = "Lembrete de Tarefa";
  const body = `A tarefa "${task.title}" vence ${task.dueTime ? "hoje às " + task.dueTime : "hoje"}!`;
  
  try {
    await self.registration.showNotification(title, {
      body,
      icon: '/pwa-icon-192.png',
      badge: '/pwa-icon-192.png',
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'complete',
          title: 'Marcar como concluída'
        },
        {
          action: 'open',
          title: 'Abrir'
        }
      ],
      data: {
        taskId: task.id
      }
    });
  } catch (error) {
    console.error('Erro ao mostrar notificação:', error);
  }
}

// Gerenciar cliques em notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'complete') {
    const taskId = event.notification.data.taskId;
    
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        if (clients.length > 0) {
          clients[0].postMessage({
            type: 'COMPLETE_TASK',
            taskId: taskId
          });
        }
      })
    );
  } else {
    // Abrir o aplicativo
    event.waitUntil(
      self.clients.matchAll({
        type: 'window'
      }).then(function(clientList) {
        // Se já estiver aberto, focar nele
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não estiver aberto, abrir uma nova janela
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Estratégia de cache para recursos estáticos
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match(OFFLINE_URL);
        });
      })
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Armazenar em cache apenas recursos estáticos
        if (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|ico|mp3)$/)) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
      // Fallback para recursos não encontrados
      if (event.request.url.match(/\.(png|jpg|jpeg|svg|ico)$/)) {
        return caches.match('/pwa-icon-192.png');
      }
      return new Response('Recurso não disponível offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'text/plain'
        })
      });
    })
  );
}); 