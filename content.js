// Add the necessary script tag for pdf.js dynamically
const pdfScript = document.createElement("script");
pdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js";
document.head.appendChild(pdfScript);


// Create the button
const button = document.createElement("button");
button.innerText = "Submit File";
button.style.backgroundColor = "green";
button.style.color = "white";
button.style.padding = "3px";
button.style.border = "none";
button.style.borderRadius = "3px";
button.style.margin = "3px";

// Create the cancel button
const cancelButton = document.createElement("button");
cancelButton.innerText = "Cancel";
cancelButton.style.backgroundColor = "red";
cancelButton.style.color = "white";
cancelButton.style.padding = "3px";
cancelButton.style.border = "none";
cancelButton.style.borderRadius = "3px";
cancelButton.style.margin = "3px";
let isSubmitting = false;
toggleCancelButton(isSubmitting);
cancelButton.addEventListener("click", cancelSubmission);

// Create the hide/show button
const toggleButton = document.createElement("button");
toggleButton.innerText = "Hide ";
// Button color should be opaque when the panel is hidden
toggleButton.style.backgroundColor = "black";
toggleButton.style.opacity = "0.5";
toggleButton.style.color = "white";
toggleButton.style.padding = "3px";
toggleButton.style.border = "none";
toggleButton.style.borderRadius = "3px";
toggleButton.style.margin = "3px";
toggleButton.addEventListener("click", toggleButtonPanel);

// Create a container for the button and toggle button
const buttonContainer = document.createElement("div");
buttonContainer.style.display = "flex";
buttonContainer.appendChild(button);
buttonContainer.appendChild(cancelButton);
buttonContainer.appendChild(toggleButton);




// Create the progress bar container
const progressContainer = document.createElement("div");
progressContainer.style.width = "99%";
progressContainer.style.height = "5px";
progressContainer.style.backgroundColor = "grey";
progressContainer.style.margin = "3px";
progressContainer.style.borderRadius = "5px";

// Create the progress bar element
const progressBar = document.createElement("div");
progressBar.style.width = "0%";
progressBar.style.height = "100%";
progressBar.style.backgroundColor = "#32a9db";
progressContainer.appendChild(progressBar);

// Create the chunk size input
const chunkSizeInput = createInput("number", "1", "15000");
const timeOutInput = createInput("number", "1", "500");

// Create the time-out label
const timeOutLabel = createLabel("Time-out: ", timeOutInput);

// Create the chunk size label
const chunkSizeLabel = createLabel("Chunk Size: ", chunkSizeInput);

// Create a container for the chunk size and time-out inputs
const inputContainer = document.createElement("div");
inputContainer.style.display = "flex";
inputContainer.appendChild(chunkSizeLabel);
inputContainer.appendChild(timeOutLabel);


const promptLabel = document.createElement("label");
promptLabel.innerText = "Post Prompt Message: ";

const promptTextArea = document.createElement("textarea");
promptTextArea.style.margin = "3px";
// Make the text box end at the end of the line
promptTextArea.style.width = "100%";
promptTextArea.style.height = "28px";
promptTextArea.style.color = "black";
promptTextArea.value = "editable text here";

// Add the label and text area to a container
const promptContainer = document.createElement("div");
// The postPromtLabel should be above the text area
promptContainer.style.flexDirection = "column";
promptContainer.appendChild(promptLabel);
promptContainer.appendChild(promptTextArea);


// Add a click event listener to the button
button.addEventListener("click", async () => {
  // Create the input element
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".txt,.js,.py,.html,.css,.json,.csv,.pdf";

  // Add a change event listener to the input element
  input.addEventListener("change", async () => {
    // Reset progress bar once a new file is inserted
    progressBar.style.width = "0%";
    progressBar.style.backgroundColor = "#32a9db";

    // Read the file as text
    const file = input.files[0];
    const extension = file.name.split(".").pop().toLowerCase();

    // Check the file extension
    if (extension === "pdf") {
      // Handle PDF files separately
      const text = await parsePDF(file);
    } else {
      // Handle other file types
      const text = await file.text();
    }
    // Get the chunk size from the input element
    const chunkSize = parseInt(chunkSizeInput.value);
    // Get the time-out from the input element
    const timeOut = parseInt(timeOutInput.value);

    // Split the text into chunks of the specified size
    const numChunks = Math.ceil(text.length / chunkSize);

    // Set the submission state to true
    isSubmitting = true;
    toggleCancelButton(isSubmitting);

    for (let i = 0; i < numChunks; i++) {
      await new Promise((resolve) => setTimeout(resolve, timeOut));
      const chunk = text.slice(i * chunkSize, (i + 1) * chunkSize);

      // Submit the chunk to the conversation
      await submitConversation(chunk, i + 1, file.name);

      // Update the progress bar
      progressBar.style.width = `${((i + 1) / numChunks) * 100}%`;

      // Check if submission was cancelled
      if (!isSubmitting) {
        break;
      }

      // Wait for ChatGPT to be ready
      let chatgptReady = false;
      while (!chatgptReady) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        chatgptReady = !document.querySelector(
          ".text-2xl > span:not(.invisible)"
        );
      }
    }

    // Finish updating the progress bar
    progressBar.style.backgroundColor = "#32a9db";
  });

  // Click the input element to trigger the file selection dialog
  input.click();
});

// Define the submitConversation function
async function submitConversation(text, part, filename) {
  const textarea = document.querySelector("textarea[tabindex='0']");
  const enterKeyEvent = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    keyCode: 13,
  });
  const promptMessage = promptTextArea.value;
  textarea.value = `Part ${part} of ${filename} answer very briefly. Max 10 words. \n\n${promptMessage}: \n\n ${text}\n\n ${promptMessage}`;
  textarea.dispatchEvent(enterKeyEvent);
}

// Define cancel Submission function
function cancelSubmission() {
  isSubmitting = false;
  toggleCancelButton(isSubmitting);
  progressBar.style.backgroundColor = "#FF0000"; // Update progress bar color to indicate cancellation
}


// Create a container for the button, progress bar, and inputContainer
const container = document.createElement("div");
container.appendChild(buttonContainer);
container.appendChild(progressContainer);
container.appendChild(inputContainer);
container.appendChild(promptContainer);

// Periodically check if the container has been added to the page and add it if it hasn't. If the container has been added, clear the interval.
const targetSelector = ".flex.flex-col.w-full.py-2.flex-grow.md\\:py-3.md\\:pl-4";
const targetElement = document.querySelector(targetSelector);
targetElement.parentNode.insertBefore(container, targetElement);
// Function to create an input element
function createInput(type, min, value) {
  const input = document.createElement("input");
  input.type = type;
  input.min = min;
  input.value = value;
  input.style.margin = "3px";
  input.style.width = "80px";
  input.style.height = "28px";
  input.style.color = "black";
  input.style.fontSize = "14px";
  return input;
}

// Function to create a label element
function createLabel(text, inputElement) {
  const label = document.createElement("label");
  label.innerText = text;
  label.appendChild(inputElement);
  label.style.color = "white";
  return label;
}


function toggleButtonPanel() {
  const containerChildren = container.children;

  // Convert containerChildren into an array for easier manipulation
  const elementsToToggle = Array.from(containerChildren).filter((element) => element !== toggleButton && element !==buttonContainer);
  // Add the buttonContainer except the toggleButton to the elementsToToggle array
  elementsToToggle.push(...Array.from(buttonContainer.children).filter((element) => element !== toggleButton));
  if (button.style.display === "none") {
    // Show all elements
    elementsToToggle.forEach((element) => {
      element.style.display = "block";
    });

    // Set the text of the toggle button to "Hide"
    toggleButton.innerText = "Hide";
  } else {
    // Hide all elements
    elementsToToggle.forEach((element) => {
      element.style.display = "none";
    });

    // Set the text of the toggle button to "Show"
    toggleButton.innerText = "Show";
  }
}

function toggleCancelButton(isSubmitting) {
  if (isSubmitting) {
    // Activate the cancel button
    cancelButton.disabled = false;
    cancelButton.style.backgroundColor = "red";
    cancelButton.style.opacity = "0.8";
  } else {
    // Deactivate the cancel button
    cancelButton.disabled = true;
    cancelButton.style.backgroundColor = "black";
    cancelButton.style.opacity = "0.2";
  }
}

// PDF parsing
async function parsePDF(file) {
  const loadingTask = pdfjsLib.getDocument(file);
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  let text = "";

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    text += pageText + " ";
  }

  return text;
}

