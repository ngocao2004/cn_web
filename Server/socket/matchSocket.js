// socket/matchSocket.js
import matchingService from '../services/MatchingService.js';

export const initMatchSocket = (io) => {
  const waitingQueue = []; // Hàng đợi người tìm partner
  const chatPairs = new Map(); // Lưu các cặp đang chat
  const activeChatRooms = new Map(); // socketId → match object


  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // ========================================
    // TÌM PARTNER VỚI MATCHING ALGORITHM
    // ========================================
    socket.on("find_partner", async (userData) => {
      console.log("🔍 Finding partner for:", userData.name);

      // Thêm socketId vào userData
      const userWithSocket = { ...userData, socketId: socket.id };

      // Nếu không có ai trong queue
      if (waitingQueue.length === 0) {
        waitingQueue.push(userWithSocket);
        console.log("⏳ Added to waiting queue");
        return;
      }

      // TÌM PARTNER PHÙ HỢP NHẤT
      let bestMatch = null;
      let bestScore = 0;
      let bestIndex = -1;

      try {
        // Duyệt qua tất cả user trong queue
        for (let i = 0; i < waitingQueue.length; i++) {
          const candidate = waitingQueue[i];

          // Bỏ qua nếu là chính mình
          if (candidate.socketId === socket.id) continue;

          // ✅ TÍNH ĐIỂM TƯƠNG THÍCH
          const compatibility = await matchingService.calculateCompatibility(
            {
              gender: userData.gender,
              age: userData.age,
              career: userData.job || "Chưa cập nhật",
              hobbies: userData.hobbies || [],
              location: userData.hometown || "Chưa cập nhật",
              zodiac: userData.zodiac || "Chưa rõ",
              lookingFor: userData.lookingFor || "Tất cả"
            },
            {
              gender: candidate.gender,
              age: candidate.age,
              career: candidate.job || "Chưa cập nhật",
              hobbies: candidate.hobbies || [],
              location: candidate.hometown || "Chưa cập nhật",
              zodiac: candidate.zodiac || "Chưa rõ",
              lookingFor: candidate.lookingFor || "Tất cả"
            }
          );

          const score = compatibility.overallScore;
          console.log(`📊 Score with ${candidate.name}: ${score}`);

          // Cập nhật best match
          if (score > bestScore) {
            bestScore = score;
            bestMatch = candidate;
            bestIndex = i;
          }
        }

        // Nếu tìm thấy match (ngưỡng tối thiểu 50%)
        if (bestMatch && bestScore >= 50) {
          // Xóa partner khỏi queue
          waitingQueue.splice(bestIndex, 1);

          // Lưu cặp đôi
          chatPairs.set(socket.id, bestMatch.socketId);
          chatPairs.set(bestMatch.socketId, socket.id);

          console.log(`💕 Matched ${userData.name} with ${bestMatch.name} (${bestScore}%)`);

          // Gửi thông tin partner cho cả 2
          socket.emit("partner_found", {
            socketId: bestMatch.socketId,
            name: bestMatch.name,
            gender: bestMatch.gender,
            age: bestMatch.age,
            avatar: bestMatch.avatar,
            job: bestMatch.job,
            hometown: bestMatch.hometown,
            hobbies: bestMatch.hobbies || [],           // ✅ THÊM
            zodiac: bestMatch.zodiac || "Chưa rõ",      // ✅ THÊM
            lookingFor: bestMatch.lookingFor || "Tất cả", // ✅ THÊM
            career: bestMatch.job || "Chưa cập nhật",   // ✅ THÊM (alias của job)
            location: bestMatch.hometown || "Chưa cập nhật", // ✅ THÊM (alias của hometown)
            compatibilityScore: bestScore
          });

          io.to(bestMatch.socketId).emit("partner_found", {
            socketId: socket.id,
            name: userData.name,
            gender: userData.gender,
            age: userData.age,
            avatar: userData.avatar,
            job: userData.job,
            hometown: userData.hometown,
            hobbies: userData.hobbies || [],              // ✅ THÊM
            zodiac: userData.zodiac || "Chưa rõ",         // ✅ THÊM
            lookingFor: userData.lookingFor || "Tất cả",  // ✅ THÊM
            career: userData.job || "Chưa cập nhật",      // ✅ THÊM
            location: userData.hometown || "Chưa cập nhật", // ✅ THÊM
            compatibilityScore: bestScore
          });
        } else {
          // Không tìm thấy match phù hợp → vào queue
          waitingQueue.push(userWithSocket);
          console.log(`⏳ No good match found, added to queue (best score: ${bestScore})`);
        }

      } catch (error) {
        console.error("❌ Error matching:", error);
        // Fallback: ghép với người đầu tiên trong queue
        if (waitingQueue.length > 0) {
          const firstUser = waitingQueue.shift();
          
          chatPairs.set(socket.id, firstUser.socketId);
          chatPairs.set(firstUser.socketId, socket.id);

          socket.emit("partner_found", {
          socketId: firstUser.socketId,
          name: firstUser.name,
          gender: firstUser.gender,
          age: firstUser.age,
          avatar: firstUser.avatar,
          job: firstUser.job,
          hometown: firstUser.hometown,
          hobbies: firstUser.hobbies || [],           // ✅ THÊM
          zodiac: firstUser.zodiac || "Chưa rõ",      // ✅ THÊM
          lookingFor: firstUser.lookingFor || "Tất cả", // ✅ THÊM
          career: firstUser.job || "Chưa cập nhật",
          location: firstUser.hometown || "Chưa cập nhật",
          compatibilityScore: 60
        });

        io.to(firstUser.socketId).emit("partner_found", {
          socketId: socket.id,
          name: userData.name,
          gender: userData.gender,
          age: userData.age,
          avatar: userData.avatar,
          job: userData.job,
          hometown: userData.hometown,
          hobbies: userData.hobbies || [],            // ✅ THÊM
          zodiac: userData.zodiac || "Chưa rõ",       // ✅ THÊM
          lookingFor: userData.lookingFor || "Tất cả", // ✅ THÊM
          career: userData.job || "Chưa cập nhật",
          location: userData.hometown || "Chưa cập nhật",
          compatibilityScore: 60
          });
        } else {
          waitingQueue.push(userWithSocket);
        }
      }
    });

    // ========================================
    // HỦY TÌM KIẾM
    // ========================================
    socket.on("cancel_find", () => {
      const index = waitingQueue.findIndex(u => u.socketId === socket.id);
      if (index !== -1) {
        waitingQueue.splice(index, 1);
        console.log(`🚫 User ${socket.id} cancelled search`);
      }
    });

    // ========================================
    // GỬI TIN NHẮN
    // ========================================
    socket.on("send_message", ({ to, message }) => {
      console.log(`💬 Message from ${socket.id} to ${to}: ${message}`);
      io.to(to).emit("receive_message", {
        from: socket.id,
        message: message,
        timestamp: new Date().toISOString()
      });
    });

    // ========================================
    // NGẮT KẾT NỐI
    // ========================================
    socket.on("disconnect", async () => {
      console.log(`❌ User disconnected: ${socket.id}`);

      const queueIndex = waitingQueue.findIndex(u => u.socketId === socket.id);
      if (queueIndex !== -1) waitingQueue.splice(queueIndex, 1);

      const chatRoom = activeChatRooms.get(socket.id);
      if (chatRoom) {
        try {
          const match = await Match.findOne({
            $or: [
              { user1Id: socket.data.userId, user2Id: chatRoom.partnerId },
              { user1Id: chatRoom.partnerId, user2Id: socket.data.userId }
            ]
          });

          // Nếu CHƯA mutual → báo partner rời
          if (!match || match.status !== "matched") {
            io.to(chatRoom.partnerSocketId).emit("partner_disconnected");

            // Xóa room khi chưa mutual
            activeChatRooms.delete(socket.id);
            activeChatRooms.delete(chatRoom.partnerSocketId);
            clearChatTimer(chatRoom.roomId);
            console.log(`🧹 Room cleared: ${chatRoom.roomId}`);
          } else {
            // Match đã mutual → không xóa room
            console.log(`✅ User disconnected but match already mutual: ${match._id}`);
          }
        } catch (error) {
          console.error("❌ Error on disconnect:", error);
        }
      }
    });



    // ========================================
    // TÍNH COMPATIBILITY TRỰC TIẾP (OPTIONAL)
    // ========================================
    socket.on("calculate-compatibility", async ({ user1, user2 }) => {
      try {
        const result = await matchingService.calculateCompatibility(user1, user2);
        socket.emit("compatibility-result", {
          success: true,
          data: result
        });
      } catch (error) {
        console.error('Socket error:', error);
        socket.emit("compatibility-result", {
          success: false,
          error: error.message
        });
      }
    });
  });
};