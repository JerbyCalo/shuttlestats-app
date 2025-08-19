// Shared message display system
export class MessageSystem {
  static showMessage(text, type = 'info', duration = 4000) {
    let messageContainer = document.getElementById('messageContainer');
    
    // Create message container if it doesn't exist
    if (!messageContainer) {
      messageContainer = this.createMessageContainer();
    }

    const messageId = Date.now().toString();
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.id = messageId;
    messageElement.textContent = text;

    messageContainer.appendChild(messageElement);

    // Auto remove after duration
    setTimeout(() => {
      const element = document.getElementById(messageId);
      if (element) {
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
          if (element.parentNode) {
            element.remove();
          }
        }, 300);
      }
    }, duration);

    return messageId;
  }

  static createMessageContainer() {
    let messageContainer = document.getElementById('messageContainer');
    if (messageContainer) return messageContainer;

    messageContainer = document.createElement('div');
    messageContainer.id = 'messageContainer';
    messageContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
    `;

    // Add message styles to document if not already present
    if (!document.getElementById('messageStyles')) {
      const style = document.createElement('style');
      style.id = 'messageStyles';
      style.textContent = `
        .message {
          background: white;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-left: 4px solid #ddd;
          font-size: 14px;
          line-height: 1.4;
          animation: slideIn 0.3s ease;
        }
        .message.success {
          border-left-color: #10b981;
          background: #f0fdf4;
          color: #166534;
        }
        .message.error {
          border-left-color: #ef4444;
          background: #fef2f2;
          color: #dc2626;
        }
        .message.info {
          border-left-color: #3b82f6;
          background: #eff6ff;
          color: #1e40af;
        }
        .message.warning {
          border-left-color: #f59e0b;
          background: #fffbeb;
          color: #92400e;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(messageContainer);
    return messageContainer;
  }

  static clearMessages() {
    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
      messageContainer.innerHTML = '';
    }
  }
}
