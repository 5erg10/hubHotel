export const generateFloorsOptions = (floors) => {
     floors.map((plantName) => {

        const div = document.createElement('div');

        div.classList.add('plantSelectButton', `${plantName}Style`);

        div.id = `option-${plantName}`;

        div.addEventListener('click', () => {
            const event = new CustomEvent('floorSelected', {
                detail: { plantName }
            });

            document.dispatchEvent(event);
        });

        const p = document.createElement('p');

        p.textContent = plantName;

        div.appendChild(p);
        officeSelectorMenu.prepend(div);
    });
}