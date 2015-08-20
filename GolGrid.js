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
					gridWidth=0,
					gridHeight=0,
					extraBirthsRate = 0,
					extraDeathsRate = 0,
					increaseFertilityRate = 0,
					increaseDeathRate = 0,
				toggleAlive = function (cell) {
					if ($(cell).hasClass('alive')) {
						$(cell).removeClass('alive');
						cellRefs[Number($(cell).attr('row'))][Number($(cell).attr('col'))].alive = false;
					} else {
						$(cell).addClass('alive');
						cellRefs[Number($(cell).attr('row'))][Number($(cell).attr('col'))].alive = true;				
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
				addGrid = function (doc, rows, cols) {
					var grid = doc.getElementById("grid1"),
						cellColorStyle=0,
						i,
						j,
						rowDiv,
						cellDiv;
	
					gridHeight = rows;
					gridWidth = cols;
					cellRefs = []; // init cell refs array
					for (i = 0; i < rows; i++) {
						cellRefs[i] = []; // hold cell status
	
						rowDiv = addDivTo(doc, grid, "GoLRow block", "r" + i.toString());
						rowDiv.visible = true;
	
						cellColorStyle = toggleCellColorStyle(cellColorStyle);
						for (j = 0; j < cols; j++) {
							cellRefs[i][j] = { row: i, col: j, alive: false, dying: false, born: false, possible: false, fertilityRate: 0, deathRate: 0};
	
							cellDiv = addDivTo(doc, rowDiv, "GoLCell block " + cellColorStyle, "r" + i.toString() + "c" + j.toString());
							cellDiv.visible = true;
							//$(cellDiv).attr('row', i); // either way is good - jquery dom
							cellDiv.setAttribute('row', i); // chose this to keep jquery in thie file to minimum
							cellDiv.setAttribute('col', j); // javascript dom
	
							cellColorStyle = toggleCellColorStyle(cellColorStyle);
						}
						if (j % 2 == 1) {
							// Add an extra toggle
							cellColorStyle = toggleCellColorStyle(cellColorStyle);
						}
					}
	
					initialCellCSS(rows, cols);
				},
	
				safeCellRef = function(row, col) {
					var ref=undefined;
					if (row >= 0 && row < gridHeight) {
						if (col >= 0 && col < gridWidth) {
							ref = cellRefs[row][col];
						} 
					}
					return ref;
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
				checkGoLCellState = function (cell, handleSum, handleNeighbour) {
					// Individual cell processor
					var r = cell.row,
						c = cell.col,
						n = [],// neighbours
						sum,
						i;
	
					n[0] = torroidCelRef(r - 1, c - 1);
					n[1] = torroidCelRef(r - 1, c);
					n[2] = torroidCelRef(r - 1, c + 1);
					n[3] = torroidCelRef(r, c - 1);
					// skip r, c as it's current node
					n[4] = torroidCelRef(r, c + 1);
					n[5] = torroidCelRef(r + 1, c - 1);
					n[6] = torroidCelRef(r + 1, c);
					n[7] = torroidCelRef(r + 1, c + 1);
					sum = 0;
					for (i = 0; i < 8; i++) {
						if (n[i] !== undefined) {
							if (n[i].alive !== true) { // always checking alive state here
								handleNeighbour(n[i]);
							} else {
								sum += 1;
							}
						}
					}
					handleSum(sum, cell);
				},
	
				checkGoLCellStates = function (handleSum, handleNeighbour) {
					// process living cells
					$(".GoLCell.alive").each(function () {
						// select just living cells, keep processing to a minimum (efficient?)
						checkGoLCellState(cellRefs[$(this).attr('row')][$(this).attr('col')], handleSum, handleNeighbour);
					});
	
					// process neighbours **********
					cellRefs.forEach(function (rowRef) {
						rowRef.forEach(function (cellRef) {
							if (cellRef.possible === true) {
								//---- TODO: process possible in checkGoLCellState
								checkGoLCellState(cellRef,
									function (sum, cell) { // handleSum
										if (sum === 3 || Math.random() < extraBirthsRate || Math.random() < cell.fertilityRate ) {
											cell.born = true; // new born
											cell.fertilityRate = 0; // reset
											cell.deathRate = 0;
										} else {
											cell.fertilityRate += increaseFertilityRate;
										}
										cell.possible = false;
									}, function () { // handleNeighbours
										// do nothing. Neighbours of possible not added to possible
									}
								);
							}
						});
					});
	
					cellRefs.forEach(function (rowRef) {
						rowRef.forEach(function (cellRef) {
							cellRef.possible = false; // reset to false
							if (cellRef.dying === true) {
								cellRef.alive = false;
								cellRef.dying = false;
								$("#r" + cellRef.row + "c" + cellRef.col).removeClass("alive");
							}
							if (cellRef.born === true) {
								cellRef.alive = true;
								cellRef.born = false;
								$("#r" + cellRef.row + "c" + cellRef.col).addClass("alive");
							}
						});
					});
				},
	
				lastTime = 0,
				goLStep = function ()
				{
					var d = new Date();
					var thisTime = d.getTime(); // milliseconds since 01/01 1970
					if (lastTime !== 0) {
						$("#timing").text("Actual Timing: " + (thisTime-lastTime) + "ms");
					}
					lastTime = thisTime;
	
					checkGoLCellStates(
						function (sum, cell) { // handleSum
							if ((sum < 2) || (sum > 3) || Math.random() < extraDeathsRate || Math.random() < cell.deathRate) {
								cell.dying = true; // dying
								cell.fertilityRate = 0; // reset 
								cell.deathRate = 0;
							} else {
								cell.deathRate += increaseDeathRate;
							}
						}, function (cell) { // handleNeighbours
							cell.possible = true; // 2 = possible
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
				GoLGrid.prototype.startStop = function () {
					if (timerGoL === 0) {
						extraBirthsRate = $("#extraBirthsPerThousand").val() / 1000.0;
						extraDeathsRate = $("#extraDeathsPerThoursand").val() / 1000.0;
						increaseFertilityRate = $("#increaseFertilityPerThousand").val() / 1000.0;
						increaseDeathRate = $("#increaseDeathPerThousand").val() / 1000.0;
						timerGoL = setInterval(function (){goLStep();},$("#txtInterval").val());
						$("#startStopBtn").attr('value', 'Stop');
						$("#status").text("Status: Running");
					} else {
						clearInterval(timerGoL);
						timerGoL = 0;
						$("#startStopBtn").attr('value', 'Start');
						$("#status").text("Status: Stopped");
					}
				};
	
				return GoLGrid;
			});
})();