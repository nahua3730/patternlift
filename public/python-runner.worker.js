const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
let pyodidePromise;

function getPyodide() {
  if (!pyodidePromise) {
    importScripts(`${PYODIDE_INDEX_URL}pyodide.js`);
    pyodidePromise = self.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
  }
  return pyodidePromise;
}

self.onmessage = async (event) => {
  const { code, functionName, examples } = event.data;

  try {
    const pyodide = await getPyodide();
    const payload = JSON.stringify({ functionName, examples });
    const script = `${code}

import json

payload = json.loads(${JSON.stringify(payload)})
candidate = globals().get(payload["functionName"])

if not callable(candidate):
    raise Exception("I couldn't find a function named ${functionName}.")

def to_jsonable(value):
    if isinstance(value, tuple):
        return [to_jsonable(item) for item in value]
    if isinstance(value, list):
        return [to_jsonable(item) for item in value]
    if isinstance(value, dict):
        return {str(key): to_jsonable(val) for key, val in value.items()}
    return value

results = []
for example in payload["examples"]:
    actual = candidate(*example["args"])
    results.append({
        "label": example["label"],
        "actual": to_jsonable(actual),
        "expected": example["expected"],
    })

__patternlift_results_json = json.dumps(results)
`;

    await pyodide.runPythonAsync(script);
    const output = pyodide.globals.get("__patternlift_results_json");
    self.postMessage({ results: JSON.parse(String(output)) });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const conciseMessage = rawMessage.split("\n").slice(-3).join("\n").trim();
    self.postMessage({ error: conciseMessage || "Python could not run this solution." });
  }
};
