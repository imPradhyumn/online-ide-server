export function parseCode(code, args = "") {
  code = code.split("\n");

  if (args != []) args = args.split("\n");

  let parsedCode = "";
  let i = 0;
  for (let expression of code) {
    let temp = "";
    if (expression.includes("input")) {
      if (args.length == 0)
        return { parseError: "No inputs were found!!", parsedCode: "" };

      temp = expression.split("=")[0];
      temp = temp + "=" + args[i++];
      parsedCode += temp + "\n";
      temp = "";
    } else parsedCode += expression + "\n";
  }
  return { parseError: "", parsedCode };
}
