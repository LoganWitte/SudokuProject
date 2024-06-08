import { countSudokuSolutions } from './sudokuSolverAlgX';

// Checks if row, column, and box already contain n
function checkValidity(board: number[][], row: number, column: number, n: number): boolean {
    
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(column / 3) * 3;

    for (let i = 0; i < 9; i++) {
        // Check row and column
        if (board[row][i] === n || board[i][column] === n) {
            return false;
        }

        // Check the 3x3 box
        const boxRow = startRow + Math.floor(i / 3);
        const boxCol = startCol + (i % 3);
        if (board[boxRow][boxCol] === n) {
            return false;
        }
    }

    return true;
}

// Puts number in valid position in square
function fillSquare(board: number[][], desiredNumber: number, squarePosition: number) {
    if(desiredNumber > 9) {
        return true;
    }
    let availableSquares = [];
    const startRow = Math.floor(squarePosition / 3) * 3;
    const startCol = (squarePosition % 3) * 3;

    
    for(let i = 0; i < 3; i++) {
        for(let j = 0; j < 3; j++) {
            let cell = board[startRow + i][startCol + j];
            if(cell === 0) {
                availableSquares.push(i * 3 + j);
            }
        }
    }

    while(availableSquares.length > 0) {
        const selectedSquare = availableSquares.splice(Math.floor(Math.random() * availableSquares.length), 1)[0];
        const row = startRow + Math.floor(selectedSquare / 3);
        const col = startCol + (selectedSquare % 3);
        if(checkValidity(board, row, col, desiredNumber)) {
            board[row][col] = desiredNumber;
            
            let newSquarePosition = squarePosition + 1;
            let newDesiredNumber = desiredNumber;
            if(newSquarePosition === 9) {
                newDesiredNumber = desiredNumber + 1;
                newSquarePosition = 0;
            }
            if(fillSquare(board, newDesiredNumber, newSquarePosition)) {
                return true;
            }
            else {
                board[row][col] = 0;
            }
        }
    }
    return false;
}

//Removes a certain number of squares
function removeSquares(board: number[][], removableSquares: number[], removalCount: number): number[][] {
    
    //Returns board whenever all squares are removed
    if(removalCount === 0 || removableSquares.length === 0) {
        return board;
    }
    
    //Generates random index to remove
    const index: number = removableSquares.splice(Math.floor(Math.random() * removableSquares.length), 1)[0];
    const row: number = Math.floor(index / 9);
    const col: number = index % 9;

    //Removes index
    const oldValue = board[row][col];
    board[row][col] = 0;
    
    //If unique solution continues, otherwise reverts to previous state
    if(countSudokuSolutions(board) === 1) {
        return removeSquares(board, removableSquares, removalCount - 1);
    }
    else {
        board[row][col] = oldValue;
        return removeSquares(board, removableSquares, removalCount);
    }
}

//Returns a valid sudoku board and its single unique solution
export function createBoard(numbersToRemove: number): [number[][], number[][]] {

    //Generates valid solved board
    let solvedBoard: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
    fillSquare(solvedBoard, 1, 0);

    /*
    //Debug
    console.log(`numbersToRemove: ${numbersToRemove}`); 
    const currentTime = new Date();
    */    

    //Generates unsolved board with valid solution after removing 'numbersToRemove' squares
    let unsolvedBoard: number[][] = removeSquares(solvedBoard.map(i => [...i]), Array.from({ length: 81 }, (_, i) => i), numbersToRemove);
    
    /*
    //Debug
    console.log(`Time taken: ${new Date().getTime() - currentTime.getTime()}ms`);
    let text: string = "";
    for(let i = 0; i < 9; i++) {
        for(let j = 0; j < 9; j++) {
            text += unsolvedBoard[i][j].toString();
        }
    }
    console.log(text + "\n---------------------------------------------------------------------------------");
    */

    return [unsolvedBoard, solvedBoard];
}