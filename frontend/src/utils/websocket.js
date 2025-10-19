let ws = null;
let messageHandler = null;
let reconnectTimeout = null;
let isIntentionalClose = false;
let isConnecting = false;

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const WS_URL = BACKEND_URL.replace('http://', 'ws://').replace('https://', 'wss://');

console.log('🌐 Environment:', {
  REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
  BACKEND_URL: BACKEND_URL,
  WS_URL: WS_URL
});

export function connectWebSocket(onMessage) {
  if (isConnecting || (ws && ws.readyState === WebSocket.OPEN)) {
    console.log('⚠️ WebSocket already connected or connecting');
    return ws;
  }

  isConnecting = true;
  messageHandler = onMessage;
  isIntentionalClose = false;

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  console.log('🔌 Connecting to WebSocket:', WS_URL);
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('✅ WebSocket connected to:', WS_URL);
    isConnecting = false;
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 Received:', data.type, data);
      if (messageHandler) {
        messageHandler(data);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
    console.error('Was trying to connect to:', WS_URL);
    isConnecting = false;
  };

  ws.onclose = () => {
    console.log('🔌 WebSocket disconnected');
    isConnecting = false;

    if (!isIntentionalClose) {
      console.log('⏳ Will reconnect in 5 seconds...');
      reconnectTimeout = setTimeout(() => {
        if (!isIntentionalClose) {
          console.log('🔄 Attempting to reconnect...');
          connectWebSocket(messageHandler);
        }
      }, 5000);
    }
  };

  return ws;
}

export function sendMessage(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('📤 Sending:', message.type, message);
    ws.send(JSON.stringify(message));
    return true;
  } else {
    console.error('⚠️ WebSocket not connected, state:', ws?.readyState);
    return false;
  }
}

export function closeWebSocket() {
  isIntentionalClose = true;
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (ws) {
    console.log('🔌 Closing WebSocket intentionally');
    ws.close();
    ws = null;
  }
}

export function isConnected() {
  return ws && ws.readyState === WebSocket.OPEN;
}