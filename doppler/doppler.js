window.doppler = (function() {
  var AuContext = (window.AudioContext ||
                   window.webkitAudioContext ||
                   window.mozAudioContext ||
                   window.oAudioContext ||
                   window.msAudioContext);

  var ctx = new AuContext();
  var osc = ctx.createOscillator();
  // This is just preliminary, we'll actually do a quick scan
  // (as suggested in the paper) to optimize this.
  var freq = 20000;

  // See paper for this particular choice of frequencies
  var relevantFreqWindow = 33;

  var freqSweepStart = 19000;
  var freqSweepEnd = 22000;

  var lastAction;
  var lastChange;

  var getBandwidth = function(analyser, freqs) {
    var primaryTone = freqToIndex(analyser, freq);
    var primaryVolume = freqs[primaryTone];
    // This ratio is totally empirical (aka trial-and-error).
    var maxVolumeRatio = 0.6;
    // Needs to be calibrated based on sensitivity of the mic (Seems to work at 0.6 for high sensitive, 0.05 for med-low sensitivity)
    //var maxVolumeRatio = 0.05;
    // Secondary maxVolumeRatio
    var maxVolumeRatio2 = maxVolumeRatio/2;

    var leftBandwidth = 0;
    do {
      leftBandwidth++;
      var volume = freqs[primaryTone-leftBandwidth];
      var normalizedVolume = volume / primaryVolume;
    } while (normalizedVolume > maxVolumeRatio && leftBandwidth < relevantFreqWindow);

    var leftBandwidth2 = leftBandwidth;

    do {
      leftBandwidth2++;
      var volume = freqs[primaryTone-leftBandwidth2];
      var normalizedVolume = volume / primaryVolume;
    } while (normalizedVolume > maxVolumeRatio2 && leftBandwidth2 < relevantFreqWindow);

    if (leftBandwidth2 < relevantFreqWindow) {
      leftBandwidth = leftBandwidth2;
    }

    var rightBandwidth = 0;
    do {
       rightBandwidth++;
      var volume = freqs[primaryTone+rightBandwidth];
      var normalizedVolume = volume / primaryVolume;
    } while (normalizedVolume > maxVolumeRatio && rightBandwidth < relevantFreqWindow);

    var rightBandwidth2 = rightBandwidth;

    do {
      rightBandwidth2++;
      var volume = freqs[primaryTone+rightBandwidth2];
      var normalizedVolume = volume / primaryVolume;
    } while (normalizedVolume > maxVolumeRatio2 && rightBandwidth2 < relevantFreqWindow);

    if (rightBandwidth2 < relevantFreqWindow) {
      rightBandwidth = rightBandwidth2;
    }

    return { left: leftBandwidth, right: rightBandwidth };
  };

  var optimizeFrequency = function(osc, analyser) {
    var oldFreq = osc.frequency.value;

    var audioData = new Uint8Array(analyser.frequencyBinCount);
    var maxAmp = 0;
    var maxAmpIndex = 0;

    var from = freqToIndex(analyser, freqSweepStart);
    var to   = freqToIndex(analyser, freqSweepEnd);
    for (var i = from; i < to; i++) {
      osc.frequency.value = indexToFreq(analyser, i);
      analyser.getByteFrequencyData(audioData);

      if (audioData[i] > maxAmp) {
        maxAmp = audioData[i];
        maxAmpIndex = i;
      }
    }
    // Sometimes the above procedure seems to fail, not sure why.
    // If that happends, just use the old value.
    if (maxAmpIndex == 0) {
      return oldFreq;
    } else {
      return indexToFreq(analyser, maxAmpIndex);
    }
  };

  // CONSTANTS
  var threshold = 4;
  var scale    = 10;
  var baseSize = 100;
  var cooldown = 500;
  var maxFastSwipeFrames = 5;
  var fastSwipeFrames = maxFastSwipeFrames;

  // SWIPE THRESHOLD
  var highestRight = 0;
  var leftBound = -5;
  var rightBound = 6;
  var fuckBound = 20;

  // SWIPE TYPES
  var SWIPE_LEFT = 0;
  var SWIPE_CENTER = 1;
  var SWIPE_RIGHT = 2;
  var SWIPE_FUCK = 3;

  // TRACKING VARS
  var lastVal = 0;
  var lastTask = 0;

  function logMovement(movement) {
      var s = '';
      while (s.length < movement+10) s += "**";
      console.log(s + ": " + movement);
  }

  function checkSwipes(movement, userCallback) {
    if (Date.now() - lastAction < cooldown) {
      return;
    }
    if(movement < leftBound) {
      swipeEvent(SWIPE_LEFT, userCallback);
      lastAction = Date.now();
    }
    if(movement > rightBound) {
      if(movement < fuckBound) {
        swipeEvent(SWIPE_RIGHT, userCallback);
        lastAction = Date.now();
      } else {
        swipeEvent(SWIPE_FUCK, userCallback);
        lastAction = Date.now() + cooldown;
      }
    }
  }

  function swipeEvent(whichSwipe, userCallback) {
    if(whichSwipe == SWIPE_LEFT) {
      userCallback("LEFT");
    }
    if(whichSwipe == SWIPE_RIGHT) {
      userCallback("RIGHT");
    }
    if(whichSwipe == SWIPE_FUCK) {
      userCallback("FUCK");
    }
  }

  var readMicInterval = 0;
  var readMic = function(analyser, userCallback) {
    var audioData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(audioData);

    var band = getBandwidth(analyser, audioData);
    if (band.left > threshold || band.right > threshold) {
      var movement = band.left - band.right;
      
      if (Date.now() - lastChange > 800) {
        fastSwipeFrames = maxFastSwipeFrames;
        highestRight = 0;
      }
      
      // lower values mean moving towards the microphone, a swipe goes to around -4 for left and +4 for right

      if(lastVal != movement) {
        lastChange = Date.now();
        if (movement > rightBound || fastSwipeFrames != maxFastSwipeFrames) {
//          console.log(fastSwipeFrames != maxFastSwipeFrames);
          fastSwipeFrames--;
//          console.log(fastSwipeFrames + " fastSwipeFrames is " + fastSwipeFrames + " and maxFastSwipeFrames " + maxFastSwipeFrames);
          console.log(fastSwipeFrames + ": " + highestRight);
          if (movement > highestRight) {
            highestRight = movement; 
          }
          if (fastSwipeFrames == 0){
//            console.log("Highest " + highestRight);
            fastSwipeFrames = maxFastSwipeFrames;
            //logMovement(movement);
            checkSwipes(highestRight, userCallback);
            highestRight = 0;
          }
        } else {

          checkSwipes(movement, userCallback);

          fastSwipeFrames = maxFastSwipeFrames
        }
        calibration(movement);
        lastVal = movement;
      }
    }

    //userCallback(band);

    readMicInterval = setTimeout(readMic, 1, analyser, userCallback);
  };

  var handleMic = function(stream, callback, userCallback) {
    // Mic
    var mic = ctx.createMediaStreamSource(stream);
    var analyser = ctx.createAnalyser();

    analyser.smoothingTimeConstant = 0.5;
    analyser.fftSize = 2048;

    mic.connect(analyser);

    // Doppler tone
    osc.frequency.value = freq;
    osc.type = osc.SINE;
    osc.start(0);
    osc.connect(ctx.destination);

    // There seems to be some initial "warm-up" period
    // where all frequencies are significantly louder.
    // A quick timeout will hopefully decrease that bias effect.
    setTimeout(function() {
      // Optimize doppler tone
      freq = optimizeFrequency(osc, analyser, 19000, 22000);
      osc.frequency.value = freq;

      clearInterval(readMicInterval);
      callback(analyser, userCallback);
    });
  };

  var freqToIndex = function(analyser, freq) {
    var nyquist = ctx.sampleRate / 2;
    return Math.round( freq/nyquist * analyser.fftSize/2 );
  };

  var indexToFreq = function(analyser, index) {
    var nyquist = ctx.sampleRate / 2;
    return nyquist/(analyser.fftSize/2) * index;
  };
  var started = false;
  return {
    initial: function(callback) {
      ctx.resume();
      started = true;
      navigator.getUserMedia_ = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
      navigator.getUserMedia_({ audio: { optional: [{ echoCancellation: false }] } }, function(stream) {
        handleMic(stream, readMic, callback);
      }, function() { console.log('Error!') });
    },
    stop: function () {
      started = false;
      clearInterval(readMicInterval);
      ctx.suspend();
      osc.stop(0);
      osc = ctx.createOscillator();
    },
    getStatus: function(){
      console.log(ctx.state);
      return started;
    }
    calibrate: function(){
      startCalibrationForAll();
    }
  }

// **** CALLIBRATION FUNCTIONS ****
var isCalibrating = false;
var calibrationArray;
var calibrationType;
var CALIB_LEFT = 0;
var CALIB_RIGHT = 1;
var CALIB_FUCK = 2;

function startCalibrationForAll(){
  window.setInterval(startCalibration(CALIB_LEFT), 3000);
  finishCalibration();
  window.setInterval(startCalibration(CALIB_RIGHT), 3000);
  finishCalibration();
  window.setInterval(startCalibration(CALIB_FUCK), 3000);
  finishCalibration();
}

function startCalibration(whichCalibration) {
  calibrationType = whichCalibration;
  isCalibrating = true;
  calibrationArray = new Array();
}

function finishCalibration() {
  if(calibrationType == CALIB_LEFT) {
    finishCalibrateLeft();
  } else if(calibrationType == CALIB_RIGHT) {
    finishCalibrateRight();
  } else {
    finishCalibrateFuck();
  }
}

function finishCalibrateLeft() {
    isCalibrating = false;
    for (var i = 0; i < calibrationArray.length; i++) {
      calibrationArray[i] = -calibrationArray[i];
    };
    var lowerBound = -getMaxCalValue(calibrationArray);
    leftBound = lowerBound;
  }

  function finishCalibrateRight() {
    isCalibrating = false;
    var upperBound = getMaxCalValue(calibrationArray);
    rightBound = upperBound;
  }

  function finishCalibrateFuck() {
    isCalibrating = false;
    var upperBound = getMaxCalValue(calibrationArray);
    fuckBound = upperBound;
  }

  function getMaxCalValue(calArray) {
    var current = calArray[0];
    var up = current > 0;
    var count = 5;

    var peakSum = 0;
    var peakCount = 0;

    var current = 5;
    for (var i = 1; i < calArray.length; i++) {
      if(calArray[i] >= current) { // is going up
        if(up) {
          count ++;
        } else {
          up = true;
          count = 0;
        }
      } else {
        if(up) {    // turned around at peak
          if(count > 1) { // valid peak
            peakSum += current;
            peakCount ++;
          }
          up = false;
          count = 0;
        } else {
          count ++;
        }
      }

      current = calArray[i];
    };

    return peakSum/peakCount;
  }

function calibration(movement) {
  if(isCalibrating) {
    calibrationArray.push(movement); 
  }
}

})(window, document);
