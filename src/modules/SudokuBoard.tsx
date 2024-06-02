import React, { useEffect, useState } from 'react';
import { createBoard } from '../scripts/boardGenerator';

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

    getValue() { return this.value }
    setValue(value: number) { this.value = value }
    getNotes() { return this.notes }
    setNotes(notes: boolean[]) { this.notes = notes }
    getIndex() { return this.index }
    getColumn() { return this.column }
    getRow() { return this.row }
    getBox() { return this.box }
    getIsStatic() { return this.isStatic }
    getIsError() { return this.isError }
    setIsError(isError: boolean) {this.isError = isError}

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

    getRow() { return this.row }
    getColumn() { return this.column }
    getOldValue() { return this.oldValue }
    getNewValue() { return this.newValue }
    getOldNotes() { return this.oldNotes }
    getNewNotes() { return this.newNotes }

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
    const [gridElements, setGridElements] = useState<JSX.Element[]>([]);
    const [undoHistory, setUndoHistory] = useState<cellAction[]>([]);
    const [progress, setProgress] = useState<boolean>(false);

    // Updates the board depending on a given cellAction
    function updateCell(action: cellAction, undo: boolean) {
        if (!cells) {
            return;
        }
        setProgress(true);
        const row = action.getRow();
        const col = action.getColumn();
        const newValue = action.getNewValue()
        let newCells = cells.map(subArray => subArray.slice());
        let cellToUpdate = newCells[row][col];
        cellToUpdate.setValue(newValue);
        cellToUpdate.setNotes(action.getNewNotes());

        // Checks for mistakes (not if undoing)
        if(!correctValues || !cells) return;
        cells[row][col].setIsError(checkError(cellToUpdate));
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
        console.log(1);
        //If no cell is selected or selected cell is static then changes nothing
        if (!selectedCell || selectedCell.getIsStatic()) {
            return;
        }
        let row = selectedCell.getRow();
        let col = selectedCell.getColumn();
        if (noteMode) {
            console.log(2);
            let newNotes;
            if(option === 0) {
                console.log(3);
                //Changes nothing if notes are already empty
                if(!selectedCell.getNotes().includes(true)) {
                    console.log(4);
                    return;
                }
                newNotes = Array(9).fill(false);
            }
            else {
                newNotes = [...selectedCell.getNotes()];
                newNotes[option - 1] = !newNotes[option - 1];
            }
            let action = new cellAction(row, col, selectedCell.getValue(), 0, selectedCell.getNotes(), newNotes);
            updateCell(action, false);
            let newUndoHistory = undoHistory;
            newUndoHistory[newUndoHistory.length] = action;
            setUndoHistory(undoHistory);
        }
        else {
            //Changes nothing if cell/notes are empty and input is 0
            if(option === 0 && selectedCell.getValue() === 0 && !selectedCell.getNotes().includes(true)) {
                return;
            }
            if (option === selectedCell.getValue()) {
                option = 0;
            }
            let action = new cellAction(row, col, selectedCell.getValue(), option, selectedCell.getNotes(), Array(9).fill(false));
            updateCell(action, false);
            let newUndoHistory = undoHistory;
            newUndoHistory[newUndoHistory.length] = action;
            setUndoHistory(undoHistory);
        }
    }

    // Generates a new board
    function generateBoard() {
        let [newUnsolvedBoard, newSolvedBoard] = createBoard(difficulty);
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
            generateBoard();
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

    // Checks for errors in a given cell and updates its related cells' error status
    function checkError(cell: cell): boolean {
        console.log("\nChecking: " + cell.toString());
        if(!cells) {
            console.log("Big big trouble");
            return true;
        }
        const val = cell.getValue();
        if(val === 0 || cell.getIsStatic()) {
            return false;
        }
        const row = cell.getRow();
        const col = cell.getColumn();
        const box = cell.getBox();
        const startRow = Math.floor(box / 3) * 3;
        const startCol = (box % 3) * 3;
        let currentCell: cell;
        let foundError: boolean = false;
        for(let i = 0; i < 9; i++) {
            //Checks columns
            if(i !== col) {
                currentCell = cells[row][i];
                if(currentCell.getValue() === val) {
                    console.log("1: Flagged " + currentCell.toString());
                    currentCell.setIsError(true);
                    foundError = true;
                }
                else {
                    currentCell.setIsError(false);
                }
            }
            //Checks rows
            if(i !== row) {
                currentCell = cells[i][col];
                if(currentCell.getValue() === val) {
                    console.log("2: Flagged " + currentCell.toString());
                    currentCell.setIsError(true);
                    foundError = true;
                }
                else {
                    currentCell.setIsError(false);
                }
            }
        }
        //Checks box
        for(let i = 0; i < 3; i++) {
            for(let j = 0; j < 3; j++) {
                if(((startRow + i) !== row) && ((startCol + j) !== col)) {
                    currentCell = cells[startRow + i][startCol + j];
                    if(currentCell.getValue() === val) {
                        console.log("3: Flagged " + currentCell.toString());
                        currentCell.setIsError(true);
                        foundError = true;
                    }
                    else {
                        currentCell.setIsError(false);
                    }
                }
            }
        }
        return foundError;
    }

    // Renders the sudoku board
    function renderGridItems() {
        if (!cells) {
            return;
        }
        let elements = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                let currentCell = cells[i][j];
                let cellNotes = currentCell.getNotes();
                elements.push(
                    <div
                        className={`${'gridItem' +
                            (selectedCell?.getIndex() === currentCell.getIndex() ? ' selectedCell' : '') +
                            ((currentCell.getValue() !== 0 && selectedCell?.getValue() === currentCell.getValue()) ? ' sameNumberCell' : '') +
                            ((selectedCell?.getRow() === currentCell.getRow() || selectedCell?.getColumn() === currentCell.getColumn() || selectedCell?.getBox() === currentCell.getBox()) ? ' highlightedCell' : '') +
                            (!currentCell.getIsStatic() ? ' nonStaticCell' : '') +
                            (currentCell.getIsError() ? ' errorCell' : '')}`
                        }
                        onClick={() => selectCell(currentCell)}
                        key={currentCell.getIndex()}
                    >
                        {(currentCell.getValue() === 0 ? 
                        <div className="noteGrid"> 
                            <div className="noteGridItem">{cellNotes[0] && '1'}</div>
                            <div className="noteGridItem">{cellNotes[1] && '2'}</div>
                            <div className="noteGridItem">{cellNotes[2] && '3'}</div>
                            <div className="noteGridItem">{cellNotes[3] && '4'}</div>
                            <div className="noteGridItem">{cellNotes[4] && '5'}</div>
                            <div className="noteGridItem">{cellNotes[5] && '6'}</div>
                            <div className="noteGridItem">{cellNotes[6] && '7'}</div>
                            <div className="noteGridItem">{cellNotes[7] && '8'}</div>
                            <div className="noteGridItem">{cellNotes[8] && '9'}</div>
                        </div>
                        :
                        currentCell.getValue())}
                    </div>
                )
            }
        }
        setGridElements(elements);
    }

    // Re-renders board when neccesary
    useEffect(() => {
        renderGridItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cells, selectedCell]);

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
                <div className="grid">{gridElements}</div>
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