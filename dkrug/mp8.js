'use strict';
// mp8 is a nodejs solution for the Grue problem of the week,
// possibly WORST CODE EVER! D/K 2015

//Package includes
var fs      = require('fs');
var cl      = require('command-line-args');
var format  = require('format');

//Globals
var cli         = processCli();
var vsprintf    = format.vsprintf;
var directions  = {
    north: 1,
    east: 2,
    south: 4,
    west: 8,
    dead: 15
};

//Classes
function Cell(id, x, y) {
    this.north   = false;
    this.south   = false;
    this.east    = false;
    this.west    = false;
    this.id      = id;
    this.start   = false;
    this.finish  = false;
    this.y       = y;
    this.x       = x;
    this.visited = 0;
}

//Prototypes
Array.prototype.peek = function() {
    
    if ( this.length > 0 ) {
        return this[this.length - 1];
    }

    return null;
};

Cell.prototype.isVistedBy = function (d) {
    return (this.visited & d) == d;
};

Cell.prototype.hasWalked = function (d) {
    return (this.visited & d) == d;
};

Cell.prototype.visitFrom = function (d) {
    this.visited |= d;
};

Cell.prototype.walk = function (d) {
    this.visited |= d;
};

Cell.prototype.isDead = function () {
    
    if (!this.north && !this.south && !this.east && !this.west) {
        return true;
    }
    
    return this.visited === directions.dead;
};

//Go
process.exit(main());

//functions
function main() {

    var i, l, solutions = [], file;

    if (!cli.options.files || cli.options.files.length == 0) {
        exitShowUsage();
    }

    for (i = 0, l = cli.options.files.length; i < l; i++) {

        file = cli.options.files[i];

        if (file) {
            solutions.push(solveMaze(cli.options.files[i]));
        }
    }

    if (solutions.length) {

        for (i = 0, l = solutions.length; i < l; i++) {
            console.log(solutions[i]);
        }

        return;
    }

    exitShowUsage();
}

function solveMaze(fileName) {

    var results = vsprintf('  [%s]: ', fileName), maze, stack = [], path = [], cell, complete, nextCell;

    try {
        fs.accessSync(fileName, fs.R_OK | fs.F_OK);
    }
    catch (err) {
        return results + 'Cannot access file'
    }

    if (!(maze = createMaze(fileName))) {
        return results + 'Invalid maze format';
    }

    stack.push(maze.start);

    while (true) {

        if (stack.length === 0) {
            break;
        }

        cell = stack.peek();

        if (cell.finish) {
            complete = true;
            break;
        }

        if (cell.isDead()) {
            stack.pop();
            path.pop();
            continue;
        }

        if (cell.north && !cell.hasWalked(directions.north)) {

            cell.walk(directions.north);

            nextCell = maze.cells[cell.y - 1][cell.x];

            if (!nextCell.isVistedBy(directions.south)) {

                nextCell.visitFrom(directions.south);
                stack.push(nextCell);
                path.push('N');

                continue;
            }
        }

        if (cell.south && !cell.hasWalked(directions.south)) {

            cell.walk(directions.south);

            nextCell = maze.cells[cell.y + 1][cell.x];

            if (!nextCell.isVistedBy(directions.north)) {

                nextCell.visitFrom(directions.north);
                stack.push(nextCell);
                path.push('S');

                continue;
            }
        }

        if (cell.east && !cell.hasWalked(directions.east)) {

            cell.walk(directions.east);

            nextCell = maze.cells[cell.y][cell.x + 1];

            if (!nextCell.isVistedBy(directions.west)) {

                nextCell.visitFrom(directions.west);
                stack.push(nextCell);
                path.push('E');

                continue;
            }
        }

        if (cell.west && !cell.hasWalked(directions.west)) {

            cell.walk(directions.west);

            nextCell = maze.cells[cell.y][cell.x - 1];

            if (!nextCell.isVistedBy(directions.east)) {

                nextCell.visitFrom(directions.east);
                stack.push(nextCell);
                path.push('W');

                continue;
            }
        }

        stack.pop();
        path.pop();
    }

    if (complete) {
        results += path.join('');
    }
    else {
        results += "No solution";
    }

    return results;
}

function createMaze(fileName) {

    var rows = [], row = [], c, sFound, fFound, results = null, cell, data = fs.readFileSync(fileName, { encoding: "utf8" });

    data = data.replace(/\r?\n|\r/g, '|').toLowerCase();

    if (data.charAt(data.length - 1) !== '|' ) {
        data += '|';
    }

    for (var i = 0, l = data.length; i < l; i++) {

        c = data.charAt(i);

        switch (c) {
            case 's':

                if (sFound) {
                    return;
                }

                sFound = true;

                row.push(c);
                break;

            case 'f':

                if (fFound) {
                    return;
                }

                fFound = true;

                row.push(c);
                break;

            case '-':
            case 'x':
                row.push(c);
                break;

            case '|':
                rows.push(row.slice(0));
                row.length = 0;
                break;

            default:
                return;
                break;
        }
    }

    results = {
        start:  null,
        finish: null,
        cells:  []
    };

    for (var y = 0, yL = rows.length, id = 0; y < yL; y++) {
        for (var x = 0, xL = rows[y].length; x < xL; x++) {

            cell = new Cell(++id, x, y);
            c    = rows[y][x];

            switch (c) {
                case 's':
                    cell.start = true;
                    results.start = cell;
                    break;

                case 'f':
                    cell.finish = true;
                    results.finish = cell;
                    break;

                case 'x':
                    row.push(cell);
                    continue;
                    break;
            }

            if (y > 0 && rows[y - 1][x] !== 'x') {
                cell.north = true;
            }

            if (y + 1 < yL && rows[y + 1][x] !== 'x') {
                cell.south = true;
            }

            if (x > 0 && rows[y][x - 1] !== 'x') {
                cell.west = true;
            }

            if (x + 1 < xL && rows[y][x + 1] !== 'x') {
                cell.east = true;
            }

            row.push(cell);
        }

        results.cells.push(row.slice(0));
        row.length = 0;
    }

    return results;
}

function exitShowUsage(code) {

    console.log(cli.usage);

    process.exit(code || 1);
}

function processCli() {

    var results, cli = cl([
        { name: 'files', alias: 'f', type: Array, multiple: true, defaultOption: true, description: 'One or more maze files to solve.' }
    ]);

    results = {
        options: cli.parse(),
        usage: cli.getUsage({
            title: 'mp8',
            header: 'NodeJs solution for the Grue problem...'
        })
    };

    return results;
}
