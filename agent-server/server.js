const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// POST /run endpoint
// Accepts JSON: { files: [{ path, content }], commands: ["cmd1", "cmd2"] }
// Creates files in project/ directory, executes commands in project/ directory
// Returns { success: boolean, logs: string }
app.post('/run', (req, res) => {
  // Authorization check
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.AGENT_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  const { files, commands } = req.body;
  let logs = '';
  let success = true;

  const projectDir = path.join(__dirname, 'project');

  try {
    // Ensure project directory exists
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
      logs += `Created project directory: ${projectDir}\n`;
    }

    // Write files
    if (files) {
      for (const file of files) {
        const filePath = path.resolve(projectDir, file.path);
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, file.content);
        logs += `Wrote file: ${file.path}\n`;
      }
    }

    // Execute commands in project directory
    if (commands) {
      for (const cmd of commands) {
        try {
          const output = execSync(cmd, { cwd: projectDir, encoding: 'utf8', stdio: 'pipe' });
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
  console.log(`Agent server listening on port ${PORT}`);
  console.log("AGENT_SECRET loaded:", !!process.env.AGENT_SECRET);
});