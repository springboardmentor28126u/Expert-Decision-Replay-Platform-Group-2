// =====================================================
// EDRP AI AGENT
// =====================================================

const API_URL = "/ai-agent/chat";
// =====================================================
// CHAT HISTORY
// =====================================================

let conversationHistory = [];


// =====================================================
// GET JWT TOKEN
// =====================================================

function getAuthHeaders() {

    const token = getToken();

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    const input =
        document.getElementById("messageInput");

    const sendButton =
        document.getElementById("sendButton");


    if (!input || !sendButton) {
        console.error("AI Agent elements not found.");
        return;
    }


    // Send button

    sendButton.addEventListener(
        "click",
        sendMessage
    );


    // Enter key

    input.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();

            }

        }
    );

});


// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage() {

    const input =
        document.getElementById("messageInput");

    const message =
        input.value.trim();


    if (!message) {
        return;
    }


    // Show user message

    addMessage(
        message,
        "user"
    );


    input.value = "";


    // Disable input while AI responds

    input.disabled = true;


    const sendButton =
        document.getElementById("sendButton");

    sendButton.disabled = true;


    // Loading message

    const loadingId =
        addMessage(
            "🔎 Analyzing your EDRP data...",
            "bot"
        );

    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",

                    headers:
                        getAuthHeaders(),

                    body: JSON.stringify({
                    message: message,
                    conversation_history: conversationHistory
                })}
            );


        if (!response.ok) {

            const error =
                await response.text();

            throw new Error(
                error ||
                "AI Agent request failed."
            );

        }


        const data =
            await response.json();
        // Save conversation history

        conversationHistory.push({
            role: "user",
            content: message
        });

        conversationHistory.push({
            role: "assistant",
            content: data.answer || ""
        });

        // Remove loading message

        removeMessage(
            loadingId
        );


        // Display AI response

        addMessage(
            data.answer ||
            "No response received.",
            "bot"
        );


    }

    catch (error) {

        console.error(
            "AI Agent Error:",
            error
        );


        removeMessage(
            loadingId
        );


        addMessage(
            "Unable to connect to the AI Agent. Please make sure the backend and Ollama are running.",
            "bot"
        );

    }


    input.disabled = false;

    sendButton.disabled = false;

    input.focus();

}


// =====================================================
// ADD MESSAGE
// =====================================================

function addMessage(
    message,
    sender
) {

    const chat =
        document.getElementById(
            "chatMessages"
        );


    const messageDiv =
        document.createElement(
            "div"
        );


    const messageId =
        "message-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8);


    messageDiv.id =
        messageId;


    messageDiv.className =
        `message ${sender}-message`;


    const title =
        sender === "user"
            ? "You"
            : "EDRP AI Agent";


    messageDiv.innerHTML = `

        <strong>${title}</strong>

        <p>${formatMessage(message)}</p>

    `;


    chat.appendChild(
        messageDiv
    );


    // Scroll to bottom

    chat.scrollTop =
        chat.scrollHeight;


    return messageId;

}


// =====================================================
// REMOVE MESSAGE
// =====================================================

function removeMessage(
    messageId
) {

    const element =
        document.getElementById(
            messageId
        );


    if (element) {

        element.remove();

    }

}


// =====================================================
// FORMAT AI RESPONSE
// =====================================================

function formatMessage(
    text
) {

    if (!text) {
        return "";
    }


    return text

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        )

        .replace(
            /\n/g,
            "<br>"
        );

}