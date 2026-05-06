/* public/js/social.js — Client-side Socket.IO & Chat UI Logic */

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  
  if (!token || !userStr) {
    window.location.href = "/login.html";
    return;
  }

  const currentUser = JSON.parse(userStr);
  
  // UI Elements
  const tabFriends = document.getElementById("tab-friends");
  const tabRequests = document.getElementById("tab-requests");
  const tabSearch = document.getElementById("tab-search");
  const searchContainer = document.getElementById("search-container");
  const searchInput = document.getElementById("search-input");
  const sidebarContent = document.getElementById("sidebar-content");
  
  const chatEmptyState = document.getElementById("chat-empty-state");
  const chatActiveUi = document.getElementById("chat-active-ui");
  const chatAvatar = document.getElementById("chat-avatar");
  const chatName = document.getElementById("chat-name");
  const chatStatus = document.getElementById("chat-status");
  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const typingIndicator = document.getElementById("typing-indicator");
  const typingName = document.getElementById("typing-name");

  // State
  let currentTab = "friends"; // "friends", "requests", "search"
  let activeConversationId = null;
  let activeFriend = null;
  let typingTimeout = null;

  function getUserIdFromToken(jwtToken) {
    try {
      const payload = jwtToken.split(".")[1];
      if (!payload) return null;
      const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      return decoded?.id ?? null;
    } catch (_error) {
      return null;
    }
  }

  function normalizeUserId(value) {
    const numeric = Number(value);
    return Number.isNaN(numeric) ? String(value || "") : numeric;
  }

  if (currentUser && currentUser.id == null) {
    const fallbackId = getUserIdFromToken(token);
    if (fallbackId != null) currentUser.id = fallbackId;
  }

  /* ─── Socket.IO Initialization ─── */
  const socket = io({
    auth: { token }
  });

  socket.on("connect", () => {
    console.log("Connected to chat server");
    loadFriends(); // Initial load
  });

  socket.on("connect_error", (err) => {
    console.error("Socket error:", err.message);
    if (err.message.includes("Token")) {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
    }
  });

  /* ─── Real-time Event Listeners ─── */
  
  socket.on("new_message", (msg) => {
    if (currentTab === "friends") loadFriends();

    // If the message belongs to the active conversation, render it
    if (msg.conversationId === activeConversationId) {
      renderMessage(msg);
      scrollToBottom();
      
      // If we received it while in the conversation, mark as read
      if (normalizeUserId(msg.senderId) !== normalizeUserId(currentUser.id)) {
        socket.emit("mark_read", activeConversationId);
      }
    } else {
      // Show a toast or badge for unread message (simplified here)
      console.log("New message from another conversation", msg);
    }
  });

  socket.on("typing", ({ conversationId, name }) => {
    if (conversationId === activeConversationId) {
      typingName.textContent = name;
      typingIndicator.style.display = "flex";
      
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        typingIndicator.style.display = "none";
      }, 3000);
    }
  });

  /* ─── Tab Navigation ─── */
  
  function switchTab(tab) {
    currentTab = tab;
    [tabFriends, tabRequests, tabSearch].forEach(t => t.classList.remove("active"));
    
    if (tab === "friends") {
      tabFriends.classList.add("active");
      searchContainer.style.display = "none";
      loadFriends();
    } else if (tab === "requests") {
      tabRequests.classList.add("active");
      searchContainer.style.display = "none";
      loadRequests();
    } else if (tab === "search") {
      tabSearch.classList.add("active");
      searchContainer.style.display = "flex";
      sidebarContent.innerHTML = '<div class="empty-state">Nhập tên để tìm kiếm...</div>';
      searchInput.value = "";
      searchInput.focus();
    }
  }

  tabFriends.addEventListener("click", () => switchTab("friends"));
  tabRequests.addEventListener("click", () => switchTab("requests"));
  tabSearch.addEventListener("click", () => switchTab("search"));

  /* ─── Search Functionality ─── */
  
  let searchTimer;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    const q = e.target.value.trim();
    if (q.length < 2) {
      sidebarContent.innerHTML = '<div class="empty-state">Nhập ít nhất 2 ký tự...</div>';
      return;
    }
    
    searchTimer = setTimeout(() => {
      searchUsers(q);
    }, 500);
  });

  async function searchUsers(q) {
    sidebarContent.innerHTML = 'Đang tìm kiếm...';
    try {
      const res = await fetch(`/api/social/search?q=${encodeURIComponent(q)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!data.users || data.users.length === 0) {
        sidebarContent.innerHTML = '<div class="empty-state">Không tìm thấy ai.</div>';
        return;
      }
      
      sidebarContent.innerHTML = data.users.map(u => `
        <div class="user-item">
          <div class="user-avatar">${u.name.charAt(0).toUpperCase()}</div>
          <div class="user-info">
            <div class="user-name">${u.name}</div>
            <div class="user-msg-preview">${u.email}</div>
          </div>
          <button class="btn-small btn-accept" onclick="sendFriendRequest(${u.id})">Kết bạn</button>
        </div>
      `).join("");
    } catch (err) {
      sidebarContent.innerHTML = '<div class="empty-state">Lỗi tìm kiếm.</div>';
    }
  }

  /* ─── Friends & Requests Logic ─── */

  window.sendFriendRequest = async (receiverId) => {
    try {
      const res = await fetch("/api/social/friend-request", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ receiverId })
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (res.ok) switchTab("requests");
    } catch (err) {
      alert("Lỗi mạng.");
    }
  };

  window.acceptRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/social/friend-request/${requestId}/accept`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        switchTab("friends");
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert("Lỗi mạng.");
    }
  };

  window.rejectRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/social/friend-request/${requestId}/reject`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) loadRequests();
    } catch (err) {
      alert("Lỗi mạng.");
    }
  };

  async function loadRequests() {
    sidebarContent.innerHTML = 'Đang tải...';
    try {
      const res = await fetch("/api/social/requests", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const { incoming, outgoing } = await res.json();
      
      let html = "";
      
      if (incoming.length > 0) {
        html += `<div style="font-size: 12px; font-weight: bold; color: var(--sub); margin: 10px 0 5px;">LỜI MỜI ĐẾN</div>`;
        html += incoming.map(r => `
          <div class="user-item">
            <div class="user-avatar">${r.requester.name.charAt(0).toUpperCase()}</div>
            <div class="user-info">
              <div class="user-name">${r.requester.name}</div>
            </div>
            <div>
              <button class="btn-small btn-accept" onclick="acceptRequest(${r.id})">✔</button>
              <button class="btn-small btn-reject" onclick="rejectRequest(${r.id})">✖</button>
            </div>
          </div>
        `).join("");
      }
      
      if (outgoing.length > 0) {
        html += `<div style="font-size: 12px; font-weight: bold; color: var(--sub); margin: 10px 0 5px;">ĐÃ GỬI</div>`;
        html += outgoing.map(r => `
          <div class="user-item">
            <div class="user-avatar">${r.receiver.name.charAt(0).toUpperCase()}</div>
            <div class="user-info">
              <div class="user-name">${r.receiver.name}</div>
              <div class="user-msg-preview">Chờ xác nhận...</div>
            </div>
            <button class="btn-small btn-reject" onclick="rejectRequest(${r.id})">Huỷ</button>
          </div>
        `).join("");
      }

      if (!html) {
        html = '<div class="empty-state">Không có lời mời nào.</div>';
      }
      
      sidebarContent.innerHTML = html;
    } catch (err) {
      sidebarContent.innerHTML = '<div class="empty-state">Lỗi tải dữ liệu.</div>';
    }
  }

  async function loadFriends() {
    sidebarContent.innerHTML = 'Đang tải...';
    try {
      const res = await fetch("/api/social/conversations", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const { conversations } = await res.json();
      
      if (!conversations || conversations.length === 0) {
        sidebarContent.innerHTML = '<div class="empty-state">Bạn chưa có bạn bè nào. Qua tab "Tìm kiếm" để kết bạn nhé!</div>';
        return;
      }
      
      sidebarContent.innerHTML = conversations.map(c => {
        if (!c.friend) return ""; // safety check
        const isActive = c.id === activeConversationId ? "active" : "";
        const msgPreview = c.lastMessage ? c.lastMessage.content : "Chưa có tin nhắn";
        
        return `
          <div class="user-item ${isActive}" onclick="openConversation(${c.id}, '${encodeURIComponent(JSON.stringify(c.friend))}')">
            <div class="user-avatar">
              ${c.friend.name.charAt(0).toUpperCase()}
              <div class="online-dot"></div>
            </div>
            <div class="user-info">
              <div class="user-name">${c.friend.name}</div>
              <div class="user-msg-preview">${msgPreview}</div>
            </div>
          </div>
        `;
      }).join("");
    } catch (err) {
      sidebarContent.innerHTML = '<div class="empty-state">Lỗi tải dữ liệu.</div>';
    }
  }

  /* ─── Chat / Conversation Logic ─── */

  window.openConversation = async (convId, friendDataStr) => {
    activeConversationId = convId;
    activeFriend = JSON.parse(decodeURIComponent(friendDataStr));
    
    // UI Update
    chatEmptyState.style.display = "none";
    chatActiveUi.style.display = "flex";
    chatAvatar.textContent = activeFriend.name.charAt(0).toUpperCase();
    chatName.textContent = activeFriend.name;
    chatStatus.textContent = "Đang xem tin nhắn...";
    
    // Highlight sidebar
    document.querySelectorAll(".user-item").forEach(el => el.classList.remove("active"));
    event.currentTarget.classList.add("active");

    // Socket Join Room
    socket.emit("join_conversation", convId);

    // Load History
    chatMessages.innerHTML = '<div style="text-align:center; color:var(--sub);">Đang tải tin nhắn...</div>';
    try {
      const res = await fetch(`/api/social/conversations/${convId}/messages`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const { messages } = await res.json();
      
      chatMessages.innerHTML = "";
      if (messages.length === 0) {
        chatMessages.innerHTML = '<div style="text-align:center; color:var(--sub); margin-top:20px;">Hãy gửi lời chào đầu tiên! 👋</div>';
      } else {
        messages.forEach(renderMessage);
        scrollToBottom();
      }
      chatStatus.textContent = "Sẵn sàng";
    } catch (err) {
      chatMessages.innerHTML = '<div style="text-align:center; color:var(--danger);">Lỗi tải tin nhắn.</div>';
    }
  };

  function renderMessage(msg) {
    // Remove empty state if it's there
    if (chatMessages.innerHTML.includes("Hãy gửi lời chào")) {
      chatMessages.innerHTML = "";
    }

    const isMe = normalizeUserId(msg.senderId) === normalizeUserId(currentUser.id);
    const div = document.createElement("div");
    div.className = `social-bubble ${isMe ? "me" : "other"}`;
    div.textContent = msg.content;
    chatMessages.appendChild(div);
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /* ─── Send Message ─── */
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text || !activeConversationId) return;

    chatInput.value = "";

    // Send to server
    socket.emit("send_message", {
      senderId: currentUser.id,
      content: text,
      conversationId: activeConversationId
    }, (res) => {
      if (res.status !== "ok") {
        chatInput.value = text;
        chatInput.focus();
        alert(res.message || "Lỗi gửi tin nhắn");
      }
    });
  });

  /* ─── Typing Indicator Emit ─── */
  let emitTypingTimer;
  chatInput.addEventListener("input", () => {
    if (!activeConversationId) return;
    
    clearTimeout(emitTypingTimer);
    socket.emit("typing", activeConversationId);
    
    emitTypingTimer = setTimeout(() => {}, 1000);
  });

});
