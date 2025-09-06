const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message");

async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  // show user message
  addMessage("You", message, "user");
  messageInput.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();

    if (data.reply) {
      addMessage("Gemini", data.reply, "bot");
    } else if (data.error) {
      // show backend error
      addMessage("Error", data.error, "bot");
    } else {
      addMessage("Error", "No response from server", "bot");
    }
  } catch (err) {
    addMessage("Error", `Failed to connect: ${err.message}`, "bot");
  }
}

function addMessage(sender, text, type) {
  const div = document.createElement("div");
  div.className = type;
  div.textContent = `${sender}: ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight; // auto-scroll
}


