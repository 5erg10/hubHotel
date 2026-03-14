export class DomManiputale {
    
    constructor(){}

    static addSeccionDetailsToWindow({title, info}) {
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

    static removeInfoLabel() {
        document.getElementById("additionalSecionInfo")?.remove();
    }
}