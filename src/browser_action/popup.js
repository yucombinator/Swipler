var killswitch = function(){
  chrome.runtime.sendMessage({killswitch: true});
  document.querySelector(".start-button").className = "start-button";
  document.querySelector(".stop-button").className += " hidden";
}

var startswitch = function(){
  chrome.runtime.sendMessage({start: true});
  document.querySelector(".stop-button").className = "stop-button";
  document.querySelector(".start-button").className += " hidden";
}

var settings = function(){
  chrome.tabs.create({ url: "src/options_custom/index.html" });
}

var calibrate = function(){
  chrome.runtime.sendMessage({calibrate: true});
}

function main() {
  // Initialization work goes here.
  chrome.runtime.sendMessage({getstatus: true},function(res){
    console.log("state " + res);
    if(res == true){
      document.querySelector(".stop-button").className = "stop-button";
      document.querySelector(".start-button").className += " hidden";
    }else{
      document.querySelector(".start-button").className = "start-button";
      document.querySelector(".stop-button").className += " hidden";
    }
  });
}

// Add event listeners once the DOM has fully loaded by listening for the
// `DOMContentLoaded` event on the document, and adding your listeners to
// specific elements when it triggers.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('.stop-button').addEventListener('click', killswitch);
  document.querySelector('.start-button').addEventListener('click', startswitch);
  document.querySelector('.settings-button').addEventListener('click', settings);
  document.querySelector('.calibrate-button').addEventListener('click', calibrate);
  main();
});
