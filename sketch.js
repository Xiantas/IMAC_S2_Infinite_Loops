let flock;
const trailDist = 15;

let words;
let font;
function preload() {
  font = loadFont("Venus+Plomb.otf");
  words = loadStrings("words.txt");
}

function setup() {
  createCanvas(720,576);
  textSize(30);
  words.pop();
  noStroke();

  textFont(font);

  flock = new Flock();
  // Add an initial set of boids into the system
  for (let i = 0; i < 93; i++) {
    let b = new Boid(width / 2, height / 2);
    flock.addBoid(b);
  }
}

function draw() {
  background(51);
  flock.run();
}

// Add a new boid into the System
//function mouseDragged() {
//  flock.addBoid(new Boid(mouseX, mouseY));
//}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Flock object
// Does very little, simply manages the array of all the boids

function Flock() {
  // An array for all the boids
  this.boids = []; // Initialize the array
}

Flock.prototype.run = function () {
  
  background(70,30,30);
  for (let i = 0; i < this.boids.length; i++) {
    this.boids[i].run(this.boids); // Passing the entire list of boids to each boid individually
  }
  

};

Flock.prototype.addBoid = function (b) {
  this.boids.push(b);
};

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Boid class
// Methods for Separation, Cohesion, Alignment added

function Boid(x, y) {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(random(-1, 1), random(-1, 1));
  this.position = createVector(x, y);
  this.r = 3.0;
  this.maxspeed = 3; // Maximum speed
  this.maxforce = 0.05; // Maximum steering force

  let index = floor(random(words.length));
  this.word = words[index];
  words.splice(index, 1);

  this.frames = [];
  for (let i = 0; i < this.word.length - 1; i += 1) {
    this.frames.push(createVector(this.position.x + i / 10, this.position.y));
  }
}

Boid.prototype.run = function (boids) {
  this.flock(boids);
  this.update();
//  this.walls();
  this.render();
};

Boid.prototype.applyForce = function (force) {
  // We could add mass here if we want A = F / M
  this.acceleration.add(force);
};

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function (boids) {
  let sep = this.separate(boids); // Separation
  let ali = this.align(boids); // Alignment
  let coh = this.cohesion(boids); // Cohesion
  let expul = this.borders();
  // Arbitrarily weight these forces
  sep.mult(5);
  ali.mult(0.5);
  coh.mult(0.5);
  // Add the force vectors to acceleration
  this.applyForce(sep);
  this.applyForce(ali);
  this.applyForce(coh);
  this.applyForce(expul);
};

// Method to update location
Boid.prototype.update = function () {
  // Update velocity

  this.velocity.add(this.acceleration);
  // Limit speed
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);
  // Reset accelertion to 0 each cycle
  this.acceleration.mult(0);

  if (this.frames.length > 0) {
    this.frames[0].sub(this.position);
    this.frames[0].normalize();
    this.frames[0].mult(trailDist);
    this.frames[0].add(this.position);
    for (let i = 1; i < this.frames.length; i += 1) {
      this.frames[i].sub(this.frames[i - 1]);
      this.frames[i].normalize();
      this.frames[i].mult(trailDist);
      this.frames[i].add(this.frames[i - 1]);
    }
  }
};

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function (target) {
  let desired = p5.Vector.sub(target, this.position); // A vector pointing from the location to the target
  // Normalize desired and scale to maximum speed
  desired.normalize();
  desired.mult(this.maxspeed);
  // Steering = Desired minus Velocity
  let steer = p5.Vector.sub(desired, this.velocity);
  steer.limit(this.maxforce); // Limit to maximum steering force
  return steer;
};

Boid.prototype.render = function () {
  const len = this.frames.length;
  if (len>0){
    let theta = p5.Vector.sub(this.frames[0],this.position).heading();
    fill(120,220,120);
    push();
    translate(this.frames[0].x, this.frames[0].y);
    rotate(theta);
    text(this.word[1], 5,5);
    pop();
    let odd = true;
    for (let i = 1; i < len; i += 1) {
      theta = p5.Vector.sub(this.frames[i],this.frames[i-1]).heading();
      if (odd) fill(220,120,120);
      else fill(120,220,120);
      odd = !odd;
      push();
      translate(this.frames[i].x, this.frames[i].y);
      rotate(theta);
      text(this.word[i + 1], 5,5);
      pop();
    }     
  }

  let theta = this.velocity.heading() + radians(180);
  fill(220,120,120);
  push();
  translate(this.position.x, this.position.y);
  rotate(theta);
  text(this.word[0], 5,5);
  pop();
};

Boid.prototype.borders = function () {
  let expultion = createVector(0, 0);

  if (this.position.x < 0)
    expultion.add(createVector(-this.position.x/400, 0));
  if (this.position.y < 0)
    expultion.add(createVector(0, -this.position.y/400));
  if (this.position.x > width)
    expultion.add(
      createVector((width - this.position.x)/400, 0));
  if (this.position.y > height)
    expultion.add(
      createVector(0, (height - this.position.y)/400)
    );

  return expultion;
};

Boid.prototype.walls = function () {
  let expultion = createVector(0, 0);

  if (this.position.x < 0) this.position.y = height;
  if (this.position.y < 0) this.position.y = height;
  if (this.position.x > width) this.position.y = height;
  if (this.position.y > height) this.position.y = height;

  return expultion;
};

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function (boids) {
  let desiredseparation = 25.0;
  let steer = createVector(0, 0);
  let count = 0;
  // For every boid in the system, check if it's too close
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if (d > 0 && d < desiredseparation) {
      // Calculate vector pointing away from neighbor
      let diff = p5.Vector.sub(this.position, boids[i].position);
      diff.normalize();
      diff.div(d); // Weight by distance
      steer.add(diff);
      count++; // Keep track of how many
    }
  }

  // Average -- divide by how many
  if (count > 0) {
    steer.div(count);
  }

  /*
  if (this.position.x < 10) steer.add(createVector(-1/sq(this.position.x)));
  if (this.position.y < 10) steer.add(createVector(-1/sq(this.position.y)));
  if (this.position.x > width - 10) steer.add(createVector(1/sq(width-this.position.x), 0));
  if (this.position.y < height - 10) steer.add(createVector(0, 1/sq(height-this.position.x)));
  */
  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }

  return steer;
};

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function (boids) {
  let neighbordist = 50;
  let sum = createVector(0, 0);
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);
    if (d > 0 && d < neighbordist) {
      sum.add(boids[i].velocity);
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxspeed);
    let steer = p5.Vector.sub(sum, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  } else {
    return createVector(0, 0);
  }
};

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function (boids) {
  let neighbordist = 50;
  let sum = createVector(0, 0); // Start with empty vector to accumulate all locations
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position, boids[i].position);
    if (d > 0 && d < neighbordist) {
      sum.add(boids[i].position); // Add location
      count++;
    }
  }
  if (mouseIsPressed) {
    count++;
    return this.seek(createVector(mouseX, mouseY));
  }
  if (count > 0) {
    sum.div(count);
    return this.seek(sum); // Steer towards the location
  } else {
    return createVector(0, 0);
  }
};

function keyPressed() {
  // this will download the first 5 seconds of the animation!
  if (key === 's') {
    saveGif('mySketch', 15);
  }
}