export class DomManiputale extends EventTarget {

    #privatechatStyles = `
        .chat-window{
            background-color: white;
            color: black;
            border: solid 5px black;
            position: absolute;
            top: 50px;
            left: 0;
            right: 0;
            margin: auto;
            width: 450px;
            height: 350px;
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

    addPrivateChatWindow(chatUserName) {

        if (!document.getElementById('privateChatWindow')) {

            this.initPrivateChatStyles();
    
            const PrivateChatMaincontainer = document.createElement("div");
    
            PrivateChatMaincontainer.innerHTML = `
            <div id="privateChatWindow" class="chat-window">
                <div class="chat-header">
                    <div class="chat-title">${chatUserName}</div>
                    <div class="chat-close">X</div>
                </div>
    
                <div id="chatMessagesBox" class="chat-messages-container">
                    <div id="chatMessages" class="chat-lines"></div>
                </div>
    
                <input class="chat-input" type="text">
            </div>
            `;
    
            const chatWindow = PrivateChatMaincontainer.firstElementChild;
            
            document.body.appendChild(PrivateChatMaincontainer.firstElementChild);
    
            chatWindow.querySelector(".chat-close")?.addEventListener("click", () => {
                this.removePrivateChatWindow();
                this.dispatchEvent(new CustomEvent('privateChatClosed'));
            });
    
            const input = chatWindow.querySelector(".chat-input");

            input.focus();
    
            chatWindow?.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    const msg = input.value.trim();
                    if(msg) {
                        this.addPrivateMessageToChat(msg);
                        this.dispatchEvent(new CustomEvent('sendPrivateChat', {detail: msg}));
                    }
                    input.value = "";
                }
                if(e.key === 'Escape') {
                    this.removePrivateChatWindow();
                    this.dispatchEvent(new CustomEvent('privateChatClosed'));
                }
            });
        }
    }

    addPrivateMessageToChat(msg) {

        const messageLine = document.createElement("div");
        const chatLinescontainer = document.getElementById('chatMessages');
        const chatcontainer = document.getElementById('chatMessagesBox');

        messageLine.innerHTML = `
            <div class="chat-message">yo: ${msg}</div>
        `;

        chatLinescontainer?.appendChild(messageLine.firstElementChild);

        chatcontainer.scrollTop = chatcontainer?.scrollHeight;
    }

    addOtherUserMessageToChat(user, msg) {
        const messageLine = document.createElement("div");
        messageLine.innerHTML = `
            <div class="chat-message-other">${user}: ${msg}</div>
        `;
        document.getElementById('chatMessages')?.appendChild(messageLine.firstElementChild);
    }

    removePrivateChatWindow() {
        document.getElementById('privateChatWindow')?.remove();
        document.getElementById('private-chat-styles')?.remove();
    }
}