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

    function updateCellValue(row: number, column: number, value: string) {
        if(staticCells[row][column]) {
            return;
        }
        const newValues = [...cellValues];
        newValues[row] = [...newValues[row]];
        newValues[row][column] = value;
        setCellValues(newValues);
    }

    function toggleNoteValue(row: number, column: number, value: number) {
        if(staticCells[column][row]) {
            return;
        }
        console.log(1);
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
        checkBoard();
    }, [cellValues])
    

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

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if(selectedCell !== null && event.key >= '0' && event.key <= '9') {
                const row = Math.floor(selectedCell / 9);
                const column = selectedCell % 9;
                if(noteMode === true) {
                    toggleNoteValue(column, row, Number(event.key));
                }
                else {
                    updateCellValue(row, column, event.key);
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    });

    function toggleNoteMode() {
        setNoteMode(!noteMode);
    }

    return (
        <div className="gameContainer">
            {renderGridItems()}
            <button onClick={toggleNoteMode}>{!noteMode ? 'Enable Notes' : 'Disable Notes'}</button>
        </div>
        
    );
}