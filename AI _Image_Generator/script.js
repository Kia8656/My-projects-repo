
// This line grabs the special toolbox (called a "library")
// that knows how to talk to Hugging Face for us.
// Think of it like borrowing a translator who speaks "Hugging Face language".
import { InferenceClient } from "https://esm.sh/@huggingface/inference";

// -----------------------------------------------
// STEP 1: Find all the buttons and boxes on the page
// -----------------------------------------------
// document.querySelector() is like saying:
// "Hey webpage, find me the thing with this label (class/id) and give it to me."
// We save each one into a variable (a labeled box) so we can use it later.

const themeToggle = document.querySelector('.theme-toggle');   // the sun/moon button (light/dark mode)
const promptForm = document.querySelector('.prompt-form');     // the whole form (the box that holds everything)
const promptInput = document.querySelector('.prompt-input');   // the big text box where you type what you want
const promptBtn = document.querySelector('.prompt-btn');       // the dice button (gives a random idea)
const modelSelect = document.getElementById('model-select');   // the dropdown to pick which AI model to use
const countSelect = document.getElementById('count-select');   // the dropdown to pick how many images to make
const ratioSelect = document.getElementById('ratio-select');   // the dropdown to pick the image shape (square, wide, tall)
const gridGallery = document.querySelector('.gallery-grid');   // the empty area where finished pictures will appear

// -----------------------------------------------
// STEP 2: Your secret key (like a password) to use Hugging Face
// -----------------------------------------------
// This key proves to Hugging Face that it's really you asking.
// NEVER share this with people you don't trust!
const API_KEY = "REMOVED_TOKEN";

// -----------------------------------------------
// STEP 3: Create one "client" - think of it as a phone
// that we use to call Hugging Face every time we need an image.
// We only need to set it up once, then reuse it.
// -----------------------------------------------
const client = new InferenceClient(API_KEY);

// -----------------------------------------------
// STEP 4: A list of example ideas
// -----------------------------------------------
// This is just a list (called an "array") of ready-made sentences.
// When you click the dice button, we pick one of these at random.
const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
];

// -----------------------------------------------
// STEP 5: Set the theme (light or dark) when the page first opens
// -----------------------------------------------
// This code runs by itself immediately, one single time,
// as soon as the page loads (that's what the () at the very end does - it runs itself).
(() => {
  // Check if we saved a theme choice before (from last time you visited)
  const savedTheme = localStorage.getItem("theme");

  // Check what the user's computer/phone prefers (some people set dark mode everywhere)
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Decide: use the saved theme if we have one, otherwise follow the computer's preference
  const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);

  // Add or remove the "dark-theme" label on the page depending on the answer
  document.body.classList.toggle('dark-theme', isDarkTheme);

  // Change the little icon on the button: sun icon for dark mode (click to go light),
  // moon icon for light mode (click to go dark)
  themeToggle.querySelector('i').className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

// -----------------------------------------------
// STEP 6: What happens when you CLICK the theme button
// -----------------------------------------------
const toggleTheme = () => {
  // Flip the dark theme on/off, and remember whether it's now ON or OFF
  const isDarkTheme = document.body.classList.toggle('dark-theme');

  // Save that choice so it's still dark/light next time you open the page
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");

  // Update the icon to match
  themeToggle.querySelector('i').className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

// -----------------------------------------------
// STEP 7: Turn a ratio like "16/9" into real pixel sizes
// -----------------------------------------------
// aspectRatio comes in as text like "1/1" or "16/9".
// We need actual numbers (like 512 x 512) to tell the AI how big to make the picture.
const getImageDimensions = (aspectRatio, baseSize = 512) => {
  // Split "16/9" into two separate numbers: width = 16, height = 9
  const [width, height] = aspectRatio.split("/").map(Number);

  // Math to figure out how to scale those small numbers (like 16 and 9)
  // up into real pixel sizes, while keeping the SAME shape (proportions)
  const scaleFactor = baseSize / Math.sqrt(width * height);

  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);

  // AI models usually need width and height to be multiples of 16
  // (like 512, 528, 544...) - this rounds our numbers down to fit that rule.
  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

  // Send back both numbers together, packed in a little box (an "object")
  return { width: calculatedWidth, height: calculatedHeight };
};

// -----------------------------------------------
// STEP 8: Update ONE picture card once we know if it worked or failed
// -----------------------------------------------
// "index" tells us WHICH card to update (card 0, card 1, card 2...)
// "status" tells us if it worked ("success") or not ("error")
// "imageUrl" is the finished picture's address (only exists if it worked)
const updateImageCard = (index, status, imageUrl = null) => {
  // Find the exact card on the page using its ID, e.g. "img-card-0"
  const card = document.getElementById(`img-card-${index}`);

  // Safety check: if for some reason the card doesn't exist, just stop here
  if (!card) return;

  if (status === "success") {
    // Remove the "loading" and "error" look
    card.classList.remove("loading", "error");
    // Put the real picture into the <img> tag inside this card
    card.querySelector(".result-img").src = imageUrl;
  } else {
    // Something went wrong - remove "loading", add "error" look instead
    card.classList.remove("loading");
    card.classList.add("error");
    // Change the little text under the warning icon
    card.querySelector(".status-text").textContent = "Failed to generate";
  }
};

// -----------------------------------------------
// STEP 9: Actually ask Hugging Face to make the pictures
// -----------------------------------------------
// This function does the real work of talking to the AI.
// "async" means "this takes some time, don't freeze the page while waiting."
const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
  // First, figure out the pixel width/height we need
  const { width, height } = getImageDimensions(aspectRatio);

  // We need to make MULTIPLE pictures (however many the user picked).
  // Array.from({ length: imageCount }, ...) is like saying:
  // "Do this next block of code once for EACH picture we need (0, 1, 2, 3...)"
  const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
    // "_" means "we don't care about this value", "i" is the picture's number (0, 1, 2...)
    try {
      // Ask the AI to make ONE picture, and WAIT here until it's ready
      // (this is the actual "phone call" to Hugging Face)
      const imageBlob = await client.textToImage({
        model: selectedModel,      // which AI model to use
        inputs: promptText,        // what you typed (your idea)
        parameters: { width, height }, // how big the picture should be
      });

      // The picture comes back as raw data (a "blob").
      // This line turns that raw data into a web address our <img> tag can show.
      const imageUrl = URL.createObjectURL(imageBlob);

      // Tell the matching card: "You're done! Here's your picture!"
      updateImageCard(i, "success", imageUrl);

    } catch (error) {
      // If ANYTHING went wrong above (no internet, no credits, bad model...),
      // the code jumps straight down here instead of crashing the whole page.

      // Print the error in the browser console so we (the developers) can see what happened
      console.log(error);

      // Tell the matching card: "Sorry, this one failed."
      updateImageCard(i, "error");
    }
  });

  // Wait for ALL the pictures to finish (success or fail, doesn't matter),
  // before this whole function is considered "done".
  await Promise.allSettled(imagePromises);
};

// -----------------------------------------------
// STEP 10: Draw empty "loading" cards on the screen right away
// -----------------------------------------------
// We show spinning loading cards FIRST (instantly),
// and THEN go fetch the real pictures - so the page never feels frozen.
const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
  // Clear out any old pictures from a previous search
  gridGallery.innerHTML = "";

  // Make one empty "loading" card for each picture we're about to generate
  for (let i = 0; i < imageCount; i++) {
    gridGallery.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
        <img src="" class="result-img" alt="Generated image">
        <div class="img-overlay">
          <button class="img-download-btn">
            <i class="fa-solid fa-download"></i>
          </button>
        </div>
      </div>`;
  }

  // NOW go actually generate the real pictures (this happens in the background)
  generateImages(selectedModel, imageCount, aspectRatio, promptText);
};

// -----------------------------------------------
// STEP 11: What happens when you click the "Generate" button
// -----------------------------------------------
const handleFormSubmit = (e) => {
  // Stop the page from doing its normal "refresh the whole page" behavior
  // (forms usually do that, but we don't want that here)
  e.preventDefault();

  // Read whatever the user picked/typed in each box
  const selectedModel = modelSelect.value;               // which AI model
  const imageCount = parseInt(countSelect.value) || 1;    // how many pictures (default to 1 if empty)
  const aspectRatio = ratioSelect.value || "1/1";         // what shape (default to square if empty)
  const promptText = promptInput.value.trim();            // the typed idea, with extra spaces removed

  // Start the whole picture-making process with these choices
  createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};

// -----------------------------------------------
// STEP 12: What happens when you click the dice button
// -----------------------------------------------
promptBtn.addEventListener('click', () => {
  // Pick a random number between 0 and the end of our examplePrompts list
  const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];

  // Put that random idea into the text box
  promptInput.value = prompt;

  // Put the cursor into the text box so it's ready for the user to edit
  promptInput.focus();
});

// -----------------------------------------------
// STEP 13: Connect our functions to the actual buttons
// -----------------------------------------------
// "addEventListener" means: "when this thing happens (like a click),
// run this function."
promptForm.addEventListener('submit', handleFormSubmit); // when the form is submitted (Generate clicked)
themeToggle.addEventListener('click', toggleTheme);       // when the sun/moon button is clicked