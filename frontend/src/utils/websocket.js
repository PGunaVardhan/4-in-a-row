let ws = null;
let messageHandler = null;
let reconnectTimeout = null;
let isIntentionalClose = false;
let isConnecting = false;

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'ws://localhost:3001';
const WS_URL = BACKEND_URL.replace('http://', 'ws://').replace('https://', 'wss://');

export function connectWebSocket(onMessage) {
  // Prevent multiple simultaneous connections
  if (isConnecting || (ws && ws.readyState === WebSocket.OPEN)) {
    console.log('⚠️ WebSocket already connected or connecting');
    return ws;
  }

  isConnecting = true;
  messageHandler = onMessage;
  isIntentionalClose = false;

  // Clear any pending reconnect
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  console.log('🔌 Connecting WebSocket...');
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('✅ WebSocket connected');
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
    isConnecting = false;
  };

  ws.onclose = () => {
    console.log('🔌 WebSocket disconnected');
    isConnecting = false;

    // Only reconnect if NOT intentionally closed
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