var path = require("path");

function getClassNameFromPath(filePath) {
    return path.basename(filePath).replace(".php", "")
}

function generateCode(filePath, prefix, classType = null) {
    let cn = getClassNameFromPath(filePath)

    if (prefix == 'class' && classType) {
        prefix = `${classType} ${prefix}`
    }

    return `<?php\n` +
        '\n'+
        `${prefix} ${cn}\n` +
        `{` +
        '\n'+
        `}`;
}

module.exports = {generateCode}
