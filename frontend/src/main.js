import { Chessboard, FEN, BORDER_TYPE, INPUT_EVENT_TYPE, PIECES_FILE_TYPE } from 'cm-chessboard';
import 'cm-chessboard/assets/chessboard.css';


const board = new Chessboard(document.getElementById('mainBoard'), {
    position: FEN.start,
    assetsUrl: '/cm-chessboard-assets/',
    assetsCache: false,
    style: {
        cssClass: 'chess-club',
        borderType: BORDER_TYPE.frame,
        pieces: {
            type: PIECES_FILE_TYPE.svgSprite, // pieces are in an SVG sprite, no other type supported for now
            file: 'pieces/standard.svg', // the filename of the sprite in `assets/pieces/` or an absolute url like `https://…` or `/…`
            tileSize: 40, // the tile size in the sprite
        },
    },
});

board.enableMoveInput(inputHandler);

function inputHandler(event) {
    console.log(event);
    switch (event.type) {
        case INPUT_EVENT_TYPE.moveInputStarted:
            console.log(`moveInputStarted: ${event.squareFrom}`);
            return true; // false cancels move
        case INPUT_EVENT_TYPE.validateMoveInput:
            console.log(`validateMoveInput: ${event.squareFrom}-${event.squareTo}`);
            return true; // false cancels move
        case INPUT_EVENT_TYPE.moveInputCanceled:
            console.log(`moveInputCanceled`);
            break;
        case INPUT_EVENT_TYPE.moveInputFinished:
            console.log(`moveInputFinished`);
            break;
        case INPUT_EVENT_TYPE.movingOverSquare:
            console.log(`movingOverSquare: ${event.squareTo}`);
            break;
    }
}