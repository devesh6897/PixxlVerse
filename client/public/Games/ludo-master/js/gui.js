// This document is for stylistic and grafical functions
var currentPlayerColor;
function intStyle() {
  currentPlayerColor = "blue";
  document.getElementById("roundStatus").innerHTML = currentPlayerColor;
  document.getElementById("roundStatus").style.color = currentPlayerColor;

  if (currentDiceInt == undefined) {
    diceOut.innerHTML = "#";
  }
  if (chosenPiece == undefined) {
    document.getElementById("currentPieceStatus").innerHTML = "#";
  }
}

// FIXME: Correct program solve progress.
function printRoundStatus() {
  if (currentPlayerID == 0) {
    currentPlayerColor = "blue";
  }
  if (currentPlayerID == 1) {
    currentPlayerColor = "red";
  }
  if (currentPlayerID == 2) {
    currentPlayerColor = "green";
  }
  if (currentPlayerID == 3) {
    currentPlayerColor = "yellow";
  }
  document.getElementById("roundStatus").innerHTML = currentPlayerColor;
  document.getElementById("roundStatus").style.color = currentPlayerColor;
}

function elementUpdates() {
  document.getElementById("currentPieceStatus").innerHTML = chosenPiece;
}
