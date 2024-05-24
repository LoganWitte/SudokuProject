import React, { useEffect, useState } from 'react';

export default function SudokuBoard() {

    const [selectedCell, setSelectedCell] = useState<number | null>(null);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
    const [selectedBox, setSelectedBox] = useState<number | null>(null);
    const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
    const [cellValues, setCellValues] = useState(Array.from({ length: 9 }, () => Array(9).fill('')));
    const [correctCellValues, setCorrectCellValues] = useState(Array.from({ length: 9 }, () => Array(9).fill('')));
    const [errorCells, setErrorCells] = useState(Array.from({ length: 9 }, () => Array(9).fill(false)));
    const [staticCells, setStaticCells] = useState(Array.from({ length: 9 }, () => Array(9).fill(false)));
    const [cellNotes, setCellNotes] = useState(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => false))));
    const [noteMode, setNoteMode] = useState(false);
    const [difficulty, setDifficulty] = useState<number | null>(1);
    const [timerString, setTimerString] = useState<String | null>("00:00");
    const [timeSeconds, setTimeSeconds] = useState(0);
    const [timeMinutes, setTimeMinutes] = useState(0);
    const [timeHours, setTimeHours] = useState(0);
    const [mistakes, setMistakes] = useState<number>(0);
    const [timerPaused, setTimerPaused] = useState(false);

    

    function updateCellValue(row: number, column: number, value: String) {
        //Skips if cell is unchangeable
        if(staticCells[row][column]) {
            return;
        }
        //If user inputs same num as cell then it pretends user clicked 0 (erased)
        if(cellValues[row][column] === value) {
            value = '0';
        }
        //If user inputs 0 then it erases notes (so that it doesnt do it twice, on input and erasure)
        if(value === '0') {
            const newCellNotes = [...cellNotes];
            newCellNotes[row] = [...newCellNotes[row]];
            newCellNotes[row][column] = [...newCellNotes[row][column]];
            newCellNotes[row][column] = Array(9).fill(false);
            setCellNotes(newCellNotes);
        }
        //Sets cell value to new value
        const newValues = [...cellValues];
        newValues[row] = [...newValues[row]];
        newValues[row][column] = value;
        setCellValues(newValues);

        //If cell is set to incorrect value (and operation is not erasure) then it increments mistake counter
        if(value !== '0' && correctCellValues[row][column] !== value) {
            setMistakes(mistakes + 1);
        }
    }

    function toggleNoteValue(row: number, column: number, value: number) {
        if(staticCells[column][row]) {
            return;
        }
        const newCellNotes = [...cellNotes];
        newCellNotes[column] = [...newCellNotes[column]];
        newCellNotes[column][row] = [...newCellNotes[column][row]];
        if(value !== 0) {
            newCellNotes[column][row][value - 1] = !newCellNotes[column][row][value - 1];
        }
        else {
            newCellNotes[column][row] = Array(9).fill(false);
        }
        setCellNotes(newCellNotes);
    }

    useEffect(() => {
        function checkBoard() {
            let newErrorCells = Array.from({ length: 9 }, () => Array(9).fill(false));
            for(let i = 0; i < 9; i++) {
                for(let j = 0; j < 9; j++) {
                    let currentCellValue = cellValues[i][j];
                    if(currentCellValue !== '0' && currentCellValue !== correctCellValues[i][j]) {
                        newErrorCells[i][j] = true;
                        //Checks column
                        for(let k = 0; k < 9; k++) {
                            if(cellValues[i][k] === currentCellValue) {
                                newErrorCells[i][k] = true;
                            }
                        }
                        //Checks row
                        for(let k = 0; k < 9; k++) {
                            if(cellValues[k][j] === currentCellValue) {
                                newErrorCells[k][j] = true;
                            }
                        }
                        //Checks box
                        const boxStartRow = Math.floor(i / 3) * 3;
                        const boxStartCol = Math.floor(j / 3) * 3;
                        for (let m = boxStartRow; m < boxStartRow + 3; m++) {
                            for (let n = boxStartCol; n < boxStartCol + 3; n++) {
                                if ((m !== i || n !== j) && cellValues[m][n] === currentCellValue) {
                                    newErrorCells[m][n] = true;
                                }
                            }
                        }
                    }
                }
            }
            setErrorCells(newErrorCells);
        }
        checkBoard();
    }, [cellValues, correctCellValues]);
    

    function clickCell(index: number, column: number, row: number, box: number) {
        if (selectedCell === index) {
            setSelectedCell(null);
            setSelectedRow(null);
            setSelectedColumn(null);
            setSelectedBox(null);
            setSelectedNumber(null);
        } else {
            setSelectedCell(index);
            setSelectedColumn(column);
            setSelectedRow(row);
            setSelectedBox(box);
            setSelectedNumber(cellValues[column][row]);
        }
    }

    function renderGridItems() {
        const gridItems = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const index = i * 9 + j;
                const box = Math.floor(j / 3) * 3 + Math.floor(i / 3);
                const isSelected = selectedCell === index;
                const isSameNumber = (selectedNumber === cellValues[i][j]) && (cellValues[i][j] !== '0');
                const isHighlighted = selectedColumn === i || selectedRow === j || selectedBox === box;
                const isError = errorCells[i][j];
                const isStatic = staticCells[i][j];
                gridItems.push(
                    <div
                        className={`
                            gridItem 
                            ${isSelected && 'selectedCell'} 
                            ${isSameNumber && 'sameNumberCell'} 
                            ${isHighlighted && 'highlightedCell'}
                            ${isError && 'errorCell'}
                            ${!isStatic && 'nonStaticCell'}
                        `}
                        id={`cell${index}`}
                        key={index}
                        onClick={() => clickCell(index, i, j, box)}
                    >
                        {cellValues[i][j] === '0' ? 
                        <div className="noteGrid">
                            <div className="noteGridItem">{cellNotes[i][j][0] && 1}</div>
                            <div className="noteGridItem">{cellNotes[i][j][1] && 2}</div>
                            <div className="noteGridItem">{cellNotes[i][j][2] && 3}</div>
                            <div className="noteGridItem">{cellNotes[i][j][3] && 4}</div>
                            <div className="noteGridItem">{cellNotes[i][j][4] && 5}</div>
                            <div className="noteGridItem">{cellNotes[i][j][5] && 6}</div>
                            <div className="noteGridItem">{cellNotes[i][j][6] && 7}</div>
                            <div className="noteGridItem">{cellNotes[i][j][7] && 8}</div>
                            <div className="noteGridItem">{cellNotes[i][j][8] && 9}</div>
                        </div>
                        :
                        cellValues[i][j]}
                    </div>
                );
            }
        }
        return <div className="grid">{gridItems}</div>;
    }

    useEffect(() => {
        function generateBoard() {
            let boardString =   "400060010008000007000520603865700030300600008029050000000005071581000000740000206";
            let correctString = "432867915658193427917524683865749132374612598129358764296435871581276349743981256";
            let newBoard = Array.from({ length: 9 }, (_, i) =>
                boardString.slice(i * 9, (i + 1) * 9).split('')
            );
            let correctNewBoard = Array.from({ length: 9 }, (_, i) =>
                correctString.slice(i * 9, (i + 1) * 9).split('')
            );
            let staticNewBoard = Array.from({ length: 9 }, () => Array(9).fill(false));
            for(let i = 0; i < 81; i++) {
                if(boardString[i] !== '0') {
                    staticNewBoard[Math.floor(i / 9)][i % 9] = true;
                }
            }
            setCellValues(newBoard);
            setCorrectCellValues(correctNewBoard);
            setStaticCells(staticNewBoard);
        }
        generateBoard();
    },[]);

    function numberInput(option: String) {
        if(selectedCell !== null && option >= '0' && option <= '9') {
            const row = Math.floor(selectedCell / 9);
            const column = selectedCell % 9;
            if(noteMode === true) {
                toggleNoteValue(column, row, Number(option));
            }
            else {
                updateCellValue(row, column, option);
            }
        }
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            numberInput(event.key);
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    });

    function toggleNoteMode() {
        setNoteMode(!noteMode);
    }

    //Timer
    useEffect(() => {
        let timeS = timeSeconds;
        let timeM = timeMinutes;
        let timeH = timeHours;
        const interval = setInterval(() => {
            if(!timerPaused) {
                timeS ++;
                if(timeSeconds > 59) {
                    timeS = 0;
                    timeM ++;
                }
                if(timeMinutes > 59) {
                    timeM = 0;
                    timeH ++;
                }
                setTimerString(`${timeH > 0 ? String(timeH)+':' : ''}${timeM > 9 ? String(timeM) : '0'+String(timeM)}:${timeS > 9 ? String(timeS) : '0'+String(timeS)}`);
                setTimeSeconds(timeS);
                setTimeMinutes(timeM);
                setTimeHours(timeH);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [timerPaused, timeSeconds, timeMinutes, timeHours]);
    
    
    

    return (
        <div className="gameContainer">
            <div>
                <div className="difficultySelector">
                    <div style={{paddingTop: '0.5em', fontWeight: 'bold'}}>Difficulty:</div>
                    <div className={`difficultyOption ${difficulty === 1 && 'selected'}`} onClick={() => setDifficulty(1)}>Easy</div>
                    <div className={`difficultyOption ${difficulty === 2 && 'selected'}`} onClick={() => setDifficulty(2)}>Medium</div>
                    <div className={`difficultyOption ${difficulty === 3 && 'selected'}`} onClick={() => setDifficulty(3)}>Hard</div>
                    <div className={`difficultyOption ${difficulty === 4 && 'selected'}`} onClick={() => setDifficulty(4)}>Expert</div>
                </div>
                {renderGridItems()}
            </div>
            
            <div className="gameButtons">
                <div className="gameInfo">
                    <div className="infoDiv">Mistakes: <span style={{fontWeight: 'bold', marginLeft: '0.5em'}}>{String(mistakes)}/3</span></div>
                    <div className="infoDiv">
                        {timerString}
                        <div className="timerPauseButton" onClick={() => setTimerPaused(!timerPaused)}>
                            {timerPaused ? 
                                <i className="pauseIcon fa fa-play" style={{width: '16px', height: '16px'}} />
                                :
                                <i className="pauseIcon fa fa-pause" style={{width: '16px', height: '16px'}} />
                            }
                        </div>
                        
                    </div>
                </div>
                <div className="buttonContainer">
                    <button className="gameButton"><i className="fa fa-undo" /></button>
                    <button className="gameButton" onClick={() => numberInput("0")}><i className="fa fa-eraser" /></button>
                    <button className="gameButton" onClick={toggleNoteMode} style={{border: noteMode ? '2px solid black' : 'none'}}><i className="fa fa-pencil" /></button>
                    <div className="gameButtonLabel">Undo</div>
                    <div className="gameButtonLabel">Erase</div>
                    <div className="gameButtonLabel">Notes</div>

                    <button className="numberButton" onClick={() => numberInput("1")}>1</button>
                    <button className="numberButton" onClick={() => numberInput("2")}>2</button>
                    <button className="numberButton" onClick={() => numberInput("3")}>3</button>
                    <button className="numberButton" onClick={() => numberInput("4")}>4</button>
                    <button className="numberButton" onClick={() => numberInput("5")}>5</button>
                    <button className="numberButton" onClick={() => numberInput("6")}>6</button>
                    <button className="numberButton" onClick={() => numberInput("7")}>7</button>
                    <button className="numberButton" onClick={() => numberInput("8")}>8</button>
                    <button className="numberButton" onClick={() => numberInput("9")}>9</button>

                    <button className="newGameButton">New Game</button>
                </div>
            </div>
            
            {/*<button onClick={toggleNoteMode}>{!noteMode ? 'Enable Notes' : 'Disable Notes'}</button>*/}
        </div>
        
    );
}