console.log("Background script loaded");
const tf = require('@tensorflow/tfjs');

console.log("loaded tf")
const URL = chrome.runtime.getURL("my_model/");
let recognizer;
let classLabels;
let audioContext;
let analyzer;

chrome.action.onClicked.addListener((tab) => {
    // Execute init when the extension icon is clicked.
    init();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start") {
        init();
        console.log("sending response from bg")
        sendResponse({ status: "started" });
    }

    return true;
});

async function createModel() {
    console.log("created model");
    
    const checkpointURL = URL + "model.json"; 
    const metadataURL = URL + "metadata.json"; 

    const [modelArrayBuffer, metadataArrayBuffer] = await Promise.all([
        fetch(checkpointURL).then(response => response.arrayBuffer()),
        fetch(metadataURL).then(response => response.json())
    ]);

    classLabels = metadataArrayBuffer.wordLabels;

    const modelTensor = await tf.loadLayersModel(tf.io.browserFiles([new File([modelArrayBuffer], "model.json")]));
    
    recognizer = speechCommands.create(
        "BROWSER_FFT",
        undefined, 
        modelTensor,
        metadataArrayBuffer
    );
}

async function init() {
    console.log("Init function called");
    await createModel();
    
    chrome.tabCapture.capture({ audio: true, video: false }, function(stream) {
        if(chrome.runtime.lastError) {
            console.error("Error capturing tab:", chrome.runtime.lastError);
            return;
        }
        if (!stream) {
            console.error("Unable to capture audio. Stream is undefined.");
            return;
        }

        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        
        analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 1024; 
        source.connect(analyzer);

        startListening();

        processAudioStream();
    });   
}

function startListening() {
    recognizer.listen(result => {
        const scores = result.scores;
        for (let i = 0; i < classLabels.length; i++) {
            const classPrediction = classLabels[i] + ": " + result.scores[i].toFixed(2);
            console.log(classPrediction);  // Adjust this to how you want to handle/display results
        }
    }, {
        includeSpectrogram: true,
        probabilityThreshold: 0.75,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.50
    });
}

function processAudioStream() {
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    
    analyzer.getFloatFrequencyData(dataArray);

    requestAnimationFrame(processAudioStream);
}
