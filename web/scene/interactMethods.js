let deptInfoDescription = {
    "Innovacion": 'Este es el departamento donde se descubre el futuro de la tecnologia.',
    "Comedor": '¿tienes hambre?, ¿necesitas un break?, sientate un rato en buena compañía y disfruta.',
    "People": 'Departamento de seres humanos, para servirte y protegerte.',
    "IT": 'Portatil, redes, cuentas... si necesitas algo para el desempeño de tu trabajo, este es tu equipo.',
    "Alacena": '¿te sueles traer comida de casa?, aqui estara a buen recaudo.',
    "Comunicación": 'Te mantienen al tanto de todo lo que ocurre para que no te pierdas nada.',
    "Finance": 'Asuntos de dinero y jefatura del estado.',
    "Recepción": 'Gracias a su ayuda, nunca pierdes el rumbo.',
    "Cocina": 'Mucho de todo y Mucho de sano. Compra lo que quieras para mantener una dieta equilibrada.'
};
function doSomething(objectName){
    switch (objectName){
        case "Innovacion":
            showSectionInfo(objectName, deptInfoDescription[objectName]);
            break;
        case "DBI":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break; 
        case "MesasMCrespo":
            showSectionInfo("M Crespo", deptInfoDescription[objectName]);   
            break;
        case "MesasMobileChannel":
            showSectionInfo("Mobile channel", deptInfoDescription[objectName]);   
            break;
        case "MesasWebChannel":
            showSectionInfo("Web channel", deptInfoDescription[objectName]);   
            break;
        case "SalaReunion":
            showSectionInfo("Sala reunión", deptInfoDescription[objectName]);   
            break;
        case "MesasTipo3":
            showSectionInfo("Sala de reunión pequeña", deptInfoDescription[objectName]);   
            break;
        case "People":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        case "Comedor":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        case "Recepción":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        case "agora":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        case "Laboratorio":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        case "jefatura":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        case "Comunicación":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        case "quickstarter":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        case "biblioteca":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        case "IT":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        case "Alacena":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        case "Finance":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        case "Cocina":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        case "laboratorio":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        case "laboratorio":
            showSectionInfo(objectName, deptInfoDescription[objectName]);   
            break;
        default:
            console.log("collision con usuario: ", objectName);
            break;
    }
};