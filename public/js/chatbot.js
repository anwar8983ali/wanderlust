async function sendMessage() {
  const input = document.getElementById("userInput");
  const chat = document.getElementById("chat");

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Show user message
  chat.innerHTML += `<p><strong>You:</strong> ${userMessage}</p>`;
  input.value = "";

  try {
    const res = await fetch("/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await res.json();
    chat.innerHTML += `<p><strong>Bot:</strong> ${data.reply}</p>`;
  } catch (err) {
    chat.innerHTML += `<p><strong>Bot:</strong> Error connecting to server.</p>`;
  }
}
