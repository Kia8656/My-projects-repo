// This file runs on Vercel's SERVER, never in the browser.
// That's the whole point: process.env.HF_TOKEN only exists here,
// where nobody visiting your website can see it.

import { InferenceClient } from "@huggingface/inference";

// Set up the connection to Hugging Face ONCE, using the token
// stored safely in Vercel's dashboard (not in any file we commit).
const client = new InferenceClient(process.env.HF_TOKEN);

// Vercel calls this function automatically whenever your frontend
// sends a request to "/api/generate-image".
export default async function handler(req, res) {
  // We only want to allow POST requests (sending data), not GET.
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Pull out the info the frontend sent us: which model, what to draw,
  // and what size the image should be.
  const { model, prompt, width, height } = req.body;

  // Basic safety check: make sure we actually got a prompt to work with.
  if (!prompt || !model) {
    return res.status(400).json({ error: "Missing model or prompt" });
  }

  try {
    // This is the EXACT same call your frontend used to make directly.
    // The only difference is it now happens here, safely on the server.
    const imageBlob = await client.textToImage({
      model,
      inputs: prompt,
      parameters: { width, height },
    });

    // Blobs can't be sent as JSON directly, so we convert the image
    // into a long text string (base64) that the browser can turn
    // back into a picture.
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    // Send the image back to the frontend as a ready-to-use data URL.
    res.status(200).json({ image: `data:image/png;base64,${base64Image}` });

  } catch (error) {
    // If Hugging Face fails (bad model name, no credits, etc.),
    // log it on the server and tell the frontend it failed.
    console.log(error);
    res.status(500).json({ error: "Image generation failed" });
  }
}