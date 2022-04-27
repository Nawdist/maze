
const canvas: HTMLCanvasElement = document.getElementsByTagName("canvas")[0];
const ctx: CanvasRenderingContext2D = canvas.getContext(
  "2d"
) as CanvasRenderingContext2D;

let audio = new AudioContext()

var master = audio.createGain();
master.gain.setValueAtTime(0.2, audio.currentTime);
master.connect(audio.destination);

var track = audio.createGain();
track.gain.setValueAtTime(0, audio.currentTime);
track.connect(master);


function play(delay: number, x: number, y: number ) {
  var tone = audio.createOscillator();
  tone.type = "triangle";
  tone.connect(track);
  tone.start();
    tone.connect(track)
    var factor = y / 10 ;
    var frequency = 220 + x * 4 + (factor * 440);

    tone.frequency.linearRampToValueAtTime(frequency, audio.currentTime);

    track.gain.cancelScheduledValues(audio.currentTime);
    track.gain.linearRampToValueAtTime(1, audio.currentTime);
    track.gain.linearRampToValueAtTime(0, audio.currentTime + delay);
    setTimeout(() => {
        tone.disconnect()
    }, (delay * 100) * 2);
}

if (audio.resume) {
    audio.resume();
}

let rows = 15,
  cols = 15;

let completed = false;

let w = canvas.width / cols,
  h = canvas.height / rows;

let grid: Array<Cell[]> = [];

let player: Cell;
let end: Cell;

let playerPath: Cell[] = [];

window.onkeydown = (e) => {
  if (completed) {
    if (
      e.key == "ArrowDown" &&
      !player.sides.get("down")?.walls.top &&
      !player.walls.bottom
    ) {
      player.render(Colors.start);
      playerPath.push(player);
      player = grid[player.x][player.y + 1];
      player.render(Colors.debugSecondary);
    } else if (
      e.key == "ArrowUp" &&
      !grid[player.x][player.y - 1]?.walls.bottom &&
      !player?.walls.top
    ) {
      playerPath.push(player);
      player.render(Colors.start);
      player = grid[player.x][player.y - 1];
      player.render(Colors.debugSecondary);
    } else if (
      e.key == "ArrowLeft" &&
      !grid[player.x - 1][player.y]?.walls.right &&
      !player?.walls.left
    ) {
      playerPath.push(player);
      player.render(Colors.start);
      player = grid[player.x - 1][player.y];
      player.render(Colors.debugSecondary);
    } else if (
      e.key == "ArrowRight" &&
      !grid[player.x + 1][player.y]?.walls.left &&
      !player?.walls.right
    ) {
      playerPath.push(player);
      player.render(Colors.start);
      player = grid[player.x + 1][player.y];
      player.render(Colors.debugSecondary);
    }
    if (player === end) {
      console.log("WIN");
      completed = false;
      playerPath.push(end);
      for (let i = 0; i < playerPath.length; i++) {
        let { x, y } = playerPath[i].center;
        let { x: x1, y: y1 } = playerPath[i + 1].center;
        ctx.lineWidth = 1;
        line(x, y, x1, y1, Colors.path);
      }
    }
    let previous = playerPath[playerPath.length - 1];
    let preprevious = playerPath[playerPath.length - 2];
    if (previous) {
      previous.render(Colors.start);
      line(
        player.center.x,
        player.center.y,
        previous.center.x,
        previous.center.y,
        Colors.debugPrimary
      );
    }
    if (preprevious) {
      line(
        previous.center.x,
        previous.center.y,
        preprevious.center.x,
        preprevious.center.y,
        Colors.debugPrimary
      );
    }
  }
};

function line(
  sx: number,
  sy: number,
  dx: number,
  dy: number,
  color: string = Colors.wall
) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.moveTo(sx, sy);
  ctx.lineTo(dx, dy);
  ctx.stroke();
  ctx.closePath();
}

enum Colors {
  visited = "#005eff",
  path = "#ff8a24",
  open = "#00ff3c",
  none = "#000000",
  end = "#d10251",
  start = "#000f24",
  debugPrimary = "#00f0e0",
  debugSecondary = "#bb33ff",
  wall = "#FFF",
}

interface Window {
  global: {
    dfs: Function;
    sidewinder: Function;
    generate: Function;
  };
}
window.global = { dfs, sidewinder, generate };

interface Walls {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

class Cell {
  visited = false;
  readonly center: {
    x: number;
    y: number;
  };
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly ry: number;
  walls: Walls = {
    top: true,
    bottom: true,
    left: true,
    right: true,
  };
  sides: Map<string, Cell> = new Map();
  previous: Cell | null = null;
  arrSides: Cell[] = [];
  /**
   *
   * @param {number} y
   * @param {number} x
   */
  constructor(y: number, x: number) {
    this.x = x;
    this.y = y;
    this.rx = x * w;
    this.ry = y * h;
    this.center = { x: this.rx + w / 2, y: this.ry + h / 2 };
  }
  /**
   * A method that controls how the cell the rendered
   * @param {string} color
   */
  render(color: string = Colors.none, wall = Colors.wall): Cell {
    const { rx, ry, walls } = this;
    ctx.fillStyle = color;
    if (color) ctx.fillRect(rx, ry, w, h);
    line(rx, ry, rx + w, ry, walls.top ? wall : color);
    line(rx + w, ry + h, rx, ry + h, walls.bottom ? wall : color);
    line(rx, ry, rx, ry + h, walls.left ? wall : color);
    line(rx + w, ry, rx + w, ry + h, walls.right ? wall : color);
    return this;
  }
  /**
   * Registers all neighbouring Cells in a `sides` array
   */
  addSides() {
    let { x, y, sides } = this;
    if (x < rows - 1) sides.set("right", grid[x + 1][y]);

    if (x > 0) sides.set("left", grid[x - 1][y]);

    if (y < cols - 1) sides.set("bottom", grid[x][y + 1]);

    if (y > 0) sides.set("top", grid[x][y - 1]);

    for (let k of sides) {
      this.arrSides.push(k[1]);
    }
  }
}

function generate() {
  grid = [];
  path = [];
  for (let i = 0; i < cols; i++) {
    grid[i] = new Array(cols);
    for (let j = 0; j < rows; j++) {
      grid[i][j] = new Cell(j, i);
      grid[i][j].render();
    }
  }
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].addSides();
    }
  };
  runSet = [];
  current = grid[random(0, cols - 1)][random(0, rows - 1)];
  visited = [current];

}
let runSet: Cell[] = [];
let current: Cell;
let visited: Cell[];

const getRandomItem = (iterable: Map<string, Cell>): directions | string =>
  [...iterable.keys()][Math.floor(Math.random() * iterable.size)];

let dir = {
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top",
};

type directions = "left" | "right" | "bottom" | "top";

function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let path: Cell[] = [];

function dfs(delay: number, i: number) {
  if(completed) clearInterval(i);
  current.render(Colors.debugPrimary);
  visited.push(current);
  play(delay, current.x, current.y)
  if (visited.length !== rows * cols) {
    if (!current.arrSides.every((i) => i.visited)) {
      path.push(current);
      let side: Cell | undefined = undefined;
      let direction: directions = getRandomItem(current.sides) as directions;
      while (!side) {
        direction = getRandomItem(current.sides) as directions;
        side = current.sides.get(direction);
        if (side?.visited) side = undefined;
      }
      current.walls[direction] = false;
      side.walls[dir[direction] as directions] = false;
      side.render();
      current.previous = side;
      current.visited = true;
      if(current.previous.previous) current.previous.previous.render(Colors.start)
      current.render(Colors.start)
      // current.previous?.render(Colors.open);
      current = side;
      current.visited = true;
      current.render(Colors.debugPrimary);
      if(random(0, 100) < 5) visited.forEach((side) => side.render(Colors.start));
      // current.sides.forEach(side => side.render(Colors.end))
      // visited.forEach((side) => side.render(Colors.start));
    } else {
      if (current.arrSides.every((i) => i.visited)) {
        current = path.pop() as Cell;
        current.visited = true;
        visited.push(current);
        current.render(Colors.end);
        current.previous?.render(Colors.start);
      }
    }
  }
  if (Array.from(new Set(visited)).length >= rows * cols) {
    visited.forEach((side) => side.render(Colors.start));
    completed = true;
    current.render(Colors.start)
    return
    // clearInterval(int);
    // current.render(Colors.start);
    // player = grid[random(Math.round(rows / 2), rows - 1)][random(0, cols)];
    // player.render(Colors.debugSecondary);
    // completed = true;
    // console.log(completed);
    // end = grid[random(0, Math.round(rows / 2))][random(0, cols)];
    // end.render(Colors.end);
    // //for(let cell of visited){
    //if(random(0, rows) < 10){
    //let direction: directions = d[random(0, d.length)]
    //        let {x, y} = cell
    //        cell.walls[direction] = false
    //        if(direction == "top") grid[y - 1][x].walls.bottom = false
    //      if(direction == "bottom") grid[y + 1][x].walls.top = false
    //    if(direction == "right") grid[y][x + 1].walls.left= false
    //  if(direction == "left") grid[y][x - 1].walls.right = false
    //cell.render(Colors.start, Colors.start)
    //}
    //}
  }
}

let d: directions[] = ["top", "bottom", "left", "right"];
// let int = setInterval(update, 50);
// update();
let j: number;
function sidewinder(delay: number, i: number) {
  if(current == grid[rows - 1][cols - 1]) completed = true;
  if(completed) clearInterval(i)
  runSet.push(current);
  current.render(Colors.start);
  play(delay, current.x, current.y)
  const { x, y } = current;
  let next: Cell;
  let side: Cell;
  if (x < rows - 1) {
    next = grid[x + 1][y];
  } else {
    next = grid[0][y + 1];
  }
  if (!next) return;
  next.render(Colors.debugSecondary);
  if (Math.random() < 0.5) {
    current.walls.right = false;
    next.walls.left = false;
    current.render();
    current.render(Colors.start);
    next.render();
    next.render(Colors.start);
  } else {
    side = runSet[random(0, runSet.length - 1)];
    side.walls.top = false;
    side.render(Colors.debugSecondary);
    setTimeout(() => {
      side.render(Colors.start)
    }, delay * 2 * 100);
    current.render(Colors.start);
    let n = grid[side.x][side.y - 1];
    if(n){
      n.walls.bottom = false;
      n.render(Colors.start);
    }
    runSet = [];
  }
  current = next;
}
// sidewinder();
// dfs()
// let int = setInterval(dfs, 1);

let selected = ""

generate()

$("#start").on("click", ()=>{
  audio.resume()
  completed = false
  console.log(selected)
  if(selected == "sdw") {
    current = grid[0][0];
    let delay = 0.2;
    let i = setInterval(()=>{
      sidewinder(delay, i)
    }, ((delay + delay) * 100) )
  }else if(selected == "dfs") {
    current = grid[random(0, cols - 1)][random(0, rows - 1)];
    let delay = 0.2;
    let i = setInterval(()=>{
      dfs(delay, i)
    }, ((delay * 2) * 100) )
  }
})

$("#sidewinder").on("click", () => {
  current.render()
  selected = "sdw"
  $(".dropdown-toggle").text("Sidewinder Algorithm")
  $(".h5").text(`The Sidewinder algorithm starts with an open passage along the entire the top row, and subsequent rows consist of shorter horizontal passages with one connection to the passage above.

  1. Work through the grid row-wise, starting with the cell at 0,0. 
     Initialize the “run” set to be empty.

  2. Add the current cell to the “run” set.

  3. For the current cell, randomly decide whether to carve east or not.

  4. If a passage was carved, make the new cell the current cell and repeat steps 2-4.

  5. If a passage was not carved, choose any one of the cells in the run set
     and carve a passage north. Then empty the run set, set the next cell in the
     row to be the current cell, and repeat steps 2-5.

  6. Continue until all rows have been processed.`)
})
$("#dfs").on("click", () => {
  visited = []
  selected = "dfs";
  $(".dropdown-toggle").text("Depth-First Search (Recursive Backtracker)")
  $(".h5").text(`The depth-first search algorithm of maze generation is frequently implemented using backtracking. This can be described with a following recursive routine:

  1.  Given a current cell as a parameter,

  2.  Mark the current cell as visited

  3.  While the current cell has any unvisited neighbour cells:

        4. Choose one of the unvisited neighbours

        5. Remove the wall between the current cell and the chosen cell

        6. Invoke the routine recursively for the chosen cell

  7.  When the current cell has no unvisited neighbours, backtrack until it 

      finds a cell with unvisited neighbours, then repeat 4-6 until the entire

      grid has been visited`)
})

$("#reset").on("click", ()=>{
  completed = true
  generate()
})