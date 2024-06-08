import React, { useEffect, useState } from 'react';
import { createBoard } from '../scripts/boardGenerator';

/*
TODO:
    Redo way that errors are handled and set
    Implement colorful UI option
*/

// Contains data for each individual sudoku cell
class cell {
    value: number = -1;
    notes: boolean[] = Array(9).fill(false);
    index: number | null = null; //0-based, 0-80
    column: number = -1; //0-based, 0-8
    row: number = -1; //0-based, 0-8
    box: number = -1; //0-based, 0-8
    isStatic: boolean = false;
    isError: boolean | null = null;

    getNote(n: number) {return this.notes[n]}

    constructor(value: number, notes: boolean[], index: number) {
        this.value = value;
        this.notes = notes;
        this.index = index;
        this.column = index % 9;
        this.row = Math.floor(index / 9);
        this.box = Math.floor(this.column / 3) + Math.floor(this.row / 3) * 3;
        this.isStatic = this.value !== 0;
        this.isError = false;
    }

    toString(): string {
        return `Index: ${this.index}, Row: ${this.row}, Column: ${this.column}, Value: ${this.value}`;
    }
}

// Holds data for cell changes for the purpose of being able to undo them
class cellAction {
    row: number;
    column: number;
    oldValue: number;
    newValue: number;
    oldNotes: boolean[];
    newNotes: boolean[];

    reverse() {
        [this.oldValue, this.newValue, this.oldNotes, this.newNotes] = [this.newValue, this.oldValue, this.newNotes, this.oldNotes]
    }

    constructor(row: number, column: number, oldValue: number, newValue: number, oldNotes: boolean[], newNotes: boolean[]) {
        this.row = row;
        this.column = column;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.oldNotes = oldNotes;
        this.newNotes = newNotes;
    }
}

// Converts difficulties to number of cells to remove
const missingCells = {
    easy: 33,
    medium: 41,
    hard: 48,
    expert: 53,
    extreme: 60
} as const;

// This module renders the whole game area of the sudoku website
export default function SudokuBoard() {

    // UseState mess
    const [cells, setCells] = useState<cell[][] | null>(null);
    const [correctValues, setCorrectValues] = useState<number[][] | null>(null);
    const [selectedCell, setSelectedCell] = useState<cell | null>(null);
    const [noteMode, setNoteMode] = useState<boolean>(false);
    const [difficulty, setDifficulty] = useState<number>(missingCells.easy);
    const [timerString, setTimerString] = useState<String>("00:00");
    const [timeSeconds, setTimeSeconds] = useState<number>(0);
    const [timeMinutes, setTimeMinutes] = useState<number>(0);
    const [timeHours, setTimeHours] = useState<number>(0);
    const [mistakes, setMistakes] = useState<number>(0);
    const [timerPaused, setTimerPaused] = useState<boolean>(false);
    const [undoHistory, setUndoHistory] = useState<cellAction[]>([]);
    const [progress, setProgress] = useState<boolean>(false);

    //REDO
    // Updates the board depending on a given cellAction
    function updateCell(action: cellAction, undo: boolean = false) {

        if (!cells || !correctValues || !cells) return null;

        setProgress(true);
        const row = action.row;
        const col = action.column;
        const newValue = action.newValue;
        let newCells = cells.map(subArray => subArray.slice());
        let cellToUpdate = newCells[row][col];
        cellToUpdate.value = newValue;
        cellToUpdate.notes = action.newNotes;

        // Checks for mistakes (not if undoing)
        cells[row][col].isError = checkError(cellToUpdate);
        if(newValue !== 0 && correctValues[row][col] !== newValue && !undo) {
            setMistakes(mistakes + 1);
        }
        
        //Re-renders board
        setCells(newCells);
    }

    // Undoes the most recent action in undoHistory[]
    function undo() {
        let action = undoHistory[undoHistory.length - 1];
        setUndoHistory(undoHistory.slice(0, -1));
        //if undo array is empty, return
        if(!action) {
            return;
        }
        action.reverse();
        updateCell(action, true);
    }

    // Handles number/note input
    // Rewrite later - code looks super confusing. Could be better by having a seperate section for when user clicks '0'
    function clickNumber(option: number) {
        //If no cell is selected or selected cell is static then changes nothing
        if (!selectedCell || selectedCell.isStatic) {
            return;
        }
        let row = selectedCell.row;
        let col = selectedCell.column;
        if (noteMode) {
            let newNotes;
            if(option === 0) {
                //Changes nothing if notes are already empty
                if(!selectedCell.notes.includes(true)) {
                    return;
                }
                newNotes = Array(9).fill(false);
            }
            else {
                newNotes = [...selectedCell.notes];
                newNotes[option - 1] = !newNotes[option - 1];
            }
            let action = new cellAction(row, col, selectedCell.value, 0, selectedCell.notes, newNotes);
            updateCell(action);
            let newUndoHistory = undoHistory;
            newUndoHistory[newUndoHistory.length] = action;
            setUndoHistory(undoHistory);
        }
        else {
            //Changes nothing if cell/notes are empty and input is 0
            if(option === 0 && selectedCell.value === 0 && !selectedCell.notes.includes(true)) {
                return;
            }
            if (option === selectedCell.value) {
                option = 0;
            }
            let action = new cellAction(row, col, selectedCell.value, option, selectedCell.notes, Array(9).fill(false));
            updateCell(action);
            let newUndoHistory = undoHistory;
            newUndoHistory[newUndoHistory.length] = action;
            setUndoHistory(undoHistory);
        }
    }

    // Generates a new board
    function generateBoard(newDifficulty: number = difficulty) {
        let [newUnsolvedBoard, newSolvedBoard] = createBoard(newDifficulty);
        let newCells: cell[][] | null = Array.from({ length: 9 }, () => Array(9).fill(null));
        let newCorrectValues: number[][] | null = Array.from({ length: 9 }, () => Array(9).fill(null));
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                newCells[i][j] = new cell(newUnsolvedBoard[i][j], Array(9).fill(false), i * 9 + j);
                newCorrectValues[i][j] = newSolvedBoard[i][j];
            }
        }
        setCells(newCells);
        setCorrectValues(newCorrectValues);
    }

    function resetBoard(newDifficulty: number | null = null) {
        let continueResetting;
        if(progress) {
            continueResetting = window.confirm("Are you sure? Current game progress will be lost.");
        }
        else {
            continueResetting = true;
        }
        if(continueResetting) {
            if(newDifficulty) {
                setDifficulty(newDifficulty);
            }
            generateBoard(newDifficulty ? newDifficulty : difficulty);
            setSelectedCell(null);
            setNoteMode(false);
            setTimerString("00:00");
            setTimeSeconds(0);
            setTimeMinutes(0);
            setTimeHours(0);
            setMistakes(0);
            setTimerPaused(false);
            setUndoHistory([]);
            setProgress(false);
        }
    }

    // Generates board
    useEffect(() => {
        generateBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Creates keyboard listener
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key >= '0' && event.key <= '9') {
                clickNumber(Number(event.key));
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    });

    // Timer functionality
    useEffect(() => {

        let timeS = timeSeconds;
        let timeM = timeMinutes;
        let timeH = timeHours;
        if (!timerPaused) {
            const interval = setInterval(() => {
                if (timerPaused) {
                    clearInterval(interval);
                }

                timeS++;
                if (timeS > 59) {
                    timeS = 0;
                    timeM++;
                }
                if (timeM > 59) {
                    timeM = 0;
                    timeH++;
                }
                setTimerString(`${timeH > 0 ? String(timeH) + ':' : ''}${timeM > 9 ? String(timeM) : '0' + String(timeM)}:${timeS > 9 ? String(timeS) : '0' + String(timeS)}`);
                setTimeSeconds(timeS);
                setTimeMinutes(timeM);
                setTimeHours(timeH);

            }, 1000);
            return () => clearInterval(interval);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timerPaused, resetBoard]);

    // Selects a given cell
    function selectCell(cell: cell) {
        if (cell === selectedCell) {
            setSelectedCell(null);
        }
        else {
            setSelectedCell(cell);
        }
    }

    //REDO
    // Checks for errors in a given cell and updates its related cells' error status
    function checkError(cell: cell): boolean {
        if(!cells) {
            return true;
        }
        const val: number = cell.value;
        const row = cell.row;
        const col = cell.column;
        const box = cell.box;
        const startRow = Math.floor(box / 3) * 3;
        const startCol = (box % 3) * 3;
        let currentCell: cell;
        let foundError: boolean = false;
        for(let i = 0; i < 9; i++) {
            //Checks columns
            if(i !== col) {
                currentCell = cells[row][i];
                if(val !== 0 && currentCell.value === val) {
                    currentCell.isError = true;
                    foundError = true;
                }
                else {
                    currentCell.isError = false;
                }
            }
            //Checks rows
            if(i !== row) {
                currentCell = cells[i][col];
                if(val !== 0 && currentCell.value === val) {
                    currentCell.isError = true;
                    foundError = true;
                }
                else {
                    currentCell.isError = false;
                }
            }
        }
        //Checks box
        for(let i = 0; i < 3; i++) {
            for(let j = 0; j < 3; j++) {
                if(((startRow + i) !== row) && ((startCol + j) !== col)) {
                    currentCell = cells[startRow + i][startCol + j];
                    if(val !== 0 && currentCell.value === val) {
                        currentCell.isError = true;
                        foundError = true;
                    }
                    else {
                        currentCell.isError = false;
                    }
                }
            }
        }
        return foundError;
    }

    // HTML stuff
    return (
        <div className="gameContainer">

            <div>
                <div className="difficultySelector">
                    <div style={{ paddingTop: '0.5em', fontWeight: 'bold' }}>Difficulty:</div>
                    <div className={`difficultyOption ${difficulty === missingCells.easy && 'selected'}`} onClick={() => resetBoard(missingCells.easy)}>Easy</div>
                    <div className={`difficultyOption ${difficulty === missingCells.medium && 'selected'}`} onClick={() => resetBoard(missingCells.medium)}>Medium</div>
                    <div className={`difficultyOption ${difficulty === missingCells.hard && 'selected'}`} onClick={() => resetBoard(missingCells.hard)}>Hard</div>
                    <div className={`difficultyOption ${difficulty === missingCells.expert && 'selected'}`} onClick={() => resetBoard(missingCells.expert)}>Expert</div>
                    <div className={`difficultyOption ${difficulty === missingCells.extreme && 'selected'}`} onClick={() => resetBoard(missingCells.extreme)}>Extreme</div>
                </div>
                
                <div className="grid"> {
                    cells?.map((row) => row.map((cell) => 
                        <div
                        className={`${'gridItem' +
                            (selectedCell?.index === cell.index ? ' selectedCell' : '') +
                            ((cell.value !== 0 && selectedCell?.value === cell.value) ? ' sameNumberCell' : '') +
                            ((selectedCell?.row === cell.row || selectedCell?.column === cell.column || selectedCell?.box === cell.box) ? ' highlightedCell' : '') +
                            (!cell.isStatic ? ' nonStaticCell' : '') +
                            (cell.isError ? ' errorCell' : '')}`
                        }
                        onClick={() => selectCell(cell)}
                        key={cell.index}
                        >
                        {(cell.value === 0 ? 
                        <div className="noteGrid"> 
                            <div className="noteGridItem">{cell.getNote(0) && '1'}</div>
                            <div className="noteGridItem">{cell.getNote(1) && '2'}</div>
                            <div className="noteGridItem">{cell.getNote(2) && '3'}</div>
                            <div className="noteGridItem">{cell.getNote(3) && '4'}</div>
                            <div className="noteGridItem">{cell.getNote(4) && '5'}</div>
                            <div className="noteGridItem">{cell.getNote(5) && '6'}</div>
                            <div className="noteGridItem">{cell.getNote(6) && '7'}</div>
                            <div className="noteGridItem">{cell.getNote(7) && '8'}</div>
                            <div className="noteGridItem">{cell.getNote(8) && '9'}</div>
                        </div>
                        :
                        cell.value)}
                    </div>
                    ))
                }</div>

            </div>

            <div className="gameButtons">

                <div className="gameInfo">
                    <div className="infoDiv">Mistakes: <span style={{ fontWeight: 'bold', marginLeft: '0.5em' }}>{String(mistakes)}/3</span></div>
                    <div className="infoDiv">
                        {timerString}
                        <div className="timerPauseButton" onClick={() => setTimerPaused(!timerPaused)}>
                            {timerPaused ?
                                <i className="pauseIcon fa fa-play" style={{ width: '16px', height: '16px' }} />
                                :
                                <i className="pauseIcon fa fa-pause" style={{ width: '16px', height: '16px' }} />
                            }
                        </div>
                    </div>
                </div>

                <div className="buttonContainer">
                    <button className="gameButton" onClick={undo}><i className="fa fa-undo" /></button>
                    <button className="gameButton" onClick={() => clickNumber(0)}><i className="fa fa-eraser" /></button>
                    <button className="gameButton" onClick={() => setNoteMode(!noteMode)} style={{ border: noteMode ? '2px solid black' : 'none' }}><i className="fa fa-pencil" /></button>
                    <div className="gameButtonLabel">Undo</div>
                    <div className="gameButtonLabel">Erase</div>
                    <div className="gameButtonLabel">Notes</div>
                    <button className="numberButton" onClick={() => clickNumber(1)}>1</button>
                    <button className="numberButton" onClick={() => clickNumber(2)}>2</button>
                    <button className="numberButton" onClick={() => clickNumber(3)}>3</button>
                    <button className="numberButton" onClick={() => clickNumber(4)}>4</button>
                    <button className="numberButton" onClick={() => clickNumber(5)}>5</button>
                    <button className="numberButton" onClick={() => clickNumber(6)}>6</button>
                    <button className="numberButton" onClick={() => clickNumber(7)}>7</button>
                    <button className="numberButton" onClick={() => clickNumber(8)}>8</button>
                    <button className="numberButton" onClick={() => clickNumber(9)}>9</button>
                    <button className="newGameButton" onClick={() => resetBoard()}>New Game</button>
                </div>

            </div>

        </div>
    );
}