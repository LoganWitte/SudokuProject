//Checks if row and column already contain n
function checkValidity(board: number[][], row: number, column: number, n: number) {
    for(let i = 0; i < 9; i++) {

        //Checks Row
        if(board[row][i] === n) {
            return false;
        }

        //Checks Column
        if(board[i][column] === n) {
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

//Removes a certain number of squares while preserving uniqueness of solution
function removeSquares(board: number[][], removalCount: number): number[][] {

    let row: number;
    let col: number;
    let newBoard = board.map(i => i.slice());

    for(let i = 0; i < removalCount; i++) {
        do {
            row = Math.floor(Math.random() * 9);
            col = Math.floor(Math.random() * 9);
        }
        while(board[row][col] === 0);
        
        newBoard[row][col] = 0;
    }
    
    return newBoard;
}

//Returns a valid sudoku board and its single unique solution
export function createBoard(numbersToRemove: number): [number[][], number[][]] {
    let solvedBoard: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
    fillSquare(solvedBoard, 1, 0);
    let unsolvedBoard: number[][] = removeSquares(solvedBoard, numbersToRemove);
    return [unsolvedBoard, solvedBoard];
}