var path = require("path");

function getClassNameFromPath(filePath) {
    return path.basename(filePath).replace(".php", "")
}

function getNamespaceFromPath(filePath) {
    let className = getClassNameFromPath(filePath)

    filePath = filePath.replace(".php", "");

    let pathElements = filePath.split(path.sep);
    let srcIndex = pathElements.lastIndexOf("src");
    let indexAddition = 1;

    if (srcIndex == -1) {
        srcIndex = pathElements.lastIndexOf("tests");
    }

    // src dir not found so use it might be Laravel (use app directory instead of src)
    if (srcIndex === -1) {
        srcIndex = pathElements.lastIndexOf("app");
        indexAddition = 0;
    }

    let namespaceElements = pathElements
                            .slice(srcIndex + indexAddition, pathElements.lastIndexOf(className))
                            .map(pathElement => pathElement.charAt(0).toUpperCase() + pathElement.slice(1)) // every namespace need to be capitalized

    return {
        isLaravel: (indexAddition == 0) ? true : false,
        ns: namespaceElements.join("\\")
    };
}

function generateCode(filePath, prefix, nsVendor = null, classType = null) {
    let ns = getNamespaceFromPath(filePath)
    let cn = getClassNameFromPath(filePath)

    if (prefix == 'class' && classType) {
        prefix = `${classType} ${prefix}`
    }

    let namespace = ns.ns

    if (nsVendor && !ns.isLaravel) {
        namespace = nsVendor + "\\" + namespace
    }

    return `<?php\n` +
        '\n'+
        `namespace ${namespace};\n` +
        '\n'+
        `${prefix} ${cn}\n` +
        `{` +
        '\n'+
        `}`;
}

module.exports = {generateCode}
