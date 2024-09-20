

let bundledMap = new Map();
let dependenciesSortedBundledMap = []
let dependencyGraph;



function handleFileSelect(event) {
    /* to array */
    let files = toArray(event.target.files)

    /* filter onm .js only */
    files = filterFiles(files, "js");

    /* Write filename & contents to map */
    writeFiles(files);
}



/**
 * Returns for a filename the name without extension
 */
function getNameFromFileName(fileName) {
    let filenamePieces = fileName.split(".")
    let retval = "";
    for (let i = 0; i <= filenamePieces.length - 2; i++) {
        retval += filenamePieces[i];
    }
    return retval
}

/**
 * Writes the file names and content of all files to the fileNameContentMap
 */
function writeFiles(files) {
    if (files != null && files != undefined && files.length > 0) {
        for (let file of files) {
            writeFile(file);
        }
    }
}


/**
 * Writes the file name and content of a single file to the fileNameContentMap
 */
function writeFile(file) {
    const reader = new FileReader();
    reader.onload = function (readEvent) {
        bundledMap.set(file.name, readEvent.target.result);
        configureDependencies()
        drawUI()
    };
    reader.readAsText(file);
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
function copy() {
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
function drawUI() {
    let names = "";
    for (let [name, fileContent] of bundledMap.entries()) {
        names += name + ", "
    }
    names = names.substring(0, Math.max(0, names.length - 2));
    var namesElement = document.getElementById("fileCount4");
    var countElement = document.getElementById("fileCount2");
    namesElement.innerText = names;
    countElement.innerText = '(' + bundledMap.size + ')';
}



/**
 * Gets and displays all concattenated JS from all loaded files
 */
function bundle() {
    /* All content */
    var bundledJSPanel = document.getElementById("bundledJS");
    let allContent = '';

    for (let fileName of dependenciesSortedBundledMap) {
        allContent += bundledMap.get(fileName) + '\n\n';
    }


    /* Check checkboxes */
    const removeWhitelines = document.getElementById("removeWhitelines").checked;
    const removeComments = document.getElementById("removeComments").checked;
    const removeLogs = document.getElementById("removeLogs").checked;
    const wrap_const = (document.getElementById("wrap-const").checked && document.getElementById("wrap-const-name").value != null && document.getElementById("wrap-const-name").value != "");
    const wrap_const_name = wrap_const ? document.getElementById("wrap-const-name").value : null;

    /* Perform filders */
    //allContent = addSemicolons(allContent)
    allContent = removeComments ? this.removeComments(allContent) : allContent;
    allContent = removeLogs ? this.removeLogs(allContent) : allContent;
    allContent = removeWhitelines ? this.removeWhitelines(allContent) : allContent;
    allContent = wrap_const ? this.wrap_content(allContent, wrap_const_name) : allContent;

    bundledJSPanel.innerText = allContent
}



function removeWhitelines(content) {
    return content.replace(/^\s*[\r\n]/gm, '');
}

function removeComments(content) {
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    content = content.replace(/\/\/.*(?:\r\n|\r|\n|$)/g, '');
    return content;
}

function removeLogs(content) {
    return content.replace(/console\.log\([^\)]*\);?/g, '');
}

function addSemicolons(content) {
    const regex = /\b\w+\([^;()]*\)(?![;\s,])/g;
    return content.replace(regex, match => `${match};`);
}

/**
 * wraps the bundles javascript in a single constant with a provided name.
 */
function wrap_content(content, const_name) {
    console.warn("wrap_content is not yet implemented")
    return content;
}

/**
* Structures the files so that all dependencies are ordered correctly
*/
function configureDependencies() {
    /* Graph creation */
    let graph = new Map();
    let maxPopularity = 0;
    for (let [filename, content] of bundledMap) {
        let dependencies = []
        let popularity = 0;
        for (let [innerFileName, innerContent] of bundledMap) {
            if (content.includes(getNameFromFileName(innerFileName)) && filename !== innerFileName) {
                dependencies.push(innerFileName)
                popularity++;
            }
        }
        // Find start node
        if (popularity > maxPopularity) {
            startNodeKey = filename
            maxPopularity = popularity
        }
        graph.set(filename, dependencies)
    }

    /* Build correctly configured map */
    let dependenciesList = []
    for (let [filename, dependencies] of graph) {
        dependenciesList.push([filename, dependencies])
    }

    dependencyGraph = graph;
    dependenciesSortedBundledMap = topologicalSort(dependenciesList);

}

function topologicalSort(graph) {
    const visited = new Set();
    const result = [];
    function dfs(node) {
        if (visited.has(node)) return;
        visited.add(node);

        let next = graph.filter(it => it[0] == node)[0]
        for (const dependency of next[1]) {
            dfs(dependency);
        }
        result.push(node);
    }
    for (const [node] of graph) {
        dfs(node);
    }
    return result //.reverse();
}