// CONSTANTS
var threshold = 4;
var swipeThreshold = 3;
var scale    = 10;
var baseSize = 100;

// TRACKING VARS
var lastVal = 0;

function swipeEvent(isRight) {
  if(isRight) {
    document.getElementById('click').innerHTML = "Right";
  } else {
    document.getElementById('click').innerHTML = "Left";
  }
}

function stringLen(length) { 
    var s = ''; 
    while (s.length < length) s += "**"; 
    return s; 
} 

window.addEventListener('load', function() {
  window.doppler.init(function(bandwidth) {
    if (bandwidth.left > threshold || bandwidth.right > threshold) {
      var diff = bandwidth.left - bandwidth.right;

      if(lastVal != diff) {
        lastVal = diff;

        console.log(stringLen(diff+10));

        var dimension = (baseSize + scale*diff) + 'px';

        document.getElementById('box').style.width  = dimension;
        document.getElementById('box').style.height = dimension;

        if(diff < -swipeThreshold) {
          swipeEvent(false);
        } else if(diff <= swipeThreshold) {
          document.getElementById('click').innerHTML = "None";
        } else {
          swipeEvent(true);
        }
      }
    }
  });
});