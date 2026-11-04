import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const isDevelopment = import.meta.env.DEV;
    let socketUrl = window.location.origin;

    if (!isDevelopment) {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      if (apiUrl.startsWith('http')) {
        socketUrl = apiUrl.replace(/\/api\/?$/, '');
      }
    }

    try {
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000
      });

      socket.on('connect', () => {
        console.log('⚡ Connected to WebSocket server:', socket.id);
      });

      socket.on('connect_error', (err) => {
        console.warn('WebSocket connection warning:', err.message);
      });
    } catch (e) {
      console.warn('Failed to initialize socket:', e);
      return null;
    }
  }

  return socket;
};

export default getSocket;

