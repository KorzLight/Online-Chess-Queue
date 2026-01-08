// @ts-nocheck
import {
    BORDER_TYPE,
    Chessboard,
    COLOR,
    INPUT_EVENT_TYPE,
    PIECES_FILE_TYPE,
} from 'cm-chessboard';
import { Chess } from 'chess.js';

// Extensions
import {
    Markers,
    MARKER_TYPE,
} from 'cm-chessboard/src/extensions/markers/Markers.js';
import { RightClickAnnotator } from 'cm-chessboard/src/extensions/right-click-annotator/RightClickAnnotator.js';
import {
    PromotionDialog,
    PROMOTION_DIALOG_RESULT_TYPE,
} from 'cm-chessboard/src/extensions/promotion-dialog/PromotionDialog.js';

// CSS (These will load as soon as this file is imported)
import 'cm-chessboard/assets/chessboard.css';
import 'cm-chessboard/assets/extensions/markers/markers.css';
import 'cm-chessboard/assets/extensions/arrows/arrows.css';
import 'cm-chessboard/assets/extensions/promotion-dialog/promotion-dialog.css';

const chess = new Chess();

const board = new Chessboard(document.getElementById('mainBoard'), {
    position: chess.fen(),
    assetsUrl: '/cm-chessboard-assets/',
    style: {
        cssClass: 'chess-club',
        borderType: BORDER_TYPE.frame,
        pieces: {
            type: PIECES_FILE_TYPE.svgSprite,
            file: 'pieces/standard.svg',
        },
    },
    extensions: [
        { class: Markers, props: { autoMarkers: MARKER_TYPE.square } },
        { class: RightClickAnnotator },
        { class: PromotionDialog },
    ],
});

function inputHandler(event) {
    console.log('inputHandler', event);
    if (event.type === INPUT_EVENT_TYPE.movingOverSquare) {
        return; // ignore this event
    }
    if (event.type !== INPUT_EVENT_TYPE.moveInputFinished) {
        event.chessboard.removeLegalMovesMarkers();
    }
    if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
        // mark legal moves
        const moves = chess.moves({ square: event.squareFrom, verbose: true });
        event.chessboard.addLegalMovesMarkers(moves);
        return moves.length > 0;
    } else if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
        const move = {
            from: event.squareFrom,
            to: event.squareTo,
            promotion: event.promotion,
        };
        const result = chess.move(move);
        if (result) {
            event.chessboard.state.moveInputProcess.then(() => {
                // wait for the move input process has finished
                event.chessboard.setPosition(chess.fen(), true).then(() => {
                    // update position, maybe castled and wait for animation has finished
                    makeEngineMove(event.chessboard);
                });
            });
        } else {
            // promotion?
            let possibleMoves = chess.moves({
                square: event.squareFrom,
                verbose: true,
            });
            for (const possibleMove of possibleMoves) {
                if (
                    possibleMove.promotion &&
                    possibleMove.to === event.squareTo
                ) {
                    event.chessboard.showPromotionDialog(
                        event.squareTo,
                        COLOR.white,
                        (result) => {
                            console.log('promotion result', result);
                            if (
                                result.type ===
                                PROMOTION_DIALOG_RESULT_TYPE.pieceSelected
                            ) {
                                chess.move({
                                    from: event.squareFrom,
                                    to: event.squareTo,
                                    promotion: result.piece.charAt(1),
                                });
                                event.chessboard.setPosition(chess.fen(), true);
                                makeEngineMove(event.chessboard);
                            } else {
                                // promotion canceled
                                event.chessboard.enableMoveInput(
                                    inputHandler,
                                    COLOR.white
                                );
                                event.chessboard.setPosition(chess.fen(), true);
                            }
                        }
                    );
                    return true;
                }
            }
        }
        return result;
    } else if (event.type === INPUT_EVENT_TYPE.moveInputFinished) {
        if (event.legalMove) {
            event.chessboard.disableMoveInput();
        }
    }
}

board.enableMoveInput(inputHandler, COLOR.white);

document.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
        board.removeArrows();
        //board.removeMarkers();
    }
});

// function inputHandler(event) {
//     console.log(event);
//     switch (event.type) {
//         case INPUT_EVENT_TYPE.moveInputStarted:
//             console.log(`moveInputStarted: ${event.squareFrom}`);
//             return true; // false cancels move
//         case INPUT_EVENT_TYPE.validateMoveInput:
//             console.log(
//                 `validateMoveInput: ${event.squareFrom}-${event.squareTo}`
//             );
//             return true; // false cancels move
//         case INPUT_EVENT_TYPE.moveInputCanceled:
//             console.log(`moveInputCanceled`);
//             break;
//         case INPUT_EVENT_TYPE.moveInputFinished:
//             console.log(`moveInputFinished`);
//             break;
//         case INPUT_EVENT_TYPE.movingOverSquare:
//             console.log(`movingOverSquare: ${event.squareTo}`);
//             break;
//     }
// }

// board.enableMoveInput((event) => {
//     if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
//         if (event.squareTo.charAt(1) === '8' && event.piece.charAt(1) === 'p') {
//             board.showPromotionDialog(
//                 event.squareTo,
//                 COLOR.white,
//                 (result) => {
//                     console.log('Promotion result', result);
//                     if (result && result.piece) {
//                         board.setPiece(result.square, result.piece, true);
//                     } else {
//                         board.setPosition(position);
//                     }
//                 }
//             );
//         }
//     }
//     return true;
// });

// document.addEventListener('click', (event) => {
//     board.removeArrows();
//     board.removeMarkers();
// });
