// -----------------------------------------------
// STEP 1: Find all the buttons and boxes on the page
// -----------------------------------------------
const themeToggle = document.querySelector('.theme-toggle');   // the sun/moon button (light/dark mode)
const promptForm = document.querySelector('.prompt-form');     // the whole form (the box that holds everything)
const promptInput = document.querySelector('.prompt-input');   // the big text box where you type what you want
const promptBtn = document.querySelector('.prompt-btn');       // the dice button (gives a random idea)
const modelSelect = document.getElementById('model-select');   // the dropdown to pick which AI model to use
const countSelect = document.getElementById('count-select');   // the dropdown to pick how many images to make
const ratioSelect = document.getElementById('ratio-select');   // the dropdown to pick the image shape (square, wide, tall)
const gridGallery = document.querySelector('.gallery-grid');   // the empty area where finished pictures will appear

// -----------------------------------------------
// STEP 2: A list of example ideas
// -----------------------------------------------
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
// STEP 3: Set the theme (light or dark) when the page first opens
// -----------------------------------------------
(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
  document.body.classList.toggle('dark-theme', isDarkTheme);
  themeToggle.querySelector('i').className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

// -----------------------------------------------
// STEP 4: What happens when you CLICK the theme button
// -----------------------------------------------
const toggleTheme = () => {
  const isDarkTheme = document.body.classList.toggle('dark-theme');
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  themeToggle.querySelector('i').className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

// -----------------------------------------------
// STEP 5: Turn a ratio like "16/9" into real pixel sizes
// -----------------------------------------------
const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);

  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);

  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

  return { width: calculatedWidth, height: calculatedHeight };
};

// -----------------------------------------------
// STEP 6: Update ONE picture card once we know if it worked or failed
// -----------------------------------------------
const updateImageCard = (index, status, imageUrl = null) => {
  const card = document.getElementById(`img-card-${index}`);
  if (!card) return;

  if (status === "success") {
    card.classList.remove("loading", "error");
    card.querySelector(".result-img").src = imageUrl;
  } else {
    card.classList.remove("loading");
    card.classList.add("error");
    card.querySelector(".status-text").textContent = "Failed to generate";
  }
};

// -----------------------------------------------
// STEP 7: Ask OUR OWN SERVER to make the pictures
// -----------------------------------------------
// Instead of calling Hugging Face directly (which needed the secret token
// right here in the browser), we now call our own "/api/generate-image"
// endpoint. That endpoint holds the token safely on the server and does
// the real Hugging Face call for us.
const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
  const { width, height } = getImageDimensions(aspectRatio);

  const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
    try {
      // Send our request to OUR server instead of Hugging Face directly.
      // fetch() with method "POST" means "here's some data, please process it."
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          prompt: promptText,
          width,
          height,
        }),
      });

      // If our server responded with an error status, treat it as a failure.
      if (!response.ok) {
        throw new Error("Server responded with an error");
      }

      // Our server sends back JSON like: { image: "data:image/png;base64,...." }
      const data = await response.json();

      // data.image is already a ready-to-use image address (a "data URL"),
      // so we can use it directly - no need for URL.createObjectURL anymore.
      updateImageCard(i, "success", data.image);

    } catch (error) {
      console.log(error);
      updateImageCard(i, "error");
    }
  });

  await Promise.allSettled(imagePromises);
};

// -----------------------------------------------
// STEP 8: Draw empty "loading" cards on the screen right away
// -----------------------------------------------
const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
  gridGallery.innerHTML = "";

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

  generateImages(selectedModel, imageCount, aspectRatio, promptText);
};

// -----------------------------------------------
// STEP 9: What happens when you click the "Generate" button
// -----------------------------------------------
const handleFormSubmit = (e) => {
  e.preventDefault();

  const selectedModel = modelSelect.value;
  const imageCount = parseInt(countSelect.value) || 1;
  const aspectRatio = ratioSelect.value || "1/1";
  const promptText = promptInput.value.trim();

  createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};

// -----------------------------------------------
// STEP 10: What happens when you click the dice button
// -----------------------------------------------
promptBtn.addEventListener('click', () => {
  const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  promptInput.value = prompt;
  promptInput.focus();
});

// -----------------------------------------------
// STEP 11: Connect our functions to the actual buttons
// -----------------------------------------------
promptForm.addEventListener('submit', handleFormSubmit);
themeToggle.addEventListener('click', toggleTheme);