function runCode(code) {
    js = compileCode(code);
    sendOutput("\n------------------\nRUNNING PROGRAM...\n------------------\n");
    eval(js);
}

function compileCode(code) {
    // Verify code does not contain illegal tokens by rming the legal ones
    // This does not check that tokens are ordered properly
    strippedCode = code .replaceAll(/"(|.*?[^\\])"/g, "")   // strings (\" escapes quotes)
                        .replaceAll(/[\s\r\n]+/g, "")       // whitespace
                        .replaceAll(/var(10|[1-9])/g, "")   // variables
                        .replaceAll(/[0-9]+/g, "")          // ints
                        .replaceAll("array()", "")          // arrays (parens will be empty by now)
                        .replaceAll(/[><=\*\/\+-]/g, "")    // > < = * / + -
                        // everything else
                        .replaceAll(/IF|THEN|TO|STEP|END|LOOP|WHILE|READ|WRITE/g, "");

    if (strippedCode.length != 0) {
        sendOutput("\nERROR: ILLEGAL TOKEN(S):");
        sendOutput(strippedCode);
        return;
    }

    
    // Compile to JS with a bunch more regex! yay!

    // Temporarily remove strings
    var strLiterals = [];
    var str;
    const strRegex = /"(|.*?[^\\])"/g;
    do {
        str = strRegex.exec(code);
        if (str) strLiterals.push(str[0]);
    }
    while (str);

    var n = 0;
    code = code.replaceAll(strRegex, () => "strLiterals[" + (n++) + "]");

    // Collect the vars used to declare them later
    var usedVars = [];
    var usedVar = [];
    const varRegex = /(var(?:10|[1-9]))/g;
    do {
        usedVar = varRegex.exec(code);
        if (usedVar && !usedVars.includes(usedVar[0]))
            usedVars.push(usedVar[0]);
    }
    while (usedVar);

    // Determine if an array is used, and replace () with [] if so
    var arrayUsed = /array/g.test(code);
    if (arrayUsed) code = code.replaceAll("(", "[").replaceAll(")", "]");

    // Do all the easy replacements
    code = code .replaceAll(/IF(.*?)THEN(.*?)([\r\n]|$)+/g, "if ($1) $2;")
                .replaceAll(/(var(?:10|[1-9])\s*)=(.*?)TO(.*?)STEP(.*?)([\r\n]|$)+/g,
                            "for (let $1=$2; ($1<=$3 && $4>=0) || ($1>=$3 && $4<0); $1+=$4) {\n")
                .replaceAll("END LOOP", "}")
                .replaceAll(/LOOP.+?WHILE(.*?)([\r\n]|$)+/g, "while ($1) {\n")
                .replaceAll(/READ (.*?)([\r\n]|$)+/g, "$1 = getInput();\n")
                .replaceAll(/WRITE (.*?)([\r\n]|$)+/g, "sendOutput($1);\n");

    // Add strings back in
    if (strLiterals.length > 0) {
        for (let i = 0; i < strLiterals.length; i++) {
            code = code.replaceAll("strLiterals[" + i + "]", strLiterals[i]);
        }
    }

    // Declare vars
    if (usedVars.length > 0) {
        let usedVarsInit = "var ";
        for (usedVar of usedVars) usedVarsInit += usedVar + ", ";
        usedVarsInit = usedVarsInit.substring(0, usedVarsInit.length - 2) + ";\n";
        code = usedVarsInit + code;
    }

    // Declare array if necessary
    if (arrayUsed) code = "var array = [];\n" + code;

    clearOutput();
    sendOutput(code);
    return code;
}