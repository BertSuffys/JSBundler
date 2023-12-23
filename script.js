
let files
let fileNameContentMap = new Map()


function handleFileSelect(event) {
    /* to array */
    files = toArray(event.target.files)
    /* filter onm .js only */
    files = filterFiles(files, "js")

    /* Write filename & contents to map */
    writeFiles();
    drawUI();

}


/**
 * Writes the file names and content of all files to the fileNameContentMap
 */
function writeFiles() {
    if (files != null && files != undefined && files.length > 0) {
        for (let file of files) {
            writeFile(file);
        }
    }
}

/**
 * Filters a list of files to only allow those with the provided extension
 */
function filterFiles(fileList, extension) {
    if (fileList != null && fileList != undefined && fileList.length > 0) {
        fileList = fileList.filter((file) => {
            const fileNamePieces = file.name.split(".")
            return fileNamePieces[fileNamePieces.length - 1] === extension
        })
    }
    return fileList
}


/**
 * Writes the file name and content of a single file to the fileNameContentMap
 */
function writeFile(file) {
    const reader = new FileReader();
    reader.onload = function (readEvent) {
        fileNameContentMap.set(file.name, readEvent.target.result);
        drawUI()
    };
    reader.readAsText(file);

}



/**
 * Reforms the fileList from the multiselect to an actual array
 */
function toArray(fileList) {
    if (fileList != null && fileList != undefined) {
        return Array.from(fileList)
    }
    return []
}

/**
 * Copies the content of the bundlesJS output to clipboard
 */
function copy(){
        var range = document.createRange();
        range.selectNode(document.getElementById("bundledJS"))
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        selection.removeAllRanges();
}


/**
 * Updates the UI 
 */
function drawUI(){
    let names = "";
    for (let [name, fileContent] of fileNameContentMap.entries()) {
        names += name + ", "
    }
    names = names.substring(0, Math.max(0,names.length-2));
    var namesElement = document.getElementById("fileCount4");
    var countElement = document.getElementById("fileCount2");
    namesElement.innerText = names;
    countElement.innerText = '(' + fileNameContentMap.size + ')';
}



/**
 * Gets and displays all concattenated JS from all loaded files
 */
function bundle(){
    /* All content */
    var bundledJSPanel = document.getElementById("bundledJS");
    let allContent = '';
    for (let [name, fileContent] of fileNameContentMap.entries()) {
        allContent += fileContent + '\n\n';
    }

    /* Check checkboxes */
    const removeWhitelines = document.getElementById("removeWhitelines").checked;
    const removeComments = document.getElementById("removeComments").checked;
    const removeLogs = document.getElementById("removeLogs").checked;

    /* Perform filders */
   // allContent = addSemicolons(allContent)
    allContent = removeComments ? this.removeComments(allContent) : allContent;
    allContent = removeLogs ? this.removeLogs(allContent) : allContent;
    allContent = removeWhitelines ? this.removeWhitelines(allContent) : allContent;

    bundledJSPanel.innerText = allContent
}



function removeWhitelines(content){ 
    return content.replace(/^\s*[\r\n]/gm, '');
}

function removeComments(content){
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        content = content.replace(/\/\/.*(?:\r\n|\r|\n|$)/g, '');
        return content;
}

function removeLogs(content){
    return content.replace(/console\.log\([^\)]*\);?/g, '');
}



function addSemicolons(content) {
  const regex = /\b\w+\([^;()]*\)(?![;\s,)]|\s*[\w\)])\b/g;
   content = content.replace(regex, match => {
    if (match.includes('(')) {
      return match;
    } else {
      return `${match};`;
    }
  });
  return content;
}