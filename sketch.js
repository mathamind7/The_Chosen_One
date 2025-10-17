let motionCam;
let previousFrame;
let video1, video2;
let showingVideo2 = false;
let motionThreshold = 10;
let motionStrength = 0;
let initialized = false;
let frameCounter = 0;

let lastMotionTime = 0;
let cooldownDuration = 500; // in ms

function preload() {
  video1 = createVideo('1.mp4');
  video2 = createVideo('2.mp4');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(30);

  // Use full webcam resolution
  motionCam = createCapture(VIDEO);
  motionCam.size(width, height);
  motionCam.hide();

  previousFrame = createImage(width, height);

  video1.size(windowWidth, windowHeight);
  video1.volume(1);
  video1.loop();
  video1.show();

  video2.size(windowWidth, windowHeight);
  video2.volume(1);
  video2.hide();
}

function draw() {
  background(0);
  frameCounter++;

  motionCam.loadPixels();
  if (motionCam.pixels.length > 0) {
    if (!initialized) {
      previousFrame.copy(motionCam, 0, 0, width, height, 0, 0, width, height);
      previousFrame.loadPixels();
      previousFrame.updatePixels();
      initialized = true;
      return;
    }

    motionStrength = 0;
    previousFrame.loadPixels();

    for (let i = 0; i < motionCam.pixels.length; i += 4) {
      let diff = dist(
        motionCam.pixels[i], motionCam.pixels[i + 1], motionCam.pixels[i + 2],
        previousFrame.pixels[i], previousFrame.pixels[i + 1], previousFrame.pixels[i + 2]
      );
      if (diff > 200) motionStrength++;
    }

    previousFrame.copy(motionCam, 0, 0, width, height, 0, 0, width, height);
    previousFrame.loadPixels();
    previousFrame.updatePixels();
  }

  const motionDetected = motionStrength > motionThreshold;

  if (motionDetected) {
    lastMotionTime = millis();
    if (!showingVideo2) {
      console.log("Motion detected — switching to video2");
      video1.stop();
      video1.hide();
      video2.show();
      video2.loop();
      showingVideo2 = true;
    }
  } else {
    if (showingVideo2 && millis() - lastMotionTime > cooldownDuration) {
      console.log("Motion ceased — switching back to video1");
      video2.stop();
      video2.hide();
      video1.show();
      video1.loop();
      showingVideo2 = false;
    }
  }

  const scaleFactor = 1.5;
  const currentVideo = showingVideo2 ? video2 : video1;

  if (currentVideo.elt.readyState === 4) {
    drawVideo(currentVideo, scaleFactor);
  }

  drawMotionFeedback();
}

function drawVideo(vid, scaleFactor) {
  let videoAspectRatio = vid.width / vid.height;
  let canvasAspectRatio = width / height;
  let drawWidth, drawHeight, drawX, drawY;

  if (canvasAspectRatio > videoAspectRatio) {
    drawHeight = height * scaleFactor;
    drawWidth = drawHeight * videoAspectRatio;
    drawX = (width - drawWidth) / 2;
    drawY = 0;
  } else {
    drawWidth = width * scaleFactor;
    drawHeight = drawWidth / videoAspectRatio;
    drawX = 0;
    drawY = (height - drawHeight) / 2;
  }

  image(vid, drawX, drawY, drawWidth, drawHeight);
}

function drawMotionFeedback() {
  image(motionCam, 10, height - 140, 160, 120);

  fill(50);
  rect(10, height - 160, 160, 20);

  let strength = constrain(map(motionStrength, 0, 1000, 0, 160), 0, 160);
  fill(motionStrength > motionThreshold ? 'lime' : 'red');
  rect(10, height - 160, strength, 20);

  fill(255);
  textSize(12);
  text(`Motion: ${motionStrength}`, 10, height - 170);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Resize webcam to match new canvas size
  motionCam.size(windowWidth, windowHeight);

  // Recreate previousFrame with new dimensions
  previousFrame = createImage(windowWidth, windowHeight);
  initialized = false; // Force reinitialization in draw()
}
