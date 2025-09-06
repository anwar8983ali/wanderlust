async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();

  if (!message) return;

  const chatDiv = document.getElementById("chat");
  chatDiv.innerHTML += `<p><b>You:</b> ${message}</p>`;

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    console.log("Fetch status:", res.status); // 👈 Add this

    const data = await res.json();
    console.log("Bot response JSON:", data); // 👈 Add this

    chatDiv.innerHTML += `<p><b>Bot:</b> ${data.reply}</p>`;
  } catch (err) {
    console.error("Frontend error:", err);
    chatDiv.innerHTML += `<p><b>Bot:</b> Error connecting to server</p>`;
  }

  input.value = "";
  chatDiv.scrollTop = chatDiv.scrollHeight;
}
