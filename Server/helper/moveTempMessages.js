// 📁 helpers/moveTempMessages.js
import TemporaryChat from "../models/TemporaryChat.js";
import Conversation from "../models/Conversation.js";

export async function moveTempMessagesToConversation(tempChatId, conversationId) {
  const tempChat = await TemporaryChat.findById(tempChatId);
  if (!tempChat || tempChat.messages.length === 0) return;

  const permanentMessages = tempChat.messages.map(msg => ({
    senderId: msg.senderId,
    content: msg.content,
    timestamp: msg.timestamp,
  }));

  await Conversation.findByIdAndUpdate(conversationId, {
    $push: { messages: { $each: permanentMessages } },
  });

  await TemporaryChat.findByIdAndDelete(tempChatId);
  console.log(`💬 Moved ${permanentMessages.length} messages to Conversation ${conversationId}`);
}
