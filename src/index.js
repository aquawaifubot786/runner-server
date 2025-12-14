const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// GET / endpoint for browser test
app.get('/', (req, res) => {
  res.send('Runner server is live!');
});

// POST /execute endpoint
// Accepts JSON: { files: [{ path, content }], commands: ["cmd1", "cmd2"] }
// Writes files to disk, executes commands sequentially, captures logs, returns { success: boolean, logs: string }
app.post('/execute', (req, res) => {
  const { files, commands } = req.body;
  let logs = '';
  let success = true;

  try {
    // Write files
    if (files) {
      for (const file of files) {
        const filePath = path.resolve(file.path);
        fs.writeFileSync(filePath, file.content);
        logs += `Wrote file: ${file.path}\n`;
      }
    }

    // Execute commands
    if (commands) {
      for (const cmd of commands) {
        try {
          const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
          logs += `Executed: ${cmd}\n${output}\n`;
        } catch (error) {
          success = false;
          logs += `Error executing: ${cmd}\n${error.stdout || ''}${error.stderr || error.message}\n`;
        }
      }
    }
  } catch (error) {
    success = false;
    logs += `General error: ${error.message}\n`;
  }

  res.json({ success, logs });
});

app.listen(PORT, () => {
  console.log(`Runner server listening on port ${PORT}`);
});

// Instructions:
// To start the server: node index.js
// Test GET /: Open http://localhost:3000 in browser, should see "Runner server is live!"
// Test POST /execute: Use curl or Postman with JSON body as above
