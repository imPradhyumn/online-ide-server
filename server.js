import Express from "express";
import fs from "fs";
import child_process from "child_process";
import { parseCode } from "./python-parser.js";

var app = Express();

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.post("/", function (req, res) {
  let data = req.body.data;
  const chosenLangage = req.body.data.chosenLanguage;

  let output;
  let syntaxErr = "";
  let fileName = "";
  let runtime;
  let parser = {};

  function createScriptFile(extension, codeToExecute) {
    let fileName = "script" + extension;
    fs.writeFileSync(fileName, codeToExecute, function (err) {
      if (err) throw err;
    });
    return fileName;
  }

  function checkSyntax(runtime, fileName) {
    child_process.exec(
      `${runtime} ${fileName}`,
      { timeout: 1000 },
      (err, stdout, stderr) => {
        syntaxErr = stderr;
      }
    );
  }

  function runScript(runtime, fileName) {
    child_process.exec(`${runtime} ${fileName}`, (err, stdout, stderr) => {
      res.status(200).send({ stdout, stderr });
    });
  }

  function runJavaCode(codeToExecute) {
    const fileName = "Demo.java";
    fs.writeFileSync(fileName, codeToExecute, function (err) {
      if (err) throw err;
    });

    child_process.exec(`javac ${fileName}`, (err, stdout, stderr) => {
      if (stderr === '') {
        child_process.exec(`java Demo`, (err, stdout, stderr) => {
          res.status(200).send({ stdout, stderr });
        })
      }
      else res.status(400).send({ stderr, stdout });
    })
  }

  function removeFile() {
    fs.unlinkSync(fileName, (err) => {
      if (err) throw err;
      console.log("path/file.txt was deleted");
    });
  }
  
  switch (chosenLangage) {
    case "python":
      const args = req.body.data.userInputs || "";

      runtime = "python";
      fileName = createScriptFile(".py", data.code);
      checkSyntax(runtime, fileName);

      if (syntaxErr == "") {
        parser = parseCode(data.code, args);
        if (parser.parseError != "") {
          syntaxErr = parser.parseError;
          break;
        }

        removeFile(fileName);
        fileName = createScriptFile(".py", parser.parsedCode); //overwrite file with parsed code
      }
      break;

    case "javascript":
      runtime = "node";
      fileName = createScriptFile(".js", data.code);
      break;

    case "java":
      runJavaCode(data.code);
      return;

    default:
      output = "Language not supported yet !!";
      res.status(200).send({ stdout: output });
      break;
  }

  if (fileName === "") return;

  if (syntaxErr !== "") {
    res.status(200).send({ stdout: "", stderr: syntaxErr });
    return;
  }

  runScript(runtime, fileName);
});

app.listen(3000);
