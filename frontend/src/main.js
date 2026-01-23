// @ts-nocheck
import { BORDER_TYPE, Chessboard, COLOR, INPUT_EVENT_TYPE, PIECES_FILE_TYPE } from 'cm-chessboard/src/Chessboard.js';
import { initChat } from './chat.js';
import { Stockfish } from './stockfish.js';

// Extensions
import { Markers, MARKER_TYPE } from 'cm-chessboard/src/extensions/markers/Markers.js';
import { PromotionDialog, PROMOTION_DIALOG_RESULT_TYPE } from 'cm-chessboard/src/extensions/promotion-dialog/PromotionDialog.js';
import { Chess } from 'chess.js/dist/esm/chess.js';
import { RightClickAnnotator } from 'cm-chessboard/src/extensions/right-click-annotator/RightClickAnnotator.js';

// CSS
import './style.css';
import 'cm-chessboard/assets/chessboard.css';
import 'cm-chessboard/assets/extensions/markers/markers.css';
import 'cm-chessboard/assets/extensions/arrows/arrows.css';
import 'cm-chessboard/assets/extensions/promotion-dialog/promotion-dialog.css';

initChat();
const chess = new Chess();
const engine = new Stockfish();
let lastActionTime = 0;

let currentLevel = 1;
const MAX_LEVEL = 20;
const MIN_LEVEL = 1;

const diffFill = document.getElementById('difficultyFill');
const diffText = document.querySelector('#engineBar span:last-child');
const engineBar = document.getElementById('engineBar');

updateDifficultyDisplay();

engine.onMove = (bestMove) => {
    const move = {
        from: bestMove.substring(0, 2),
        to: bestMove.substring(2, 4),
        promotion: bestMove.length === 5 ? bestMove.substring(4, 5) : undefined,
    };

    chess.move(move);
    board.setPosition(chess.fen(), true);
    checkGameOver(); // Check if Engine won

    if (!chess.isGameOver()) {
        board.enableMoveInput(inputHandler, COLOR.white);
    }
};

function checkGameOver() {
    if (chess.isGameOver()) {
        let title = 'Game Over';
        let message = '';

        if (chess.isCheckmate()) {
            // If it's White's turn, White lost. If Black's turn, Black lost.
            if (chess.turn() === 'w') {
                // PLAYER LOST
                message = 'You lost! Decreasing difficulty...';
                changeLevel(-1);
            } else {
                // PLAYER WON
                message = 'Victory! Increasing difficulty...';
                changeLevel(1);
            }
        } else if (chess.isDraw()) {
            message = 'Draw! Level remains the same.';
        }

        // Show result (you can replace this with a nice modal later)
        alert(`${message}\nNew Level: ${currentLevel}`);

        // Restart Game after 1 second
        setTimeout(startNewGame, 1000);
    }
}

function changeLevel(amount) {
    currentLevel += amount;

    // Clamp between 1 and 20
    if (currentLevel < MIN_LEVEL) currentLevel = MIN_LEVEL;
    if (currentLevel > MAX_LEVEL) currentLevel = MAX_LEVEL;

    engine.setDepth(currentLevel);
    updateDifficultyDisplay();
}

function updateDifficultyDisplay() {
    // NOT ACCURATE WILL FIX DIFFICULTY LATER

    // Calculate percentage (Level 1 = 5%, Level 20 = 100%)
    const percentage = (currentLevel / MAX_LEVEL) * 100;

    // Update Width
    if (diffFill) diffFill.style.width = `${percentage}%`;

    // Update Text (Estimate ELO: Level 1=400, Level 20=3000)
    const estimatedElo = 300 + currentLevel * 130;
    if (diffText) diffText.innerText = `LVL ${currentLevel} (~${estimatedElo} ELO)`;
}

function startNewGame() {
    chess.reset();
    board.setPosition(chess.fen(), true); // true = animation
    board.enableMoveInput(inputHandler, COLOR.white);
}

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

function inputHandler(event) {
    if (event.type === INPUT_EVENT_TYPE.movingOverSquare) return;
    if (event.type !== INPUT_EVENT_TYPE.moveInputFinished) {
        event.chessboard.removeLegalMovesMarkers();
    }
    if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
        lastActionTime = Date.now();
        event.chessboard.removeArrows();
        event.chessboard.removeMarkers(MARKER_TYPE.frame, undefined);
        const moves = chess.moves({ square: event.squareFrom, verbose: true });
        event.chessboard.addLegalMovesMarkers(moves);
        return moves.length > 0;
    } else if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
        const move = { from: event.squareFrom, to: event.squareTo, promotion: event.promotion };
        let result = null;
        try {
            result = chess.move(move);
        } catch (e) {
            result = null;
        }
        if (result) {
            event.chessboard.state.moveInputProcess.then(() => {
                event.chessboard.setPosition(chess.fen(), true).then(() => {
                    // Check if Player won immediately after move
                    checkGameOver();

                    if (!chess.isGameOver()) {
                        engine.getBestMove(chess.fen());
                    }
                });
            });
        } else {
            // Promotion Logic
            let isPromotion = false;
            const possibleMoves = chess.moves({ square: event.squareFrom, verbose: true });
            for (const possibleMove of possibleMoves) {
                if (possibleMove.promotion && possibleMove.to === event.squareTo) {
                    isPromotion = true;
                    event.chessboard.showPromotionDialog(event.squareTo, COLOR.white, (promoResult) => {
                        if (promoResult.type === PROMOTION_DIALOG_RESULT_TYPE.pieceSelected) {
                            chess.move({ from: event.squareFrom, to: event.squareTo, promotion: promoResult.piece.charAt(1) });
                            event.chessboard.setPosition(chess.fen(), true);

                            checkGameOver();
                            if (!chess.isGameOver()) engine.getBestMove(chess.fen());
                        } else {
                            event.chessboard.setPosition(chess.fen(), true);
                            event.chessboard.enableMoveInput(inputHandler, COLOR.white);
                        }
                    });
                    return true;
                }
            }
            if (!isPromotion) {
                event.chessboard.removeMarkers(undefined, undefined);
                event.chessboard.removeArrows();
            }
        }
        return result;
    } else if (event.type === INPUT_EVENT_TYPE.moveInputFinished) {
        if (event.legalMove) event.chessboard.disableMoveInput();
    }
}

board.enableMoveInput(inputHandler, COLOR.white);

document.addEventListener('mousedown', (event) => {
    if (event.button === 0 && Date.now() - lastActionTime > 50) {
        board.removeArrows();
        board.removeMarkers();
    }
});
