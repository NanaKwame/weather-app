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
  
  setInterval(function () {
    loop(); // Update every 30secs
  }, 30000);

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
  noLoop();
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
  loop();
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

function mobileCheck () {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};
