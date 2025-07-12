import { fetchPrivateMessages, fetchGroupMessages } from '../services/messageService.js';

export function startPolling(interval = 5000) {
  setInterval(() => {
    fetchPrivateMessages().catch(console.error);
    fetchGroupMessages().catch(console.error);
  }, interval);
}
