import { gsap, Back } from "gsap";
import { RoughEase } from "gsap/EasePack";
import { generateFloorsOptions } from "./DomManipulate";

const FLOORS = ['tablas2-P2', 'tablas2-P1', 'tablas2-P0', 'manoteras'];

export const animateLogo = () => {
    gsap.from(
        "#hotelLogo",
        { 
            opacity: 0,
            duration: 10,
            repeat:-1, 
            repeatDelay:5, 
            ease: RoughEase.ease.config({ strength: 3, points: 50, taper: "out", randomize: true, clamp: true})
        }
    );
}

export const createAnimTimeline = () => {
    const animVelocity = 0.5;
    let tl = gsap.timeline({paused: true});
    tl
    .to("#logosBox", {duration: animVelocity, x: -1500, ease: Back.easeInOut.config(1.4)})
    .to("#avatarNamegBox", {duration: animVelocity, left: 0, onComplete: () => document.getElementById("inputNameLabel").focus(), ease: Back.easeInOut.config(1.4)})
    .addLabel("configName")
    .to("#avatarNamegBox", {duration: animVelocity, left: -3000, ease: Back.easeInOut.config(1.4)})
    .to("#avatarConfigBox", {duration: animVelocity, left: 0, ease: Back.easeInOut.config(1.4)})
    .addLabel("configAvatar")
    .to("#avatarConfigBox", {duration: animVelocity, left: -3000, ease: Back.easeInOut.config(1.4)})
    .to("#officeSelectorMenu", {duration: animVelocity, left: 0, onComplete: () => generateFloorsOptions(FLOORS), ease: Back.easeInOut.config(1.4)})
    .addLabel("selectOffice")
    .to("#mainScreen", {duration: animVelocity*2, left: -3000, ease: Back.easeOut.config(1.4)})
    .addLabel("openApp");

    return tl;
}