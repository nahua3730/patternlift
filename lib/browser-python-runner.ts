export type BrowserPythonExample = {
  label: string;
  argsExpression: string;
  expectedExpression: string;
};

export type BrowserPythonResult = {
  label: string;
  actual: unknown;
  expected: unknown;
};

export function runPythonInBrowser({
  code,
  functionName,
  examples
}: {
  code: string;
  functionName: string;
  examples: BrowserPythonExample[];
}) {
  const parsedExamples = examples.map((example) => ({
    label: example.label,
    args: evaluateExpression(example.argsExpression) as unknown[],
    expected: evaluateExpression(example.expectedExpression)
  }));

  return new Promise<BrowserPythonResult[]>((resolve, reject) => {
    const worker = new Worker("/python-runner.worker.js");
    const timeout = window.setTimeout(() => {
      worker.terminate();
      reject(new Error("Python took too long to finish. Check for an infinite loop and try again."));
    }, 20_000);

    worker.onmessage = (event: MessageEvent<{ results?: BrowserPythonResult[]; error?: string }>) => {
      window.clearTimeout(timeout);
      worker.terminate();
      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }
      resolve(event.data.results ?? []);
    };
    worker.onerror = () => {
      window.clearTimeout(timeout);
      worker.terminate();
      reject(new Error("The Python runtime could not load. Check your connection and try again."));
    };
    worker.postMessage({ code, functionName, examples: parsedExamples });
  });
}

function evaluateExpression(expression: string) {
  return new Function(`return (${expression});`)();
}
