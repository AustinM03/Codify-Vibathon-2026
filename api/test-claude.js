import Anthropic from '@anthropic-ai/sdk'
import { MODELS } from './models.js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async function handler(req, res) {
  try {
    const message = await client.messages.create({
      model: MODELS.FAST,
      max_tokens: 64,
      messages: [
        {
          role: 'user',
          content: 'Please say exactly: "Prism AI connection successful!"',
        },
      ],
    })

    const text = message.content[0].text
    console.log('Claude response:', text)

    return res.status(200).json({ success: true, message: text })
  } catch (error) {
    console.error('Claude error:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
