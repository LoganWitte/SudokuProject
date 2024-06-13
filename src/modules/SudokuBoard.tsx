import React, { useEffect, useState } from 'react';
import { createBoard } from '../scripts/boardGenerator';

/*
TODO:
    Mobile UI?
    Win/Loss/Pause screen soon
*/

// Contains data for each individual sudoku cell
class cell {
    value: number = -1;
    notes: boolean[] = Array(9).fill(false);
    index: number = -1; //0-based, 0-80
    column: number = -1; //0-based, 0-8
    row: number = -1; //0-based, 0-8
    box: number = -1; //0-based, 0-8
    isStatic: boolean = false;

    getNote(n: number) {return this.notes[n]}

    constructor(value: number, notes: boolean[], index: number) {
        this.value = value;
        this.notes = notes;
        this.index = index;
        this.column = index % 9;
        this.row = Math.floor(index / 9);
        this.box = Math.floor(this.column / 3) + Math.floor(this.row / 3) * 3;
        this.isStatic = this.value !== 0;
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

//Gives rgb values for given cell number (0-based)
const rgbValues = ["255, 0, 64", "0, 255, 0", "0, 0, 255", "255, 255, 0", "0, 255, 255", "255, 0, 255", "255, 165, 0", "128, 0, 128", "165, 42, 42"];

// Converts cell numbers to color of cell in colorful mode
const numToColors: string[] = ["red", "green", "blue", "yellow", "cyan", "magenta", "orange", "purple", "brown"];

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
    const [rowsFrequencies, setRowsFrequencies] = useState<number[][]>(Array.from({ length: 9 }, () => Array(10).fill(0)));
    const [colsFrequencies, setColsFrequencies] = useState<number[][]>(Array.from({ length: 9 }, () => Array(10).fill(0)));
    const [boxFrequencies, setBoxFrequencies] = useState<number[][]>(Array.from({ length: 9 }, () => Array(10).fill(0)));
    const [colorMode, setColorMode] = useState<boolean>(false);

    // Updates the board depending on a given cellAction
    function updateCell(action: cellAction, undo: boolean = false) {

        if (!cells || !correctValues || !cells) return null;

        setProgress(true);
        const row = action.row;
        const col = action.column;
        const box = Math.floor(col / 3) + Math.floor(row / 3) * 3;
        const oldValue = action.oldValue;
        const newValue = action.newValue;
        let newCells = cells.map(subArray => subArray.slice());
        let cellToUpdate = newCells[row][col];
        cellToUpdate.value = newValue;
        cellToUpdate.notes = action.newNotes;

        // Updates frequency lists
        let oldRowsFrequencies = rowsFrequencies.map(i => i.slice());
        let oldColsFrequencies = colsFrequencies.map(i => i.slice());
        let oldBoxFrequencies = boxFrequencies.map(i => i.slice());
        oldRowsFrequencies[row][oldValue] --;
        oldRowsFrequencies[row][newValue] ++;
        oldColsFrequencies[col][oldValue] --;
        oldColsFrequencies[col][newValue] ++;
        oldBoxFrequencies[box][oldValue] --;
        oldBoxFrequencies[box][newValue] ++;
        setRowsFrequencies(oldRowsFrequencies);
        setColsFrequencies(oldColsFrequencies);
        setBoxFrequencies(oldBoxFrequencies);

        // Checks for mistakes (not if undoing or erasing)
        if(newValue !== 0 && correctValues[row][col] !== newValue && !undo) {
            setMistakes(mistakes + 1);
        }
        
        // Updates specified cell
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
        
        let newRowsFrequencies: number[][] = Array.from({ length: 9 }, () => Array(10).fill(0));
        let newColsFrequencies: number[][] = Array.from({ length: 9 }, () => Array(10).fill(0));
        let newBoxFrequencies: number[][] = Array.from({ length: 9 }, () => Array(10).fill(0));

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cellValue = newUnsolvedBoard[i][j]
                const newCell: cell = new cell(cellValue, Array(9).fill(false), i * 9 + j);

                newCells[i][j] = newCell;
                newCorrectValues[i][j] = newSolvedBoard[i][j];

                newRowsFrequencies[i][cellValue] ++;
                newColsFrequencies[j][cellValue] ++;
                newBoxFrequencies[newCell.box][cellValue] ++;
            }
        }
        setCells(newCells);
        setCorrectValues(newCorrectValues);
        setRowsFrequencies(newRowsFrequencies);
        setColsFrequencies(newColsFrequencies);
        setBoxFrequencies(newBoxFrequencies);
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

    // Generates board on page load
    useEffect(() => {
        generateBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Creates keyboard listener for number input
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
                    cells?.map((row) => row.map((cell) => {

                        const cellValue: number = cell.value
                        const cellNotes: boolean[] = cell.notes;
                        const isNotStatic: boolean = !cell.isStatic;
                        const cellRow: number = cell.row;
                        const cellCol: number = cell.column;
                        const cellBox: number = cell.box;
                        const cellIndex: number = cell.index;
                        const isSelected: boolean = selectedCell?.index === cellIndex;
                        const isSameNumber: boolean = !isSelected && (cellValue !== 0 && selectedCell?.value === cellValue);
                        const isHighlighted: boolean = (!isSelected && !isSameNumber) && (selectedCell?.row === cellRow || selectedCell?.column === cellCol || selectedCell?.box === cellBox);
                        const isSourceError: boolean = (cellValue !== 0) && (cellValue !== correctValues![cellRow][cellCol]);
                        const isError: boolean = (cellValue !== 0) && ((rowsFrequencies[cellRow][cellValue] > 1) || (colsFrequencies[cellCol][cellValue] > 1) || (boxFrequencies[cellBox][cellValue] > 1));

                        const classNames = [
                            'gridItem',
                            isSelected && 'selectedCell',
                            isSameNumber && 'sameNumberCell',
                            (!colorMode && isHighlighted) && 'highlightedCell',
                            isNotStatic && 'nonStaticCell',
                            (!colorMode && (isSourceError || isError)) && 'errorCell',
                        ].filter(Boolean).join(' ');

                        let backgroundColor: string;
                        let backgroundOpacity: string;
                        if(cellValue !== 0 && colorMode) {
                            backgroundColor = rgbValues[cellValue-1];
                            backgroundOpacity = isSelected ? "0.65" : isSourceError ? "0.55" : isSameNumber ? "0.5" : "0.35";
                        }
                        else {
                            backgroundColor = isSelected ? "150, 150, 150" : isSameNumber ? "175, 175, 175" : isHighlighted ? "200, 200, 200" : "255, 255, 255";
                            backgroundOpacity = "1";
                        }

                        return(
                            <div 
                                className={classNames} 
                                onClick={() => selectCell(cell)}
                                style={{
                                    background: `rgba(${backgroundColor}, ${backgroundOpacity})`, 
                                    fontWeight: `${(isSelected || isSourceError) ? "350" : "300"}`,
                                    ...(colorMode && { color: isError ? "red" : "black" })
                                }}
                            >
                                {(cell.value === 0 ? 
                                    <div className="noteGrid"> 
                                        {cellNotes[0] ? <div className={"noteGridItem"} style={{background: colorMode ? `rgba(${rgbValues[0]}, 0.35)` : "inherit"}}>{'1'}</div> : <div className="noteGridItem"></div>}
                                        {cellNotes[1] ? <div className={"noteGridItem"} style={{background: colorMode ? `rgba(${rgbValues[1]}, 0.35)` : "inherit"}}>{'2'}</div> : <div className="noteGridItem"></div>}
                                        {cellNotes[2] ? <div className={"noteGridItem"} style={{background: colorMode ? `rgba(${rgbValues[2]}, 0.35)` : "inherit"}}>{'3'}</div> : <div className="noteGridItem"></div>}
                                        {cellNotes[3] ? <div className={"noteGridItem"} style={{background: colorMode ? `rgba(${rgbValues[3]}, 0.35)` : "inherit"}}>{'4'}</div> : <div className="noteGridItem"></div>}
                                        {cellNotes[4] ? <div className={"noteGridItem"} style={{background: colorMode ? `rgba(${rgbValues[4]}, 0.35)` : "inherit"}}>{'5'}</div> : <div className="noteGridItem"></div>}
                                        {cellNotes[5] ? <div className={"noteGridItem"} style={{background: colorMode ? `rgba(${rgbValues[5]}, 0.35)` : "inherit"}}>{'6'}</div> : <div className="noteGridItem"></div>}
                                        {cellNotes[6] ? <div className={"noteGridItem"} style={{background: colorMode ? `rgba(${rgbValues[6]}, 0.35)` : "inherit"}}>{'7'}</div> : <div className="noteGridItem"></div>}
                                        {cellNotes[7] ? <div className={"noteGridItem"} style={{background: colorMode ? `rgba(${rgbValues[7]}, 0.35)` : "inherit"}}>{'8'}</div> : <div className="noteGridItem"></div>}
                                        {cellNotes[8] ? <div className={"noteGridItem"} style={{background: colorMode ? `rgba(${rgbValues[8]}, 0.35)` : "inherit"}}>{'9'}</div> : <div className="noteGridItem"></div>}
                                    </div>
                                    :
                                    <div>{cellValue}</div>
                                )}
                            </div>
                        )
                    }))
                }</div>

            </div>

            <div className="gameButtons">
                <div className="gameInfo">
                    <div className="infoDiv">Mistakes: <span style={{ fontWeight: 'bold', marginLeft: '0.5em' }}>{String(mistakes)}/3</span></div>
                    <div className="infoDiv">
                        {timerString}
                        <div className="timerPauseButton" onClick={() => setTimerPaused(!timerPaused)}>
                            {timerPaused ?
                                <i className="pauseIcon fa fa-play" style={{width: '1em', height: '1em'}} />
                                :
                                <i className="pauseIcon fa fa-pause" style={{width: '1em', height: '1em'}} />
                            }
                        </div>
                    </div>
                    <div className="infoDiv">
                    <label className="switch">
                        <input type="checkbox"/>
                        <span className="slider round" onClick={() => setColorMode(!colorMode)}></span>
                    </label>
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