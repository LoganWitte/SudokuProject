/*
This file implements Donald Knuth's "Algorithm X" and "Dancing Links"
It uses these techniques to find and count all unique solutions to a given sudoku puzzle
This is useful because using backtracking for difficult boards takes extreme amounts of time
Using this technique is very quick, generating up to 21-hint boards in under a second (on my pc) and larger boards much quicker
In sudoku for a puzzle to be guarunteed some unique solution it must have 21 hints, although unique boards do exist down to 17 hints
Beyond this, it has been proven that they do not. Implementing down to 17-hint boards is possible, although it would require much more computation
This can be done by throwing out "solved" boards which cannot be reduced to <21 hints and starting with another.
However, Given that there are roughly only 50000 unique 17-hint boards and over 6.6*10^21 possible solved boards, 
your chance of generating a board that can be reduced to 17 hints is very low. There may be a smarter way to generate them but I'm unsure.
*/

// Class for each node in the matrix
// The matrix is a collection of columns
// Each column is doubly linked and circular
// Each node points to its 4 neighbors as well as its column
class DLXNode {
    left: DLXNode; // Reference to the node on the left
    right: DLXNode; // Reference to the node on the right
    up: DLXNode; // Reference to the node above
    down: DLXNode; // Reference to the node below
    column: ColumnNode; // Reference to the column this node belongs to

    constructor(column: ColumnNode) {
        this.left = this;
        this.right = this;
        this.up = this;
        this.down = this;
        this.column = column;
    }
}

// Class for each column within the matrix
class ColumnNode extends DLXNode {
    size: number; // Number of nodes in this column
    name: number; // Name of the column

    constructor(name: number) {
        super(null!); // Calls DLXNode constructor with a temporary null value
        this.size = 0;
        this.name = name;
        this.column = this; // Sets the column reference to itself
    }

    // Method to add a node to the right of this column
    addRight(node: ColumnNode) {
        node.right = this.right;
        node.left = this;
        this.right.left = node;
        this.right = node;
    }
}

class DancingLinks {
    header: ColumnNode; // The header node of the matrix
    solutionCount: number; // Total number of solutions found

    constructor(matrix: number[][]) {
        this.header = this.createDLX(matrix);
        this.solutionCount = 0;
    }

    // Method to create the doubly linked matrix from the given sudoku board
    createDLX(matrix: number[][]): ColumnNode {
        const header = new ColumnNode(-1); // Create a dummy header node
        const columnNodes: ColumnNode[] = []; // Array to store column nodes

        // Create column nodes for each column in the matrix
        for (let i = 0; i < matrix[0].length; i++) {
            const columnNode = new ColumnNode(i);
            columnNodes.push(columnNode);
            header.addRight(columnNode); // Add the column node to the right of the header
        }

        // Populate the matrix with nodes based on the given board
        for (let i = 0; i < matrix.length; i++) {
            let previous: DLXNode | null = null;
            for (let j = 0; j < matrix[i].length; j++) {
                if (matrix[i][j] === 1) {
                    const columnNode = columnNodes[j];
                    const newNode = new DLXNode(columnNode);

                    if (previous === null) {
                        previous = newNode;
                    }

                    // Link the new node to its neighboring nodes
                    columnNode.up.down = newNode;
                    newNode.down = columnNode;
                    newNode.up = columnNode.up;
                    columnNode.up = newNode;

                    previous.right.left = newNode;
                    newNode.right = previous.right;
                    newNode.left = previous;
                    previous.right = newNode;

                    columnNode.size++; // Increment the size of the column
                }
            }
        }

        return header; // Return the header node of the matrix
    }

    // Method to cover a column
    cover(column: ColumnNode) {
        column.right.left = column.left;
        column.left.right = column.right;

        // Iterate through the nodes in the covered column
        for (let row = column.down; row !== column; row = row.down) {
            for (let node = row.right; node !== row; node = node.right) {
                // Remove the node from its row and update column sizes
                node.down.up = node.up;
                node.up.down = node.down;
                node.column.size--;
            }
        }
    }

    // Method to uncover a column
    uncover(column: ColumnNode) {
        // Iterate through the nodes in the covered column (in reverse order)
        for (let row = column.up; row !== column; row = row.up) {
            for (let node = row.left; node !== row; node = node.left) {
                // Add the node back to its row and update column sizes
                node.column.size++;
                node.down.up = node;
                node.up.down = node;
            }
        }

        // Reconnect the column to the matrix
        column.right.left = column;
        column.left.right = column;
    }

    // Method to recursively search for solutions
    search() {
        // If all columns are covered, a solution is found
        if (this.header.right === this.header) {
            this.solutionCount++;
            return;
        }

        let column: ColumnNode | null = null;
        let minSize = Infinity;

        // Find the column with the fewest nodes
        for (let col = this.header.right; col !== this.header; col = col.right) {
            const colNode = col as ColumnNode;
            if (colNode.size < minSize) {
                minSize = colNode.size;
                column = colNode;
            }
        }

        // Cover the selected column
        if (column === null) {
            return;
        }

        this.cover(column);

        // Recursively search for solutions
        for (let row = column.down; row !== column; row = row.down) {
            for (let node = row.right; node !== row; node = node.right) {
                this.cover(node.column);
            }

            this.search();

            for (let node = row.left; node !== row; node = node.left) {
                this.uncover(node.column);
            }
        }

        // Uncover the selected column for backtracking
        this.uncover(column);
    }

    // Method to convert a sudoku board to a matrix representation
    static sudokuToMatrix(board: number[][]): number[][] {
        const size = 9; // Size of the sudoku board
        const subgrid = 3; // Size of each subgrid
        const matrix: number[][] = []; // Initialize the matrix

        // Iterate through each cell in the board
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                // If the cell is filled, create a row in the matrix
                if (board[row][col] !== 0) {
                    const num = board[row][col];
                    const matrixRow = new Array(size * size * 4).fill(0);
                    matrixRow[row * size + col] = 1;
                    matrixRow[size * size + row * size + num - 1] = 1;
                    matrixRow[2 * size * size + col * size + num - 1] = 1;
                    matrixRow[3 * size * size + (Math.floor(row / subgrid) * subgrid + Math.floor(col / subgrid                    )) * size + num - 1] = 1;
                    matrix.push(matrixRow); // Add the constructed row to the matrix
                } else {
                    // If the cell is empty, create a row for each possible number
                    for (let num = 1; num <= size; num++) {
                        const matrixRow = new Array(size * size * 4).fill(0);
                        matrixRow[row * size + col] = 1;
                        matrixRow[size * size + row * size + num - 1] = 1;
                        matrixRow[2 * size * size + col * size + num - 1] = 1;
                        matrixRow[3 * size * size + (Math.floor(row / subgrid) * subgrid + Math.floor(col / subgrid)) * size + num - 1] = 1;
                        matrix.push(matrixRow); // Add the constructed row to the matrix
                    }
                }
            }
        }
        return matrix; // Return the constructed matrix
    }
}

// Exported function to count the number of sudoku solutions
export function countSudokuSolutions(board: number[][]): number {
    const matrix = DancingLinks.sudokuToMatrix(board); // Convert sudoku board to matrix
    const dlx = new DancingLinks(matrix); // Initialize DancingLinks object
    dlx.search(); // Search for solutions
    return dlx.solutionCount; // Return the total number of solutions found
}

