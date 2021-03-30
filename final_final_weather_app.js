// This sketch gets the low and high temperatures for the next 7 days
// and shows them across the bottom of the screen.

// this will store all the weather data
let aspect;
let w; 
let fontReg, fontBold;
let showWeatherNumbers = false;
let showTwelve = false;
let cx, cy;
let textColor = "#3c3c3c";
let textColorWhenDark = "#ededed";

function preload() {
  fontReg = loadFont("data/Oxygen-Regular.ttf");
  fontBold = loadFont("data/Oxygen-Bold.ttf");
}

function setup() {
  createCanvas(360, 740);  // the size of my phone
  aspect = new AspectHelper(this);
  cx = aspect.width/2;
  cy = aspect.height/2;
  textFont(fontReg, 12);

  // get the current weather for GPS location
  w = requestWeather('gps');
}


function draw() {
  aspect.apply();
  background(color(247, 247, 247));
  fill('white');
  textAlign(CENTER, CENTER);
  
  if (w.ready) {   
    drawWeather();
  } else {
    fill(color(3,0,55));
    textSize(40);
    text("Loading...", aspect.width/2, aspect.height/2);
  }
}

function drawWeather () {  
  let temps = w.getTemperature("hourly");
  let precips = w.getPrecipProbability("hourly");
  let humids = w.getHumidity("hourly");
  let winds = w.getWindSpeed("hourly");
  let summaries = w.getSummary("hourly");
  
  let size = temps.length;
  let hrIndices = showTwelve ? [0, 12, 24, 36, 48] : [0, 3, 6, 9, 12];
  let arcSizes = [aspect.height*0.31, aspect.height*0.52, aspect.height*0.7 ,aspect.height*0.9, aspect.height*1.5];
  strokeWeight(0);
  stroke(76, 76, 76);
 
 // Draw temperature rects
  rectMode(RADIUS);
  for (let i = hrIndices.length-1; i >= 0; i--) {
    let hrIndx = hrIndices[i];
    fill(getTempColor(temps[hrIndx]));
    rect(aspect.width/2, aspect.height/2, arcSizes[i]*0.5, arcSizes[i]*0.5, 2);
  }
  
  // Draw precipitation arcs
  for (let i = hrIndices.length-1; i >= 0; i--) {
    let hrIndx = hrIndices[i];
    fill(getPrecipColor(precips[hrIndx]));
    arc(aspect.width/2, aspect.height/2, arcSizes[i], arcSizes[i], 2*HALF_PI, 0);
  }
  
  if (showWeatherNumbers) {
    noStroke(0);
    for (let i = 0; i < hrIndices.length; i++) {
      let hrIndx = hrIndices[i];
      let fontSize = map(size - hrIndx*(showTwelve ? 1 : 4), 0, size, 12, aspect.width/10);
      
      if (precips[hrIndx]>0.3) {
        fill(textColorWhenDark);
      } else {
        fill(textColor);
      }
            
      textSize(fontSize);
      text(formatPercent(precips[hrIndx]), cx, cy-((i+1)*aspect.height/11)-10); // top: temperature
      textSize(0.8*fontSize);
      text(nf(humids[hrIndx], 0, 1), cx+((i+1)*aspect.width/5.3)+15, cy-0.6*fontSize); // right: windspeed
      
      fill(textColor);
      
      textSize(fontSize);
      text(formatDegrees(temps[hrIndx]), cx, cy+((i+1)*aspect.height/11)+10); // bottom: precipitation
      textSize(0.8*fontSize);
      text(nf(winds[hrIndx], 0, 1), cx-((i+1)*aspect.width/5.3)-15, cy+0.4*fontSize);// left: humidity
      
    }
  } else {
    push();
    showSummary(summaries[0], precips[0]>0.3);
    showTime();
    pop();
  }
  
  
  showInterval();
  
  // stop drawing; the temperature won't change for a while
  //noLoop();
}

function getTempColor (val) {
  let tempColor;
  if (val < 55) {
    let value = map(val, -20, 55, 0, 1);
    tempColor = lerpColor(color("#0000ff"), color("#ea89f5"), value);
  } else {
    let value = map(val, 55, 110, 0, 1);
    tempColor = lerpColor(color("#ea89f5"), color("#ff0000"), value);
  }
  return tempColor;
}

function getPrecipColor (val) {
  let value = map(val, 0, 1, 0, 1);
  let precipColor = lerpColor(color("#d7e9f9"), color("#343f49"), value);
  return precipColor;
}

function mouseClicked() {
  toggleModes();
}

let modeTracker = 1;
let modes = [
  {showNumbers: false, showTwelve: false},
  {showNumbers: true, showTwelve: false},
  {showNumbers: false, showTwelve: true},
  {showNumbers: true, showTwelve: true},
];
function toggleModes () {
  let mode = modes[modeTracker%4];
  showWeatherNumbers = mode.showNumbers;
  showTwelve = mode.showTwelve;
  modeTracker+=1;
}

function showSummary(summary, isDarkBg) {
  let fontSize = 23;
  textFont(fontBold, fontSize);
  fill(isDarkBg ? textColorWhenDark: textColor);
  text(summary, cx, cy-0.8*fontSize);
}

function showInterval() {
  let intervalX = aspect.width*0.01;
  let intervalY = aspect.height - 20;
  fill(textColor);
  if (showTwelve) {
    rect(intervalX, intervalY, 3);
    circle(intervalX + 30, intervalY, 6);
    circle(intervalX + 60, intervalY, 6);
  } else {
    circle(intervalX, intervalY, 6);
    circle(intervalX + 30, intervalY, 6);
    circle(intervalX + 60, intervalY, 6);
  }
}

function showTime() {
  fill(textColor);
  text(timeText(), cx, cy+30);
}

function twelveHour() {
  var h = hour() % 12;
  if (h === 0) {
    h = 12;
  }
  return h;
}


// format hours, minutes, and seconds
function timeText() {
  return twelveHour() + ':' + nf(minute(), 2);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
