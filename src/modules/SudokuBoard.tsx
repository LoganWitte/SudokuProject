import React, { useState } from 'react';

export default function SudokuBoard() {
    const [selectedCell, setSelectedCell] = useState<number | null>(null);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
    const [selectedBox, setSelectedBox] = useState<number | null>(null);
    const [cellValues, setCellValues] = useState(Array.from({ length: 9 }, () => Array(9).fill('')));

    function clickCell(index: number, column: number, row: number, box: number) {
        if(selectedCell === index) {
            setSelectedCell(null);
            setSelectedRow(null);
            setSelectedColumn(null);
            setSelectedBox(null);
        }
        else {
            setSelectedCell(index);
            setSelectedColumn(column);
            setSelectedRow(row);
            setSelectedBox(box);
        }
    }

    function renderGridItems() {
        const gridItems = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const index = i * 9 + j;
                const box = Math.floor(j / 3) * 3 + Math.floor(i / 3);
                const isSelected = selectedCell === index;
                const isHighlighted = (selectedColumn === i) || (selectedRow === j) || selectedBox === box;
                gridItems.push(
                    <div
                        className={`gridItem ${isSelected ? 'selectedCell' : (isHighlighted ? 'highlightedCell' : '')} `}
                        id={`cell${index}`}
                        key={index}
                        onClick={() => clickCell(index, i, j, box)}
                    >
                        {cellValues[i][j] || index}
                    </div>
                );
            }
        }
        return <div className="grid">{gridItems}</div>;
    }

    return (
        <div className="gameContainer">
            {renderGridItems()}
        </div>
    )
}
