// @ts-nocheck
import { BORDER_TYPE, Chessboard, COLOR, INPUT_EVENT_TYPE, PIECES_FILE_TYPE } from 'cm-chessboard/src/Chessboard.js';
import { initChat } from './chat.js';

// Extensions
import { Markers, MARKER_TYPE } from 'cm-chessboard/src/extensions/markers/Markers.js';
import { PromotionDialog, PROMOTION_DIALOG_RESULT_TYPE } from 'cm-chessboard/src/extensions/promotion-dialog/PromotionDialog.js';
import { Chess } from 'chess.js/dist/esm/chess.js';
import { RightClickAnnotator } from 'cm-chessboard/src/extensions/right-click-annotator/RightClickAnnotator.js';

// CSS (These will load as soon as this file is imported)
import './style.css';
import 'cm-chessboard/assets/chessboard.css';
import 'cm-chessboard/assets/extensions/markers/markers.css';
import 'cm-chessboard/assets/extensions/arrows/arrows.css';
import 'cm-chessboard/assets/extensions/promotion-dialog/promotion-dialog.css';

initChat();
const chess = new Chess();
let lastActionTime = 0;

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
    extensions: [{ class: Markers, props: { autoMarkers: MARKER_TYPE.square } }, { class: RightClickAnnotator }, { class: PromotionDialog }],
});

let seed = 71;
function random() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}
function makeEngineMove(chessboard) {
    const possibleMoves = chess.moves({ verbose: true });
    if (possibleMoves.length > 0) {
        const randomIndex = Math.floor(random() * possibleMoves.length);
        const randomMove = possibleMoves[randomIndex];
        setTimeout(() => {
            // smoother with 500ms delay
            chess.move({ from: randomMove.from, to: randomMove.to });
            chessboard.setPosition(chess.fen(), true);
            chessboard.enableMoveInput(inputHandler, COLOR.white);
        }, 500);
    }
}

function inputHandler(event) {
    // console.log('inputHandler', event);

    if (event.type === INPUT_EVENT_TYPE.movingOverSquare) {
        return;
    }

    if (event.type !== INPUT_EVENT_TYPE.moveInputFinished) {
        event.chessboard.removeLegalMovesMarkers();
    }

    if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
        // [SYNC] Update the timer so the global click listener knows we hit a piece!
        lastActionTime = Date.now();

        // [VISUALS] Clear old arrows/markers, but KEEP the piece highlight
        // Note: We remove 'frame' (right clicks) but not 'square' (selection)
        event.chessboard.removeArrows();
        event.chessboard.removeMarkers(MARKER_TYPE.frame, undefined);

        // Mark legal moves
        const moves = chess.moves({ square: event.squareFrom, verbose: true });
        event.chessboard.addLegalMovesMarkers(moves);
        return moves.length > 0;
    } else if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
        const move = {
            from: event.squareFrom,
            to: event.squareTo,
            promotion: event.promotion,
        };

        let result = null;

        // [CRASH FIX] Catch the error from chess.js
        try {
            result = chess.move(move);
        } catch (e) {
            result = null;
        }

        if (result) {
            // --- VALID MOVE ---
            event.chessboard.state.moveInputProcess.then(() => {
                event.chessboard.setPosition(chess.fen(), true).then(() => {
                    makeEngineMove(event.chessboard);
                });
            });
        } else {
            // --- INVALID MOVE / PROMOTION ---

            // Check for promotion first
            let isPromotion = false;
            const possibleMoves = chess.moves({
                square: event.squareFrom,
                verbose: true,
            });

            for (const possibleMove of possibleMoves) {
                if (possibleMove.promotion && possibleMove.to === event.squareTo) {
                    isPromotion = true;
                    event.chessboard.showPromotionDialog(event.squareTo, COLOR.white, (promoResult) => {
                        if (promoResult.type === PROMOTION_DIALOG_RESULT_TYPE.pieceSelected) {
                            // Apply promotion
                            chess.move({
                                from: event.squareFrom,
                                to: event.squareTo,
                                promotion: promoResult.piece.charAt(1),
                            });
                            event.chessboard.setPosition(chess.fen(), true);
                            makeEngineMove(event.chessboard);
                        } else {
                            // Cancel promotion -> Reset board
                            event.chessboard.setPosition(chess.fen(), true);
                            event.chessboard.enableMoveInput(inputHandler, COLOR.white);
                        }
                    });
                    return true;
                }
            }

            // If it is NOT a promotion, it's just a bad move.
            if (!isPromotion) {
                // [CLEANUP] Dragged to invalid square? Clear everything.
                event.chessboard.removeMarkers(undefined, undefined);
                event.chessboard.removeArrows();
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
    // 1. Only care about Left Clicks
    if (event.button === 0) {
        // 2. Check the time difference
        const now = Date.now();
        const timeSinceLastAction = now - lastActionTime;

        // 3. If it has been more than 50ms since the chess library did something,
        //    it means you clicked "Nothing" (empty square, background, opponent piece).
        if (timeSinceLastAction > 50) {
            board.removeArrows();
            board.removeMarkers();
        }
    }
});
