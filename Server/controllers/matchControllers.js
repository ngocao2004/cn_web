import User from "../models/User.js";
import { matchService } from "../services/matchService.js";

export const getMatchSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.userId);
    if (!currentUser) return res.status(404).json({ message: "Không tìm thấy người dùng!" });

    const allUsers = await User.find({ _id: { $ne: currentUser._id } });

    const results = [];
    for (const user of allUsers) {
      const { score, hobbyMatches } = await matchService.calculateMatchScore(currentUser, user);
      results.push({
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        score,
        hobbies: hobbyMatches,
      });
    }

    // Sắp xếp theo độ tương thích giảm dần
    results.sort((a, b) => b.score - a.score);

    res.json({ success: true, matches: results });
  } catch (err) {
    console.error("❌ Lỗi khi ghép đôi:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
};
