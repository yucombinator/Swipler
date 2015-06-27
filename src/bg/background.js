// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

//var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
//});

var startListening = function(){
  console.log('init!')
  window.doppler.init(function(bandwidth) {
          var threshold = 4;
          if (bandwidth.left > threshold || bandwidth.right > threshold) {
            var scale    = 10;
            var baseSize = 100;
            var diff = bandwidth.left - bandwidth.right;
            var dimension = (baseSize + scale*diff) + 'px';
            //document.getElementById('box').style.width  = dimension;
            //document.getElementById('box').style.height = dimension;
          }
});
}


//example of using a message handler from the inject scripts
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.permissionAcquired == true){
      sendResponse();
      startListening();
    }
});
