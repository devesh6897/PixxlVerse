// Defining essential variables

// Player1 = TL
// Player2 = TR
// Player3 = BR
// Player4 = BL

// Defining the route each piece has to make before the player piece is secured
var routePlayer1 = [".TL0", ".TL1", ".TL2", ".TL3", ".TL4", ".TL5", ".TL6", ".TL7", ".TL8", ".TL9", ".TL10", ".TL11", ".TL12", ".TL13",
  "TR0", ".TR1", ".TR2", ".TR3", ".TR4", ".TR5", ".TR6", ".TR7", ".TR8", ".TR9", ".TR10", ".TR11", ".TR12", ".TR13",
  "BR0", ".BR1", ".BR2", ".BR3", ".BR4", ".BR5", ".BR6", ".BR7", ".BR8", ".BR9", ".BR10", ".BR11", ".BR12", ".BR13",
  "BL0", ".BL1", ".BL2", ".BL3", ".BL4", ".BL5", ".BL6", ".BL7", ".BL8", ".BL9", ".BL10", ".BL11", ".BL12",
  "eL1", ".eL2", ".eL3", ".eL4", ".eL5", ".eL6"
];

var routePlayer2 = ["TR0", ".TR1", ".TR2", ".TR3", ".TR4", ".TR5", ".TR6", ".TR7", ".TR8", ".TR9", ".TR10", ".TR11", ".TR12", ".TR13",
  "BR0", ".BR1", ".BR2", ".BR3", ".BR4", ".BR5", ".BR6", ".BR7", ".BR8", ".BR9", ".BR10", ".BR11", ".BR12", ".BR13",
  "BL0", ".BL1", ".BL2", ".BL3", ".BL4", ".BL5", ".BL6", ".BL7", ".BL8", ".BL9", ".BL10", ".BL11", ".BL12", ".BL13",
  "TL0", ".TL1", ".TL2", ".TL3", ".TL4", ".TL5", ".TL6", ".TL7", ".TL8", ".TL9", ".TL10", ".TL11", ".TL12",
  "eT1", ".eT2", ".eT3", ".eT4", ".eT5", ".eT6"
];

var routePlayer3 = ["BR0", ".BR1", ".BR2", ".BR3", ".BR4", ".BR5", ".BR6", ".BR7", ".BR8", ".BR9", ".BR10", ".BR11", ".BR12", ".BR13",
  "BL0", ".BL1", ".BL2", ".BL3", ".BL4", ".BL5", ".BL6", ".BL7", ".BL8", ".BL9", ".BL10", ".BL11", ".BL12", ".BL13",
  "TL0", ".TL1", ".TL2", ".TL3", ".TL4", ".TL5", ".TL6", ".TL7", ".TL8", ".TL9", ".TL10", ".TL11", ".TL12", ".TL13",
  "TR0", ".TR1", ".TR2", ".TR3", ".TR4", ".TR5", ".TR6", ".TR7", ".TR8", ".TR9", ".TR10", ".TR11", ".TR12",
  "eR1", ".eR2", ".eR3", ".eR4", ".eR5", ".eR6"
];

var routePlayer4 = ["BL0", ".BL1", ".BL2", ".BL3", ".BL4", ".BL5", ".BL6", ".BL7", ".BL8", ".BL9", ".BL10", ".BL11", ".BL12", ".BL13",
  "TL0", ".TL1", ".TL2", ".TL3", ".TL4", ".TL5", ".TL6", ".TL7", ".TL8", ".TL9", ".TL10", ".TL11", ".TL12", ".TL13",
  "TR0", ".TR1", ".TR2", ".TR3", ".TR4", ".TR5", ".TR6", ".TR7", ".TR8", ".TR9", ".TR10", ".TR11", ".TR12", ".TR13",
  "BR0", ".BR1", ".BR2", ".BR3", ".BR4", ".BR5", ".BR6", ".BR7", ".BR8", ".BR9", ".BR10", ".BR11", ".BR12",
  "eB1", ".eB2", ".eB3", ".eB4", ".eB5", ".eB6"
];

// "TL0", "TL1", "TL2", "TL3", "TL4", "TL5", "TL6", "TL7", "TL8", "TL9", "TL10", "TL11", "TL12", "TL13",
// "TR0", "TR1", "TR2", "TR3", "TR4", "TR5", "TR6", "TR7", "TR8", "TR9", "TR10", "TR11", "TR12", "TR13",
// "BR0", "BR1", "BR2", "BR3", "BR4", "BR5", "BR6", "BR7", "BR8", "BR9", "BR10", "BR11", "BR12", "BR13",
// "BL0", "BL1", "BL2", "BL3", "BL4", "BL5", "BL6", "BL7", "BL8", "BL9", "BL10", "BL11", "BL12", "BL13",
//
// "eT1", "eT2", "eT3", "eT4", "eT5", "eT6"
// "eR1", "eR2", "eR3", "eR4", "eR5", "eR6"
// "eB1", "eB2", "eB3", "eB4", "eB5", "eB6"
// "eL1", "eL2", "eL3", "eL4", "eL5", "eL6"

// [currentPosition, lastPosition, lastMovedRound, fieldsMoved, fieldsLeft]
var player1_1 = [];
var player1_2 = [];
var player1_3 = [];
var player1_4 = [];
var player2_1 = [];
var player2_2 = [];
var player2_3 = [];
var player2_4 = [];
var player3_1 = [];
var player3_2 = [];
var player3_3 = [];
var player3_4 = [];
var player4_1 = [];
var player4_2 = [];
var player4_3 = [];
var player4_4 = [];

var gameRound = 0;

var diceHits = ["Start of round"];

var currentPlayerID = 0;
var chosenPiece;
// Initial startup procedures
if (gameRound == 0) {
  player1_1 = ["spawnTL1", "", 0, 0, 61];
  player1_2 = ["spawnTL2", "", 0, 0, 61];
  player1_3 = ["spawnTL3", "", 0, 0, 61];
  player1_4 = ["spawnTR1", "", 0, 0, 61];
  player2_1 = ["spawnTR2", "", 0, 0, 61];
  player2_2 = ["spawnTR3", "", 0, 0, 61];
  player2_3 = ["spawnTR4", "", 0, 0, 61];
  player2_4 = ["spawnBR1", "", 0, 0, 61];
  player3_1 = ["spawnBR2", "", 0, 0, 61];
  player3_2 = ["spawnBR3", "", 0, 0, 61];
  player3_3 = ["spawnBR4", "", 0, 0, 61];
  player3_4 = ["spawnBL1", "", 0, 0, 61];
  player4_1 = ["spawnBL2", "", 0, 0, 61];
  player4_2 = ["spawnBL3", "", 0, 0, 61];
  player4_3 = ["spawnBL4", "", 0, 0, 61];
  player4_4 = ["spawnBL4", "", 0, 0, 61];
}

var player1Pieces = ["p1_1", "p1_2", "p1_3", "p1_4"];
var player2Pieces = ["p2_1", "p2_2", "p2_3", "p2_4"];
var player3Pieces = ["p3_1", "p3_2", "p3_3", "p3_4"];
var player4Pieces = ["p4_1", "p4_2", "p4_3", "p4_4"];

function pieceSelector(clicked_id) {
  chosenPiece = clicked_id;
  if (currentPlayerID == 0 && player1Pieces.includes(chosenPiece)) {
    movePiece();
  }
  if (currentPlayerID == 1 && player2Pieces.includes(chosenPiece)) {
    movePiece();
  }
  if (currentPlayerID == 2 && player3Pieces.includes(chosenPiece)) {
    movePiece();
  }
  if (currentPlayerID == 3 && player4Pieces.includes(chosenPiece)) {
    movePiece();
  }
  elementUpdates();
}

// Funtionen som sørger for at rykke brikkerne rundt.
// Dette burde kunne optrimeres ved chosenPiece[]
// men det virker tilsyndelandende ikke.
function movePiece() {
  // Spiller 1 - blå
  if (currentPlayerID == 0) {
    // Brik 1
    if (chosenPiece == "p1_1" && player1_1[4] > 0) {
      player1_1[3] += diceHits[0];
      player1_1[4] = 61 - player1_1[3];
      $("#p1_1").appendTo(routePlayer1[player1_1[3]]);
    } else if (p1_1[4] <= 0) {
      $("#p1_1").remove();
    }
    // Brik 2
    if (chosenPiece == "p1_2" && player1_2[4] > 0) {
      player1_2[3] += diceHits[0];
      player1_2[4] = 61 - player1_2[3];
      $("#p1_1").appendTo(routePlayer1[player1_2[3]]);
    } else if (p1_2[4] <= 0) {
      $("#p1_2").remove();
    }
    // Brik 3
    if (chosenPiece == "p1_3" && player1_3[4] > 0) {
      player1_3[3] += diceHits[0];
      player1_3[4] = 61 - player1_3[3];
      $("#p1_3").appendTo(routePlayer1[player1_3[3]]);
    } else if (p1_3[4] <= 0) {
      $("#p1_3").remove();
    }
    // Brik 4
    if (chosenPiece == "p1_4" && player1_4[4] > 0) {
      player1_4[3] += diceHits[0];
      player1_4[4] = 61 - player1_4[3];
      $("#p1_4").appendTo(routePlayer1[player1_4[3]]);
    } else if (p1_4[4] <= 0) {
      $("#p1_4").remove();
    }
  }
  // Spiller 2 - rød
  if (currentPlayerID == 1) {
    // Brik 1
    if (chosenPiece == "p2_1" && player2_1[4] > 0) {
      player2_1[3] += diceHits[0];
      player2_1[4] = 61 - player2_1[3];
      $("#p2_1").appendTo(routePlayer2[player2_1[3]]);
    } else if (p2_1[4] <= 0) {
      $("#p2_1").remove();
    }
    // Brik 2
    if (chosenPiece == "p2_2" && player2_2[4] > 0) {
      player2_2[3] += diceHits[0];
      player2_2[4] = 61 - player2_2[3];
      $("#p2_2").appendTo(routePlayer2[player2_2[3]]);
    } else if (p2_2[4] <= 0) {
      $("#p2_2").remove();
    }
    // Brik 3
    if (chosenPiece == "p2_3" && player2_3[4] > 0) {
      player2_3[3] += diceHits[0];
      player2_3[4] = 61 - player2_3[3];
      $("#p2_3").appendTo(routePlayer2[player2_3[3]]);
    } else if (p2_3[4] <= 0) {
      $("#p2_3").remove();
    }
    // Brik 4
    if (chosenPiece == "p2_4" && player2_4[4] > 0) {
      player2_4[3] += diceHits[0];
      player2_4[4] = 61 - player2_4[3];
      $("#p2_4").appendTo(routePlayer2[player2_4[3]]);
    } else if (p2_4[4] <= 0) {
      $("#p2_4").remove();
    }
  }
  // Spiller 3 - grøn
  if (currentPlayerID == 2) {
    // Brik 1
    if (chosenPiece == "p3_1" && player3_1[4] > 0) {
      player3_1[3] += diceHits[0];
      player3_1[4] = 61 - player3_1[3];
      $("#p3_1").appendTo(routePlayer3[player3_1[3]]);
    } else if (p3_1[4] <= 0) {
      $("#p3_1").remove();
    }
    // Brik 2
    if (chosenPiece == "p3_2" && player3_2[4] > 0) {
      player3_2[3] += diceHits[0];
      player3_2[4] = 61 - player3_2[3];
      $("#p3_2").appendTo(routePlayer3[player3_2[3]]);
    } else if (p3_2[4] <= 0) {
      $("#p3_2").remove();
    }
    // Brik 3
    if (chosenPiece == "p3_3" && player3_3[4] > 0) {
      player3_3[3] += diceHits[0];
      player3_3[4] = 61 - player3_3[3];
      $("#p3_3").appendTo(routePlayer3[player3_3[3]]);
    } else if (p3_3[4] <= 0) {
      $("#p3_3").remove();
    }
    // Brik 4
    if (chosenPiece == "p3_4" && player3_4[4] > 0) {
      player3_4[3] += diceHits[0];
      player3_4[4] = 61 - player3_4[3];
      $("#p3_4").appendTo(routePlayer3[player3_4[3]]);
    } else if (p3_4[4] <= 0) {
      $("#p3_4").remove();
    }
  }
  // Spiller 4 - gul
  if (currentPlayerID == 3) {
    // Brik 1
    if (chosenPiece == "p4_1" && player4_1[4] > 0) {
      player4_1[3] += diceHits[0];
      player4_1[4] = 61 - player4_1[3];
      $("#p4_1").appendTo(routePlayer4[player4_1[3]]);
    } else if (p4_1[4] <= 0) {
      $("#p4_1").remove();
    }
    // Brik 2
    if (chosenPiece == "p4_2" && player4_2[4] > 0) {
      player4_2[3] += diceHits[0];
      player4_2[4] = 61 - player4_2[3];
      $("#p4_2").appendTo(routePlayer4[player4_2[3]]);
    } else if (p4_2[4] <= 0) {
      $("#p4_2").remove();
    }
    // Brik 3
    if (chosenPiece == "p4_3" && player4_3[4] > 0) {
      player4_3[3] += diceHits[0];
      player4_3[4] = 61 - player4_3[3];
      $("#p4_3").appendTo(routePlayer4[player4_3[3]]);
    } else if (p4_3[4] <= 0) {
      $("#p4_3").remove();
    }
    // Brik 4
    if (chosenPiece == "p4_4" && player4_4[4] > 0) {
      player4_4[3] += diceHits[0];
      player4_4[4] = 61 - player4_4[3];
      $("#p4_4").appendTo(routePlayer4[player4_4[3]]);
    } else if (p4_4[4] <= 0) {
      $("#p4_4").remove();
    }
  }
  nextRound();
}

function nextRound() {
  // Changes current player per round
  gameRound += 1;
  if (currentPlayerID == 3) {
    currentPlayerID = 0;
  } else {
    currentPlayerID += 1;
  }
}
