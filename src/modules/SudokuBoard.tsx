import React, { useEffect, useState } from 'react';

//Contains data for each individual sudoku cell
class cell {
    value: number = -1;
    notes: boolean[] = Array(9).fill(false);
    correctValue: number | null = null;
    index: number | null = null; //0-based, 0-80
    column: number = -1; //0-based, 0-8
    row: number = -1; //0-based, 0-8
    box: number = -1; //0-based, 0-8
    isStatic: boolean | null = null;
    isError: boolean | null = null;

    getValue() { return this.value }
    setValue(value: number) { this.value = value }
    getNotes() { return this.notes }
    setNotes(notes: boolean[]) { this.notes = notes }
    getCorrectValue() {return this.correctValue}
    getIndex() { return this.index }
    getColumn() { return this.column }
    getRow() { return this.row }
    getBox() { return this.box }
    getIsStatic() { return this.isStatic }
    getIsError() { return this.isError }
    setIsError(isError: boolean) {this.isError = isError}

    constructor(value: number, notes: boolean[], correctValue: number, index: number) {
        this.value = value;
        this.notes = notes;
        this.correctValue = correctValue;
        this.index = index;
        this.column = index % 9;
        this.row = Math.floor(index / 9);
        this.box = Math.floor(this.column / 3) + Math.floor(this.row / 3) * 3;
        this.isStatic = this.value !== 0;
        this.isError = false;
    }
}

//Holds data for cell changes for the purpose of being able to undo them
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

//This module renders the whole game area of the sudoku website
export default function SudokuBoard() {

    // UseState mess
    const [cells, setCells] = useState<cell[][] | null>(null);
    const [selectedCell, setSelectedCell] = useState<cell | null>(null);
    const [noteMode, setNoteMode] = useState(false);
    const [difficulty, setDifficulty] = useState<number | null>(1);
    const [timerString, setTimerString] = useState<String | null>("00:00");
    const [timeSeconds, setTimeSeconds] = useState(0);
    const [timeMinutes, setTimeMinutes] = useState(0);
    const [timeHours, setTimeHours] = useState(0);
    const [mistakes, setMistakes] = useState<number>(0);
    const [timerPaused, setTimerPaused] = useState(false);
    const [gridElements, setGridElements] = useState<JSX.Element[]>([]);
    const [undoHistory, setUndoHistory] = useState<cellAction[]>([])

    // Updates the board depending on a given cellAction
    function updateCell(action: cellAction) {
        if (!cells) {
            return;
        }
        let cellToUpdate = cells[action.getColumn()][action.getRow()];
        cellToUpdate.setValue(action.getNewValue());
        cellToUpdate.setNotes(action.getNewNotes());
        renderGridItems();
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
        updateCell(action);
    }

    // Handles number/note input
    function clickNumber(option: number) {
        //If no cell is selected or selected cell is static then changes nothing
        if (!selectedCell || selectedCell.getIsStatic()) {
            return;
        }
        if (noteMode) {
            let newNotes;
            if(option === 0) {
                newNotes = Array(9).fill(false);
            }
            else {
                newNotes = [...selectedCell.getNotes()];
                newNotes[option - 1] = !newNotes[option - 1];
            }
            let action = new cellAction(selectedCell.getRow(), selectedCell.getColumn(), selectedCell.getValue(), 0, selectedCell.getNotes(), newNotes);
            updateCell(action);
            let newUndoHistory = undoHistory;
            newUndoHistory[newUndoHistory.length] = action;
            console.log(newUndoHistory);
            setUndoHistory(undoHistory);
        }
        else {
            if (option === selectedCell.getValue()) {
                option = 0;
            }
            let action = new cellAction(selectedCell.getRow(), selectedCell.getColumn(), selectedCell.getValue(), option, selectedCell.getNotes(), Array(9).fill(false));
            updateCell(action);
            let newUndoHistory = undoHistory;
            newUndoHistory[newUndoHistory.length] = action;
            setUndoHistory(undoHistory);

            //Checks for mistakes
            if(selectedCell.getCorrectValue() !== option && option !== 0) {
                setMistakes(mistakes + 1);
            }
        }
    }

    // Generates board
    useEffect(() => {
        function generateBoard() {
            let boardString = "400060010008000007000520603865700030300600008029050000000005071581000000740000206";
            let correctString = "432867915658193427917524683865749132374612598129358764296435871581276349743981256";
            let newCells: cell[][] | null = Array.from({ length: 9 }, () => Array(9).fill(null));
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    let index = j + i * 9;
                    newCells[j][i] = new cell(Number(boardString[index]), Array(9).fill(false), Number(correctString[index]), index);
                }
            }
            setCells(newCells);
        }
        generateBoard();
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
    }, [timerPaused]);

    // Selects a given cell
    function selectCell(cell: cell) {
        if (cell === selectedCell) {
            setSelectedCell(null);
        }
        else {
            setSelectedCell(cell);
        }
    }

    // Checks the board for mistakes and highlights them
    function checkBoard() {
        if(!cells) {
            return;
        }
        for(let i = 0; i < 9; i++) {
            for(let j = 0; j < 9; j++) {
                cells[j][i].setIsError(false);
            }
        }
        for(let i = 0; i < 9; i++) {
            for(let j = 0; j < 9; j++) {
                let currentCell = cells[j][i];
                let currentCellValue = currentCell.getValue()
                if(currentCellValue === 0 || currentCell.getIsStatic()) {
                    continue;
                }
                if(currentCellValue !== currentCell.getCorrectValue()) {
                    currentCell.setIsError(true);
                    
                    //Checks straight lines
                    for(let k = 0; k < 9; k++) {
                        //Checks row
                        if(cells[j][k].getValue() === currentCellValue) {
                            cells[j][k].setIsError(true);
                        }
                        //Checks column
                        if(cells[k][i].getValue() === currentCellValue) {
                            cells[k][i].setIsError(true);
                        }
                    }

                    //Checks 3x3 box
                    const boxIndex = currentCell.getBox();
                    const startCol = (boxIndex % 3) * 3;
                    const startRow = Math.floor(boxIndex / 3) * 3;
                    for(let i = 0; i < 3; i++) {
                        for(let j = 0; j < 3; j++) {
                            let cell = cells[startCol + j][startRow + i]
                            if(cell.getValue() === currentCellValue) {
                                cell.setIsError(true);
                            }
                        }
                    }

                }
            }
        }
    }

    // Renders the sudoku board
    function renderGridItems() {
        checkBoard();
        if (!cells) {
            return;
        }
        let elements = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                let currentCell = cells[j][i];
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
                    <div className={`difficultyOption ${difficulty === 1 && 'selected'}`} onClick={() => setDifficulty(1)}>Easy</div>
                    <div className={`difficultyOption ${difficulty === 2 && 'selected'}`} onClick={() => setDifficulty(2)}>Medium</div>
                    <div className={`difficultyOption ${difficulty === 3 && 'selected'}`} onClick={() => setDifficulty(3)}>Hard</div>
                    <div className={`difficultyOption ${difficulty === 4 && 'selected'}`} onClick={() => setDifficulty(4)}>Expert</div>
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
                    <button className="newGameButton">New Game</button>
                </div>

            </div>

        </div>
    );
}