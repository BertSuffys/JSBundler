let bundledMap = new Map();
let dependenciesSortedBundledMap = []
let dependencyGraph;
initCheckboxAllToggler();

function handleFileSelect(event) {
    // to array 
    let files = toArray(event.target.files)
    // filter onm .js only 
    files = filterFiles(files, "js");
    // Write filename & contents to map 
    writeFiles(files);
}

function getNameFromFileName(fileName) {
    let filenamePieces = fileName.split(".")
    let retval = "";
    for (let i = 0; i <= filenamePieces.length - 2; i++) {
        retval += filenamePieces[i];
    }
    return retval
}

function writeFiles(files) {
    if (files != null && files != undefined && files.length > 0) {
        for (let file of files) {
            writeFile(file);
        }
    }
}

function writeFile(file) {
    const reader = new FileReader();
    reader.onload = function (readEvent) {
        bundledMap.set(file.name, readEvent.target.result);
        configureDependencies()
        drawUI()
    };
    reader.readAsText(file);
}

function filterFiles(fileList, extension) {
    if (fileList != null && fileList != undefined && fileList.length > 0) {
        fileList = fileList.filter((file) => {
            const fileNamePieces = file.name.split(".")
            return fileNamePieces[fileNamePieces.length - 1] === extension
        })
    }
    return fileList
}

function toArray(fileList) {
    if (fileList != null && fileList != undefined) {
        return Array.from(fileList)
    }
    return []
}

function copy() {
    var range = document.createRange();
    range.selectNode(document.getElementById("bundledJS"))
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();
}

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

function bundle() {
    // All content
    var bundledJSPanel = document.getElementById("bundledJS");
    let allContent = '';
    for (let fileName of dependenciesSortedBundledMap) {
        allContent += bundledMap.get(fileName) + '\n\n';
    }
    // Check checkboxes
    const removeWhitelines = document.getElementById("removeWhitelines").checked;
    const removeComments = document.getElementById("removeComments").checked;
    const removeLogs = document.getElementById("removeLogs").checked;
    const wrap_const_insert = (document.getElementById("wrap-const-insert").checked && document.getElementById("wrap-const-insert-name").value != null && document.getElementById("wrap-const-insert-name").value != "");
    const wrap_const_insert_name = wrap_const_insert ? document.getElementById("wrap-const-insert-name").value : null;
    const wrap_const_ref = (document.getElementById("wrap-const-ref").checked && document.getElementById("wrap-const-ref-name").value != null && document.getElementById("wrap-const-ref-name").value != "");
    const wrap_const_ref_name = wrap_const_ref ? document.getElementById("wrap-const-ref-name").value : null;
    // Perform filders
    allContent = removeComments ? this.removeComments(allContent) : allContent;
    allContent = removeLogs ? this.removeLogs(allContent) : allContent;
    allContent = removeWhitelines ? this.removeWhitelines(allContent) : allContent;
    allContent = wrap_const_ref ? this.wrap_content_ref(allContent, wrap_const_ref_name) : allContent;
    allContent = wrap_const_insert ? this.wrap_content_insert(allContent, wrap_const_insert_name) : allContent;
    // Update
    bundledJSPanel.innerText = allContent
}

function initCheckboxAllToggler() {
    const checkbox_all = document.getElementById("all")
    checkbox_all.addEventListener("click", function () {
        const isChecked = checkbox_all.checked;
        const util_checkboxes = document.querySelectorAll(".util-checkbox");
        for (let i = 0; i < util_checkboxes.length; i++) {
            util_checkboxes[i].checked = isChecked;
        }
        document.getElementById("wrap-const-insert-name").value = "myConstInsert"
        document.getElementById("wrap-const-ref-name").value = "myConstRef"
    })
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

function wrap_content_ref(content, const_name) {
    let const_object = `const ${const_name} = {`;
    const_object = addClassesToConstRef(const_object, content);
    const_object = addFunctionsToConstRef(const_object, content);
    const_object = addConstsToConstRef(const_object, content);
    const_object += `\n}`
    return `${content}\n${const_object}`
}

function addConstsToConstRef(const_object, content) {
    const constNames = [];
    // find all instances of "const constName"
    let constFields = []
    let constSplit = content.split("const");
    for(let constSplitItem of constSplit){
        const constNameField = constSplitItem.split(" ")[1]
        if(constNameField != undefined){
            constFields.push("const " + constNameField)
        }   
    }
    // Figure out which are global scoped
    for(let constField of constFields){
        const occurance_index = content.indexOf(constField);
       // console.log("\n\n")
        if(occurance_index != -1){
            let scopeCounter = 0;
            let scoped = false;
            for (let i = occurance_index; i >= 0; i--) {
                const charPointer = content[i]
                if(charPointer == "}"){
                    scopeCounter -- ;
                }else if(charPointer == "{"){
                    scopeCounter ++ ;
                }
                if(scopeCounter > 0){
                    scoped = true;
                    break;
                }
            }
            if(scoped == true){
                continue;
            }
            scopeCounter = -1;
            for (let i = occurance_index; i < content.length; i++) {
                const charPointer = content[i]
                if(charPointer == "{"){
                    scopeCounter -- ;
                }else if(charPointer == "}"){
                    scopeCounter ++ ;
                }
                if(scopeCounter > 0){
                    scoped = true;
                    break;
                }
            }
            if(scoped == false){
                constNames.push(constField.replace("const ",""))
            }
        }
    }
    if (constNames.length > 0) {
        const_object += `,`
    }
    for (let i = 0; i < constNames.length; i++) {
        const_object += `\n${constNames[i]}:${constNames[i]}${i != constNames.length - 1 ? "," : ""}`
    }
    return const_object;
}
function addFunctionsToConstRef(const_object, content) {
    const functionDeclarationRegex = /\bfunction\s+([a-zA-Z_$][a-zA-Z_$0-9]*)\s*\(/g;
    const functionAssignmentRegex = /\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z_$0-9]*)\s*=\s*(?:function|\(.*\)\s*=>|\s*\(\s*\)\s*=>)/g;
    let functionNames = [];
    let match;
    while ((match = functionDeclarationRegex.exec(content)) !== null) {
        functionNames.push(match[1]);
    }
    while ((match = functionAssignmentRegex.exec(content)) !== null) {
        functionNames.push(match[1]);
    }
    if (functionNames.length > 0) {
        const_object += `,`
    }
    for (let i = 0; i < functionNames.length; i++) {
        const_object += `\n${functionNames[i]}:${functionNames[i]}${i != functionNames.length - 1 ? "," : ""}`
    }
    return const_object;
}
function addClassesToConstRef(const_object, content) {
    const classRegex = /\bclass\s+([a-zA-Z_$][a-zA-Z_$0-9]*)/g;
    let classNames = [];
    let match;
    while ((match = classRegex.exec(content)) !== null) {
        classNames.push(match[1]);
    }
    for (let i = 0; i < classNames.length; i++) {
        const_object += `\n${classNames[i]}:${classNames[i]}${i != classNames.length - 1 ? "," : ""}`
    }
    return const_object;
}

function wrap_content_insert(content, const_name) {
    content = parseClasses(content)        // adjust class declarations so they fit within the const
    content = parseFunctions(content)      // adjust function declarations so they fit within the const
    content = parseConsts(content)         // adjust const declarations so they fit within the const
    content = addCommas(content)           // place commas
    return `const ${const_name} = {${content}}`
}

function addCommas(content) {
    let counter = 0;
    let result = '';
    let lastCommaInsertionIndex = -1;
    for (let char of content) {
        if (char === '{') {
            counter++;
        } else if (char === '}') {
            counter--;
            result += char;
            if (counter === 0) {
                result += ',';
                lastCommaInsertionIndex = result.length - 1
            }
            continue;
        }
        result += char;
    }
    if (lastCommaInsertionIndex != -1) {
        result = result.slice(0, lastCommaInsertionIndex) + result.slice(lastCommaInsertionIndex + 1);
    }
    return result;
}

function parseConsts(content) {
    const constRegex = /const\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*\{\s*([^}]*?)\s*\}/g;
    return content.replace(constRegex, (match, constName) => {
        return `${constName}: ${match.split('=')[1].trim()}`;
    });
}

function parseFunctions(content) {
    const functionRegex = /function\s+([a-zA-Z_$][\w$]*)\s*\(/g;
    return content.replace(functionRegex, (match, functionName) => {
        return `${functionName}: function(`;
    });
}

function parseClasses(content) {
    const classRegex = /class\s+([a-zA-Z_$][\w$]*)\s*(extends\s+[a-zA-Z_$][\w$]*)?\s*{/g;
    return content.replace(classRegex, (match, className, extendsClause) => {
        if (extendsClause) {
            return `${className}: class ${extendsClause} {`;
        } else {
            return `${className}: class {`;
        }
    });
}

function configureDependencies() {
    // Graph creation 
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
    // Build correctly configured map
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