(function () {
	"use strict";
		var moduleMaker = function(moduleName, moduleObject) {
				// Module export function coping with Node, AMD and browser
				// Stick this function in every module
				if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
					module.exports = moduleObject(); // NodeJS support
				} else {
					if (typeof define === 'function' && define.amd) {
						define([], function() {
							return moduleObject(); // AMD support
						});
					} else {
						window[moduleName] = moduleObject(); // browser support
					}
				}
			};

			moduleMaker("GoLGrid", function() {
				var cellRefs=0,
					living=[],
					possibleList=[],
					dyingList=[],
					birthList=[],
					golStatus = {},
					gridWidth=0,
					gridHeight=0,
					extraBirthsRate = 0,
					extraDeathsRate = 0,
					increaseFertilityRate = 0,
					increaseDeathRate = 0,
				toggleAlive = function (cellDiv) {
					var $cellDiv = $(cellDiv),
						r = Number($cellDiv.attr('row')),
						c = Number($cellDiv.attr('col')),
						cell = cellRefs[r][c];

					if (cell.alive) {
						living.splice(living.indexOf(cell), 1);
						cell.alive = false;
						$cellDiv.removeClass('alive');
					} else {
						$cellDiv.addClass('alive');
						cell.alive = true;
						living.push(cell);
					}
				},
				gridJQueryEvents = function () {
					var mouseDown = false;
					$('.GoLCell').mousedown(function () {
						toggleAlive(this);
						mouseDown = true;
					});
					$('.GoLCell').mouseup(function () {
						mouseDown = false;
					});
					$('.GoLCell').mouseenter(function () {
						var r = Number($(this).attr('row')),
							c = Number($(this).attr('col'));

						$("#activeCell").text("Active Cell - Row: " + r + ", Col: " + c);
						if (mouseDown === true) {
							toggleAlive(this);
						} else {
							$(this).addClass('prenatal');
						}
					});
					$('.GoLCell').mouseleave(function () {
						$(this).removeClass('prenatal');
					});
				},

				addDivTo = function (doc, hostDiv, newDivClass, newDivID) {
					var newDiv = doc.createElement("Div");
					newDiv.className = newDivClass;
					newDiv.id = newDivID;
					hostDiv.appendChild(newDiv);
					return newDiv;
				},

				initialCellCSS = function (rows, cols) {
					var rowHeightPercent = (100 / rows) + "%",
						colWidthPercent = (100 / cols) + "%";
					$(".GoLRow").css({"width": "100%", "height": rowHeightPercent});
					$(".GoLCell").css({"width": colWidthPercent, "height": "100%"});
				},

				toggleCellColorStyle = function (cellColorStyle) {
					if (cellColorStyle === undefined) {
						cellColorStyle = 'light';
					}
					if (cellColorStyle === 'light') {
						cellColorStyle = 'dark';
					} else {
						cellColorStyle = 'light';
					}
					return cellColorStyle;
				},

				torroidCelRef = function (row, col) {
					if (row < 0) {
						row = gridHeight - 1;
					} else if (row >= gridHeight) {
						row = 0;
					}
					if (col < 0) {
						col = gridWidth - 1;
					} else if (col >= gridWidth) {
						col = 0;
					}
					return cellRefs[row][col];
				},

				addGrid = function (doc, rows, cols) {
					var grid = doc.getElementById("grid1"),
						cellColorStyle=0,
						r,
						c,
						n,
						rowDiv,
						cellDiv;

					gridHeight = rows;
					gridWidth = cols;
					cellRefs = []; // init cell refs array
					for (r = 0; r < rows; r++) {
						rowDiv = addDivTo(doc, grid, "GoLRow block", "r" + r.toString());
						rowDiv.visible = true;
						cellRefs[r] = [];

						cellColorStyle = toggleCellColorStyle(cellColorStyle);
						for (c = 0; c < cols; c++) {
							cellDiv = addDivTo(doc, rowDiv, "GoLCell block " + cellColorStyle, "r" + r.toString() + "c" + c.toString());
							cellDiv.visible = true;
							//$(cellDiv).attr('row', r); // either way is good - jquery dom
							cellDiv.setAttribute('row', r); // chose this to keep jquery in thie file to minimum
							cellDiv.setAttribute('col', c); // javascript dom

							cellColorStyle = toggleCellColorStyle(cellColorStyle);

							cellRefs[r][c] = {
								row: r,
								col: c,
								alive: false,
								fertilityRate: 0,
								deathRate: 0,
								div: $(cellDiv),
								adjacent: []
							};
						}
						if (c % 2 == 1) {
							// Add an extra toggle
							cellColorStyle = toggleCellColorStyle(cellColorStyle);
						}
					}

					// add adjacent
					for (r = 0; r < rows; r++) {
						for (c = 0; c < cols; c++) {
							cellRefs[r][c].adjacent[0] = torroidCelRef(r - 1, c - 1);
							cellRefs[r][c].adjacent[1] = torroidCelRef(r - 1, c);
							cellRefs[r][c].adjacent[2] = torroidCelRef(r - 1, c + 1);
							cellRefs[r][c].adjacent[3] = torroidCelRef(r, c - 1);
							// skip r, c as it's current node
							cellRefs[r][c].adjacent[4] = torroidCelRef(r, c + 1);
							cellRefs[r][c].adjacent[5] = torroidCelRef(r + 1, c - 1);
							cellRefs[r][c].adjacent[6] = torroidCelRef(r + 1, c);
							cellRefs[r][c].adjacent[7] = torroidCelRef(r + 1, c + 1);
						}
					}
					initialCellCSS(rows, cols);
				},

				checkGoLCellState = function (cell, handleSum, handleAdjacent) {
					// Individual cell processor
					var r = cell.row,
						c = cell.col,
						n = cell.adjacent,// adjacent
						sum,
						i;

					sum = 0;
					for (i = 0; i < 8; i++) {
						if (n[i] !== undefined) {
							if (n[i].alive !== true) { // always checking alive state here
								handleAdjacent(n[i]);
							} else {
								sum += 1;
							}
						}
					}
					handleSum(sum, cell);
				},

				checkGoLCellStates = function (handleSum, handleAdjacent) {
					// process living cells
					living.forEach(function (cell) {
						// select just living cells, keep processing to a minimum (efficient?)
						checkGoLCellState(cell, handleSum, handleAdjacent);
					});

					// filter duplicates
					possibleList = possibleList.filter(function(elem, pos, arr) {
						return arr.indexOf(elem) === pos;
					})
					// process adjacent **********
					possibleList.forEach(function(cell) {
						checkGoLCellState(cell,
							function (sum, cell) { // handleSum
								if (sum === 3 || Math.random() < extraBirthsRate || Math.random() < cell.fertilityRate ) {
									birthList.push(cell);
									cell.fertilityRate = 0; // reset
									cell.deathRate = 0;
								} else {
									cell.fertilityRate += increaseFertilityRate;
								}
							}, function () { // handleAdjacents
								// do nothing. adjacent of possible not added to possible
							}
						);
					});

					possibleList = [];

					// filter duplicate births *********
					birthList = birthList.filter(function(elem, pos, arr) {
						return arr.indexOf(elem) === pos;
					});

					birthList.forEach(function(cell) {
						living.push(cell);
						cell.alive = true;
						cell.div.addClass('alive');
					});

					birthList = [];

					// filter duplicates
					dyingList = dyingList.filter(function(elem, pos, arr) {
						return arr.indexOf(elem) === pos;
					});

					dyingList.forEach(function(cell) {
						living.splice(living.indexOf(cell), 1);
						cell.alive = false;
						cell.div.removeClass('alive');
					});

					dyingList = [];
				},

				golStatusMgr = function() {
					var timer = 0,
						lastTime = 0,
						tick = 0,
						that = {};

					tick = function() {
						$("#timing").text("Actual Timing: " + (lastTime) + "ms");
					}
					that.start = function() {
						timer = setInterval(tick, 1000); // report once per second
					};
					that.stop = function() {
						clearInterval(timer);
					};
					that.golTiming = function(t) {
						lastTime = t;
					};
					return that;
				},

				lastTime = 0,
				goLStep = function ()
				{
					var d, thisTime,
						d = new Date(),
						thisTime = d.getTime(); // milliseconds since 01/01 1970

					if (lastTime !== 0) {
						golStatus.golTiming(thisTime-lastTime);
					}
					lastTime = thisTime;

					checkGoLCellStates(
						function (sum, cell) { // handleSum
							if ((sum < 2) || (sum > 3) || Math.random() < extraDeathsRate || Math.random() < cell.deathRate) {
								dyingList.push(cell);
								cell.fertilityRate = 0; // reset
								cell.deathRate = 0;
							} else {
								cell.deathRate += increaseDeathRate;
							}
						}, function (cell) { // handleAdjacents
							possibleList.push(cell);
						}
					);
				},

				// Constructor
				GoLGrid = function (doc, gridHeight, gridWidth, rows, cols) {
					$(".GoLGrid").css({"width": gridWidth, "height": gridHeight});
					$(".GoLGrid").resizable();

					addGrid(doc, rows, cols);
					gridJQueryEvents();
				},

				// Public functions *** follow example aMethod ***
				/*
				// Sample exported method
				GoLGrid.prototype.aMethod = function (one, two, three) {
					This add's the method 'aMethod' to the exported GoLGrid object prototype.
					It's parameters are one two and three.
				};
				*/
				timerGoL = 0;
				golStatus = golStatusMgr();
				GoLGrid.prototype.startStop = function () {
					if (timerGoL === 0) {
						extraBirthsRate = $("#extraBirthsPerThousand").val() / 1000.0;
						extraDeathsRate = $("#extraDeathsPerThoursand").val() / 1000.0;
						increaseFertilityRate = $("#increaseFertilityPerThousand").val() / 1000.0;
						increaseDeathRate = $("#increaseDeathPerThousand").val() / 1000.0;
						timerGoL = setInterval(function (){goLStep();},$("#txtInterval").val());
						$("#startStopBtn").attr('value', 'Stop');
						$("#status").text("Status: Running");
						golStatus.start();
					} else {
						clearInterval(timerGoL);
						golStatus.stop();
						timerGoL = 0;
						$("#startStopBtn").attr('value', 'Start');
						$("#status").text("Status: Stopped");
					}
				};

				return GoLGrid;
			});
})();
