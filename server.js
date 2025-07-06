import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/generate', (req, res) => {
  exec('node ./index.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send('Error generating image');
    }
    if (stderr) console.error(`stderr: ${stderr}`);

    // Supongamos que tu script guarda 'output.png' en el mismo directorio
    const filePath = path.join(__dirname, './weather.png');
    res.sendFile(filePath);
  });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

