import { io, Socket } from 'socket.io-client';
import { Task } from './tasks.service';

let socket: Socket | null = null;

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:3001');

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to tasks socket server:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected from tasks socket server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket.IO] Connection error:', error.message);
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const socketService = {
  getSocket,

  joinWorkspace(workspaceId: string) {
    const s = getSocket();
    if (workspaceId) {
      s.emit('join:workspace', workspaceId);
    }
  },

  leaveWorkspace(workspaceId: string) {
    const s = getSocket();
    if (workspaceId) {
      s.emit('leave:workspace', workspaceId);
    }
  },

  onTaskCreated(callback: (task: Task) => void) {
    const s = getSocket();
    s.on('task:created', callback);
    return () => {
      s.off('task:created', callback);
    };
  },

  onTaskUpdated(callback: (task: Task) => void) {
    const s = getSocket();
    s.on('task:updated', callback);
    return () => {
      s.off('task:updated', callback);
    };
  },

  onTaskDeleted(callback: (data: { id: string; userId?: string; workspaceId?: string }) => void) {
    const s = getSocket();
    s.on('task:deleted', callback);
    return () => {
      s.off('task:deleted', callback);
    };
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
};

export default socketService;
