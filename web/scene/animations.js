//Roiugh Loop for neon hotel logo
TweenMax.from("#hotelLogo", 2, { opacity: 0, repeat:-1, repeatDelay:5, ease: RoughEase.ease.config({ template:  Sine.easeOut, strength: 2.5, points: 10, taper: "out", randomize: false, clamp: false})});

let animVelocity = 0.5;
let tl = new TimelineMax({paused: true});

tl
    .to("#logosBox", animVelocity, {x: -1500, ease: Back.easeInOut.config(1.4)})
    .to("#avatarNamegBox", animVelocity, {left: 0, onComplete: focusOnInput, ease: Back.easeInOut.config(1.4)})
    .addLabel("configName")
    .to("#avatarNamegBox", animVelocity, {left: -3000, ease: Back.easeInOut.config(1.4)})
    .to("#avatarConfigBox", animVelocity, {left: 0, ease: Back.easeInOut.config(1.4)})
    .addLabel("configAvatar")
    .to("#avatarConfigBox", animVelocity, {left: -3000, ease: Back.easeInOut.config(1.4)})
    .to("#officeSelectorMenu", animVelocity, {left: 0, ease: Back.easeInOut.config(1.4)})
    .addLabel("selectOffice")
    .to("#mainScreen", animVelocity*2, {left: -3000, ease: Back.easeOut.config(1.4)})
    .addLabel("openApp");

function focusOnInput() {
    document.getElementById("inputNameLabel").focus();
}

function removeCollision(){
    document.body.focus();

    //hide section info box
    TweenMax.to("#popInfoBox", 0.2, { 
        left: -1500, 
        ease: Power1.easeIn 
    });
    //hide private chat box
    TweenMax.to(".privateChatWindow", 0.2, { 
        bottom: -1500, 
        ease: Power1.easeIn });
    //remove private chat text lines
    const node= document.getElementById("chatMessageList");
    const popInfoNode = document.getElementById("popInfoBox");
    
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }

    while (popInfoNode.firstChild) {
        popInfoNode.removeChild(popInfoNode.firstChild);
    }
}

function openPublicChat(){
    const status = document.getElementById("textGeneral").offsetWidth > 2;
    const opened = status ? { width: '0%', padding: '2px' } : { width: '80%', padding: '10px' };
    TweenMax.to("#textGeneral", 0.3, { width: opened.width, paddingLeft: opened.padding, ease: Power1.easeOut});
    !status ? document.getElementById("textGeneral").focus() : document.body.focus();
}

function  openPrivateChat(){
    TweenMax.to(".privateChatWindow", 0.2, {
        bottom: 250,
        ease: Back.easeOut 
    });
    document.getElementById("textPrivate").focus();
};

function fillWithNewMessage(writer, text, owner) {
    const textToPrint = owner ? "<b>you:</b> " + text : "<b>"+writer + ":</b> " + text;
    const node = document.getElementById("chatMessageList");
    const textClass= owner ? "messageReceiverText"  : "messageSenderText";
    node.insertAdjacentHTML("beforeend", '<p class=' + textClass + '>' + textToPrint + '</p>');
}

function showSectionInfo(name, desc) {;
    removeCollision();
    desc = desc || '';
    //show section info box
    TweenMax.to("#popInfoBox", 0.2, { 
        left: 30, 
        ease: Back.easeOut 
    });
    var popInfoNode = document.getElementById("popInfoBox");
    popInfoNode.insertAdjacentHTML("beforeend", '<p class="popInfoTitle">' + name + '</p><p class="popInfoDesc">' + desc + '</p>');
}