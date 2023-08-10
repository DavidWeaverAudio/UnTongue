document.addEventListener('DOMContentLoaded', (event) => {
    const startButton = document.getElementById("startButton");

    startButton.addEventListener("click", function() {
        // Send a message to the background script to start the process
        chrome.runtime.sendMessage({ action: "start" }, response => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return;
            }
        
            if (response && response.status === "started") {
                console.log("Started from popup.");
            }
        });
        
    });
});
