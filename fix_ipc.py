import re

path = '/Users/finewood/Desktop/spark-project/src/electron/agent-ipc.ts'
with open(path, 'r') as f:
    code = f.read()

if 'import { AIProvider }' not in code:
    code = "import { AIProvider } from '../backend/tools/AIProvider';
" + code

code = re.sub(
    r'const completion = await openai\.chat\.completions\.create\(\{[\s\S]*?\}\);\s*(reply|planText|executeText|evalText|contentStr) = completion\.choices\[0\](?:\?)?\.message(?:\?)?\.content \|\| [^;]*;',
    r"const provider = new AIProvider({ baseUrl: '', apiKey: '', defaultModel: typeof currentModel !== 'undefined' ? currentModel : 'gemini-2.0-flash' });
                \1 = await provider.chat((typeof conversationHistory !== 'undefined' ? conversationHistory : (typeof messages !== 'undefined' ? messages : [])) as any, { model: typeof currentModel !== 'undefined' ? currentModel : 'gemini-2.0-flash', temperature: 0.8 });",
    code
)

with open(path, 'w') as f:
    f.write(code)
