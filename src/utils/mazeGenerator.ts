export type Cell = {
  r: number;
  c: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  visited: boolean;
};

export const generateMaze = (rows: number, cols: number): Cell[][] => {
  const maze: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        r,
        c,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      });
    }
    maze.push(row);
  }

  const stack: Cell[] = [];
  const startCell = maze[0][0];
  startCell.visited = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, maze, rows, cols);

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWalls(current, next);
      next.visited = true;
      stack.push(next);
    } else {
      stack.pop();
    }
  }

  return maze;
};

const getUnvisitedNeighbors = (cell: Cell, maze: Cell[][], rows: number, cols: number): Cell[] => {
  const neighbors: Cell[] = [];
  const { r, c } = cell;

  if (r > 0 && !maze[r - 1][c].visited) neighbors.push(maze[r - 1][c]);
  if (r < rows - 1 && !maze[r + 1][c].visited) neighbors.push(maze[r + 1][c]);
  if (c > 0 && !maze[r][c - 1].visited) neighbors.push(maze[r][c - 1]);
  if (c < cols - 1 && !maze[r][c + 1].visited) neighbors.push(maze[r][c + 1]);

  return neighbors;
};

const removeWalls = (c1: Cell, c2: Cell) => {
  const dr = c1.r - c2.r;
  const dc = c1.c - c2.c;

  if (dr === 1) {
    c1.walls.top = false;
    c2.walls.bottom = false;
  } else if (dr === -1) {
    c1.walls.bottom = false;
    c2.walls.top = false;
  } else if (dc === 1) {
    c1.walls.left = false;
    c2.walls.right = false;
  } else if (dc === -1) {
    c1.walls.right = false;
    c2.walls.left = false;
  }
};
