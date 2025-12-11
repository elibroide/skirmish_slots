import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
});

app.post('/api/claude', async (req, res) => {
  try {
    const { model, max_tokens, temperature, system, messages } = req.body;

    if (!process.env.CLAUDE_API_KEY) {
      return res.status(500).json({ 
        error: { message: 'Claude API key not configured' } 
      });
    }

    const message = await anthropic.messages.create({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: max_tokens || 1024,
      temperature: temperature ?? 0.7,
      system,
      messages,
    });

    res.json({
      content: message.content,
      usage: message.usage,
    });
  } catch (error: any) {
    console.error('Claude API error:', error);
    res.status(500).json({ 
      error: { 
        message: error.message || 'Failed to call Claude API' 
      } 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.CLAUDE_API_KEY });
});

app.listen(PORT, () => {
  console.log(`🤖 Claude proxy server running on http://localhost:${PORT}`);
  console.log(`API Key configured: ${!!process.env.CLAUDE_API_KEY}`);
});

