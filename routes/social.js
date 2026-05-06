/* routes/social.js — Friend System & Chat REST API */
const express = require("express");
const prisma  = require("../lib/prisma");
const { requireAuth } = require("../lib/jwt");

const router = express.Router();
router.use(requireAuth);

/* ── 1. Search Users ── */
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ users: [] });

  const userId = req.user.id;
  const searchQuery = String(q).trim();

  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { name:  { contains: searchQuery, mode: "insensitive" } },
          { email: { contains: searchQuery, mode: "insensitive" } }
        ]
      },
      select: { id: true, name: true, email: true },
      take: 20
    });

    res.json({ users });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Lỗi tìm kiếm người dùng." });
  }
});

/* ── 2. Send Friend Request ── */
router.post("/friend-request", async (req, res) => {
  const { receiverId } = req.body;
  const requesterId = req.user.id;

  if (!receiverId || receiverId === requesterId) {
    return res.status(400).json({ error: "Yêu cầu không hợp lệ." });
  }

  try {
    // Check if they are already friends
    const existingFriend = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: requesterId, userBId: receiverId },
          { userAId: receiverId, userBId: requesterId }
        ]
      }
    });
    if (existingFriend) return res.status(400).json({ error: "Đã là bạn bè." });

    // Check if there is already a pending request either way
    const existingReq = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId }
        ],
        status: "pending"
      }
    });

    if (existingReq) {
      if (existingReq.receiverId === requesterId) {
        return res.status(400).json({ error: "Người này đã gửi lời mời cho bạn." });
      }
      return res.status(400).json({ error: "Đã gửi lời mời trước đó." });
    }

    const friendReq = await prisma.friendRequest.create({
      data: { requesterId, receiverId }
    });

    res.json({ message: "Đã gửi lời mời kết bạn.", friendRequest: friendReq });
  } catch (err) {
    console.error("Friend request error:", err);
    res.status(500).json({ error: "Lỗi gửi lời mời kết bạn." });
  }
});

/* ── 3. Accept Friend Request ── */
router.post("/friend-request/:id/accept", async (req, res) => {
  const requestId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const friendReq = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!friendReq) return res.status(404).json({ error: "Không tìm thấy lời mời." });
    if (friendReq.receiverId !== userId) return res.status(403).json({ error: "Không có quyền." });
    if (friendReq.status !== "pending") return res.status(400).json({ error: "Lời mời đã được xử lý." });

    // Use transaction to accept request and create friendship and conversation
    await prisma.$transaction(async (tx) => {
      await tx.friendRequest.update({
        where: { id: requestId },
        data: { status: "accepted" }
      });

      // Create Friendship (always store smaller ID as userA to simplify queries)
      const userAId = Math.min(userId, friendReq.requesterId);
      const userBId = Math.max(userId, friendReq.requesterId);

      await tx.friendship.create({
        data: { userAId, userBId }
      });

      // Create a Conversation thread between the two
      const conversation = await tx.conversation.create({ data: {} });
      await tx.participant.createMany({
        data: [
          { userId: userAId, conversationId: conversation.id },
          { userId: userBId, conversationId: conversation.id }
        ]
      });
    });

    res.json({ message: "Đã chấp nhận kết bạn." });
  } catch (err) {
    console.error("Accept request error:", err);
    res.status(500).json({ error: "Lỗi chấp nhận lời mời." });
  }
});

/* ── 4. Reject/Cancel Friend Request ── */
router.post("/friend-request/:id/reject", async (req, res) => {
  const requestId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const friendReq = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!friendReq) return res.status(404).json({ error: "Không tìm thấy lời mời." });
    if (friendReq.receiverId !== userId && friendReq.requesterId !== userId) {
      return res.status(403).json({ error: "Không có quyền." });
    }

    await prisma.friendRequest.delete({
      where: { id: requestId }
    });

    res.json({ message: "Đã huỷ lời mời." });
  } catch (err) {
    console.error("Reject request error:", err);
    res.status(500).json({ error: "Lỗi huỷ lời mời." });
  }
});

/* ── 5. Get Friends List ── */
router.get("/friends", async (req, res) => {
  const userId = req.user.id;

  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }]
      },
      include: {
        userA: { select: { id: true, name: true, email: true } },
        userB: { select: { id: true, name: true, email: true } }
      }
    });

    const friends = friendships.map(f => f.userAId === userId ? f.userB : f.userA);
    res.json({ friends });
  } catch (err) {
    console.error("Get friends error:", err);
    res.status(500).json({ error: "Lỗi tải danh sách bạn bè." });
  }
});

/* ── 6. Get Pending Requests ── */
router.get("/requests", async (req, res) => {
  const userId = req.user.id;

  try {
    const incoming = await prisma.friendRequest.findMany({
      where: { receiverId: userId, status: "pending" },
      include: { requester: { select: { id: true, name: true, email: true } } }
    });

    const outgoing = await prisma.friendRequest.findMany({
      where: { requesterId: userId, status: "pending" },
      include: { receiver: { select: { id: true, name: true, email: true } } }
    });

    res.json({ incoming, outgoing });
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).json({ error: "Lỗi tải danh sách lời mời." });
  }
});

/* ── 7. Get Conversations ── */
router.get("/conversations", async (req, res) => {
  const userId = req.user.id;

  try {
    const participants = await prisma.participant.findMany({
      where: { userId },
      select: { conversationId: true }
    });
    
    const convIds = participants.map(p => p.conversationId);

    const conversations = await prisma.conversation.findMany({
      where: { id: { in: convIds } },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Format for easier frontend use
    const formatted = conversations.map(c => {
      const otherParticipant = c.participants.find(p => p.userId !== userId);
      return {
        id: c.id,
        friend: otherParticipant ? otherParticipant.user : null,
        lastMessage: c.messages[0] || null,
        unreadCount: 0 // Optional: implement unread counts if needed later
      };
    });

    // Sort by last message date
    formatted.sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    res.json({ conversations: formatted });
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ error: "Lỗi tải danh sách trò chuyện." });
  }
});

/* ── 8. Get Messages for a Conversation ── */
router.get("/conversations/:id/messages", async (req, res) => {
  const conversationId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    // Verify user is in this conversation
    const isParticipant = await prisma.participant.findUnique({
      where: {
        userId_conversationId: { userId, conversationId }
      }
    });
    if (!isParticipant) return res.status(403).json({ error: "Không có quyền truy cập." });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true } }
      }
    });

    res.json({ messages });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Lỗi tải tin nhắn." });
  }
});

module.exports = router;
