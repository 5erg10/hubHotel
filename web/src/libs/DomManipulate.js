export class DomManiputale extends EventTarget {

    #privatechatStyles = `
        .private-chat-main-label {
            position: absolute;
            top: 1rem;
            left: 1rem;
            width: 500px;
            max-height: calc(100vh - 2rem);
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
            gap: 1rem;
            box-sizing: border-box;
            overflow-y: auto;
            overflow-x: hidden;
        }
        .chat-window{
            background-color: white;
            color: black;
            border: solid 5px black;
            width: 450px;
            height: 350px;
            flex-shrink: 0;
            display: grid;
            grid-template-rows: 30px auto 30px;
        }

        .chat-header{
            position: relative;
            font-size: 1rem;
            display:flex;
            justify-content:space-between;
            padding: 0.5rem;
            border-bottom: solid 2px black;
        }

        .chat-close {
            cursor: pointer;
        }

        .chat-messages-container {
            padding: 0rem 0.5rem;
            overflow-y: auto;
            min-height: 0;
        }

        .chat-lines {
            width: 100%;
            min-height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }

        .chat-message {
            font-size: 0.8rem;
            width: 100%;
            padding: 0.5rem 0rem;
        }

        .chat-message-other {
            font-size: 0.8rem;
            width: 100%;
            padding: 0.5rem 0rem;
            color: green;
            text-align: right;
        }

        .chat-input{
            all: unset;
            border-top:2px solid black;
            font-size: 0.7rem;
            padding:0 1rem;
        }

        .private-chat-main-label,
        .chat-messages-container {
            scrollbar-width: thin;
            scrollbar-color: #888 transparent;
        }

        .private-chat-main-label::-webkit-scrollbar,
        .chat-messages-container::-webkit-scrollbar {
            width: 4px;
        }

        .private-chat-main-label::-webkit-scrollbar-track,
        .chat-messages-container::-webkit-scrollbar-track {
            background: transparent;
        }

        .private-chat-main-label::-webkit-scrollbar-thumb,
        .chat-messages-container::-webkit-scrollbar-thumb {
            background-color: #888;
            border-radius: 0;
        }
    `;

    constructor() {
        super();
    }

    initPrivateChatStyles(){
        if (!document.getElementById("private-chat-styles")) {
            const style = document.createElement("style");
            style.id = "private-chat-styles";
            style.textContent = this.#privatechatStyles;
            document.head.appendChild(style);
        }
    }

    addSeccionDetailsToWindow({title, info}) {
        document.getElementById("additionalSecionInfo")?.remove();
        const div = document.createElement("div");
        div.id = "additionalSecionInfo";
        div.style.cssText = `
            background-color: white;
            color: black;
            padding: 2rem;
            border: solid 5px black;
            position: absolute;
            left: 4rem;
            top: 4rem;
            max-width: 350px;
        `;

        const titleContent = document.createElement("div");

        titleContent.textContent = title;
        titleContent.style.cssText = `
            font-size: 1.2rem;
            margin-bottom: 1rem;
        `;
        div.appendChild(titleContent);

        const infoContent = document.createElement("div");
        infoContent.textContent = info;
        infoContent.style.cssText = `
            font-size: 0.8rem;
            line-height: 1.5;
        `;
        div.appendChild(infoContent);

        document.body.appendChild(div);
    }

    removeInfoLabel() {
        document.getElementById("additionalSecionInfo")?.remove();
    }

    #sanitizeId(name) {
        return name.replace(/\W+/g, '_');
    }

    addPrivateChatWindow(chatUserName) {
        const safeId = this.#sanitizeId(chatUserName);

        // Añadir el contenedor principal si no existe
        let privateChatMainContainer = document.getElementById('privateChatMainContainer');
        if (!privateChatMainContainer) {
            this.initPrivateChatStyles();
            privateChatMainContainer = document.createElement("div");
            privateChatMainContainer.id = "privateChatMainContainer";
            privateChatMainContainer.className = "private-chat-main-label";
            document.body.appendChild(privateChatMainContainer);
        }

        // No abrir ventana duplicada para el mismo usuario
        if (document.getElementById(`privateChatWindow-${safeId}`)) return;

        const privateChat = document.createElement("div");
        privateChat.innerHTML = `
        <div id="privateChatWindow-${safeId}" class="chat-window">
            <div class="chat-header">
                <div class="chat-title"></div>
                <div class="chat-close">X</div>
            </div>
            <div id="chatMessagesBox-${safeId}" class="chat-messages-container">
                <div id="chatMessages-${safeId}" class="chat-lines"></div>
            </div>
            <input class="chat-input" type="text">
        </div>
        `;

        const chatWindow = privateChat.firstElementChild;
        chatWindow.querySelector(".chat-title").textContent = chatUserName;
        privateChatMainContainer.appendChild(chatWindow);

        chatWindow.querySelector(".chat-close")?.addEventListener("click", () => {
            this.removePrivateChatWindow(chatUserName);
            this.dispatchEvent(new CustomEvent('privateChatClosed', { detail: chatUserName }));
        });

        const input = chatWindow.querySelector(".chat-input");
        input.focus();

        chatWindow.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const msg = input.value.trim();
                if (msg) {
                    this.addPrivateMessageToChat(msg, chatUserName);
                    this.dispatchEvent(new CustomEvent('sendPrivateChat', { detail: { msg, chatUserName } }));
                }
                input.value = "";
            }
            if (e.key === 'Escape') {
                this.removePrivateChatWindow(chatUserName);
                this.dispatchEvent(new CustomEvent('privateChatClosed', { detail: chatUserName }));
            }
        });
    }

    addPrivateMessageToChat(msg, chatUserName) {
        const safeId = this.#sanitizeId(chatUserName);
        const messageLine = document.createElement("div");
        const chatLinesContainer = document.getElementById(`chatMessages-${safeId}`);
        const chatContainer = document.getElementById(`chatMessagesBox-${safeId}`);

        messageLine.innerHTML = `<div class="chat-message">yo: ${msg}</div>`;
        chatLinesContainer?.appendChild(messageLine.firstElementChild);
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    addOtherUserMessageToChat(user, msg) {
        const safeId = this.#sanitizeId(user);
        const messageLine = document.createElement("div");
        messageLine.innerHTML = `<div class="chat-message-other">${user}: ${msg}</div>`;
        document.getElementById(`chatMessages-${safeId}`)?.appendChild(messageLine.firstElementChild);
    }

    removePrivateChatWindow(chatUserName) {
        const safeId = this.#sanitizeId(chatUserName);
        document.getElementById(`privateChatWindow-${safeId}`)?.remove();
        const container = document.getElementById('privateChatMainContainer');
        if (container && container.children.length === 0) {
            container.remove();
            document.getElementById('private-chat-styles')?.remove();
        }
    }
}