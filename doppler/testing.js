// CONSTANTS
var threshold = 4;
var swipeThreshold = 3;
var scale    = 10;
var baseSize = 100;

// TRACKING VARS
var lastVal = 0;

function logMovement(movement) { 
    var s = ''; 
    while (s.length < movement+10) s += "**"; 
    console.log(s);
}

function sizeBox(movement) {
  var dimension = (baseSize + scale*movement) + 'px';

  document.getElementById('box').style.width  = dimension;
  document.getElementById('box').style.height = dimension;
}

function checkSwipes(movement) {
  if(movement < -swipeThreshold) {
    swipeEvent(false);
  } else if(movement <= swipeThreshold) {
    document.getElementById('click').innerHTML = "None";
  } else {
    swipeEvent(true);
  }
}

function swipeEvent(isRight) {
  if(isRight) {
    document.getElementById('click').innerHTML = "Right";
  } else {
    document.getElementById('click').innerHTML = "Left";
  }
}

window.addEventListener('load', function() {
  window.doppler.init(function(bandwidth) {
    if (bandwidth.left > threshold || bandwidth.right > threshold) {
      var movement = bandwidth.left - bandwidth.right;
      // lower values mean moving towards the microphone, a swipe goes to around -4 for left and +4 for right

      if(lastVal != movement) {
        lastVal = movement;

        logMovement(movement);
        sizeBox(movement);
        checkSwipes(movement);
      }
    }
  });
});