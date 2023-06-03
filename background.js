chrome.runtime.onInstalled.addListener(() => {
    // Inject content script when the extension is installed or updated
    chrome.tabs.query({ url: "https://chat.openai.com/*" }, (tabs) => {
      for (const tab of tabs) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
      }
    });
  });
  
  // Message listener to communicate between content script and background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getPDFContent") {
      const { pdfUrl } = message;
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js";
      script.onload = () => {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        loadingTask.promise
          .then((pdf) => {
            const numPages = pdf.numPages;
            let text = "";
  
            const getPageText = (pageNum) => {
              return pdf.getPage(pageNum).then((page) => {
                return page.getTextContent().then((content) => {
                  const pageText = content.items.map((item) => item.str).join(" ");
                  text += pageText + " ";
  
                  if (pageNum < numPages) {
                    return getPageText(pageNum + 1);
                  } else {
                    return text;
                  }
                });
              });
            };
  
            return getPageText(1);
          })
          .then((result) => {
            sendResponse({ result });
          })
          .catch((error) => {
            console.error("Error parsing PDF:", error);
            sendResponse({ error: "Failed to parse PDF" });
          });
      };
      document.body.appendChild(script);
  
      return true; // Keep the message channel open for sending the response asynchronously
    }
  });
  