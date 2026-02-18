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
  isQuizCell?: boolean;
};

export const generateMaze = (rows: number, cols: number): { maze: Cell[][], solutionPath: { r: number, c: number }[] } => {
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
      // To make it more difficult/winding, we can sometimes pick the neighbor that continues in the same direction
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWalls(current, next);
      next.visited = true;
      stack.push(next);
    } else {
      stack.pop();
    }
  }

  const solutionPath = findSolutionPath(maze, rows, cols);

  // Place 1-2 quizzes on the solution path (avoiding start and end)
  if (solutionPath.length > 5) {
    const quizCount = rows > 10 ? 2 : 1;
    const step = Math.floor(solutionPath.length / (quizCount + 1));
    for (let i = 1; i <= quizCount; i++) {
      const pos = solutionPath[i * step];
      maze[pos.r][pos.c].isQuizCell = true;
    }
  }

  return { maze, solutionPath };
};

export const findPath = (maze: Cell[][], start: { r: number, c: number }, target: { r: number, c: number }, rows: number, cols: number): { r: number, c: number }[] => {
  const queue: { r: number, c: number, path: { r: number, c: number }[] }[] = [
    { r: start.r, c: start.c, path: [{ r: start.r, c: start.c }] }
  ];
  const visited = new Set<string>([`${start.r},${start.c}`]);

  while (queue.length > 0) {
    const { r, c, path } = queue.shift()!;

    if (r === target.r && c === target.c) return path;

    const currentCell = maze[r][c];
    const directions = [
      { dr: -1, dc: 0, wall: 'top' },
      { dr: 1, dc: 0, wall: 'bottom' },
      { dr: 0, dc: -1, wall: 'left' },
      { dr: 0, dc: 1, wall: 'right' },
    ];

    for (const { dr, dc, wall } of directions) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;

      if (
        nr >= 0 && nr < rows &&
        nc >= 0 && nc < cols &&
        !visited.has(key) &&
        !(currentCell.walls as any)[wall]
      ) {
        visited.add(key);
        queue.push({ r: nr, c: nc, path: [...path, { r: nr, c: nc }] });
      }
    }
  }
  return [];
};

const findSolutionPath = (maze: Cell[][], rows: number, cols: number): { r: number, c: number }[] => {
  return findPath(maze, { r: 0, c: 0 }, { r: rows - 1, c: cols - 1 }, rows, cols);
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
