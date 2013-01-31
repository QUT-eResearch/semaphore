function setDummyCols() {
  var dt = new DataTable();
  dt.addCol('first col');
  dt.addCol('second col');
  return dt;
}


test( "DataTable.getColIndex", function() {
  var dt = setDummyCols();
  ok( dt.getColIndex('first col') === 0, "Passed!" );
  ok( dt.getColIndex('second col') === 1, "Passed!" );
  ok( dt.getColIndex('none') === undefined, "Passed!" );
});
test( "DataTable.getColName", function() {
  var dt = setDummyCols();
  ok( dt.getColName(0) === 'first col', "Passed!" );
  ok( dt.getColName(1) === 'second col', "Passed!" );
  ok( dt.getColName(2) === undefined, "Passed!" );
});
test( "DataTable.setColName", function() {
  var dt = setDummyCols();
  dt.setColName(0, 'new name');
  ok( dt.getColName(0) === 'new name', "Passed!" );
});

test( "get, set", function() {
  var R = 5, C = 5;
  var dt = new DataTable();
  for (var c = 0; c < C; ++c) dt.addCol();
  for (var r = 0; r < R; ++r) dt.addRow();
  for (var r = 0; r < R; ++r) {
    for (var c = 0; c < C; ++c) {
      deepEqual(dt.get(r, c), undefined);
      dt.set(r, c, 1);
      deepEqual(dt.get(r, c), 1);
    }
  }
});

test( "addCol, colSize", function() {
  //add col to an empty table 
  var dt = new DataTable();
  dt.addCol(); //add with no name
  deepEqual(dt.colSize(), 1);
  deepEqual(dt.getColName(0), '');
  
  dt.addCol('test'); //add with name
  deepEqual(dt.colSize(), 2);
  deepEqual(dt.getColIndex('test'), 1);
  deepEqual(dt.getColName(0), '');
  deepEqual(dt.getColName(1), 'test');
  
  dt.addCol(0, 'col 1'); //insert to the front
  deepEqual(dt.colSize(), 3);
  deepEqual(dt.getColIndex('col 1'), 0);
  deepEqual(dt.getColIndex('test'), 2);
  deepEqual(dt.getColName(0), 'col 1');
  deepEqual(dt.getColName(1), '');
  deepEqual(dt.getColName(2), 'test');
  
  dt.addCol(1, 'col 2'); //insert to the second position
  deepEqual(dt.colSize(), 4);
  deepEqual(dt.getColIndex('col 1'), 0);
  deepEqual(dt.getColIndex('col 2'), 1);
  deepEqual(dt.getColIndex('test'), 3);
  deepEqual(dt.getColName(0), 'col 1');
  deepEqual(dt.getColName(1), 'col 2');
  deepEqual(dt.getColName(2), '');
  deepEqual(dt.getColName(3), 'test');
  
  dt.addCol(-2, 'last third'); //insert to the last third position
  deepEqual(dt.colSize(), 5);
  deepEqual(dt.getColIndex('col 1'), 0);
  deepEqual(dt.getColIndex('col 2'), 1);
  deepEqual(dt.getColIndex('last third'), 2);
  deepEqual(dt.getColIndex('test'), 4);
  deepEqual(dt.getColName(0), 'col 1');
  deepEqual(dt.getColName(1), 'col 2');
  deepEqual(dt.getColName(2), 'last third');
  deepEqual(dt.getColName(3), '');
  deepEqual(dt.getColName(4), 'test');
  
  dt.addCol(2); //insert to third position
  deepEqual(dt.colSize(), 6);
  deepEqual(dt.getColIndex('col 1'), 0);
  deepEqual(dt.getColIndex('col 2'), 1);
  deepEqual(dt.getColIndex('last third'), 3);
  deepEqual(dt.getColIndex('test'), 5);
  deepEqual(dt.getColName(0), 'col 1');
  deepEqual(dt.getColName(1), 'col 2');
  deepEqual(dt.getColName(2), '');
  deepEqual(dt.getColName(3), 'last third');
  deepEqual(dt.getColName(4), '');
  deepEqual(dt.getColName(5), 'test');
  
  //add col to a non-empty table 

});

test( "addRow, rowSize", function() {
  var dt = new DataTable();
  dt.addCol('c1');
  dt.addCol('c2');
  dt.addCol('c3');
  deepEqual(dt.rowSize(), 0);
  dt.addRow();
  dt.set(0, 0, 'a');
  dt.addRow(0); //preappend to first pos
  dt.set(0, 1, 'b');
  deepEqual(dt.rowSize(0), 2);
  deepEqual(dt.get(0, 1), 'b');
  deepEqual(dt.get(1, 0), 'a');
  dt.addRow(1); //insert to 2nd pos
  dt.set(1, 2, 'c');
  deepEqual(dt.get(0, 1), 'b');
  deepEqual(dt.get(1, 2), 'c');
  deepEqual(dt.get(2, 0), 'a');
  dt.addRow(); //append to last pos
  dt.set(3, 0, 'd');
  deepEqual(dt.get(0, 1), 'b');
  deepEqual(dt.get(1, 2), 'c');
  deepEqual(dt.get(2, 0), 'a');
  deepEqual(dt.get(3, 0), 'd');
});

test( "appendCol", function() {
  var dt = setDummyCols();
  dt.appendRow(0);
  dt.appendRow(0);
  dt.appendCol(1, 'col 3');
  dt.appendCol([2,3], 'col 4');
  dt.appendCol([4,5]);
  var c1 = dt.col('col 3');
  var c2 = dt.col('col 4');
  var c3 = dt.col(4);
  deepEqual(c1.getRow(0), 1);
  deepEqual(c1.getRow(1), 1);
  deepEqual(c2.getRow(0), 2);
  deepEqual(c2.getRow(1), 3);
  deepEqual(c3.getRow(0), 4);
  deepEqual(c3.getRow(1), 5);
});

test( "prependCol", function() {
  var dt = setDummyCols();
  dt.appendRow(0);
  dt.appendRow(0);
  dt.prependCol([4,5]);
  dt.prependCol([2,3], 'col 2');
  dt.prependCol(1, 'col 1');
  var c1 = dt.col(0);
  var c2 = dt.col(1);
  var c3 = dt.col(2);
  deepEqual(c1.getRow(0), 1);
  deepEqual(c1.getRow(1), 1);
  deepEqual(c2.getRow(0), 2);
  deepEqual(c2.getRow(1), 3);
  deepEqual(c3.getRow(0), 4);
  deepEqual(c3.getRow(1), 5);
});

test( "insertCol", function() {
  var dt = setDummyCols();
  dt.appendRow(0);
  dt.appendRow(0);
  var c1 = dt.col(dt.insertCol(0,[1,2])); //insert to the front = prepend
  var c2 = dt.col(dt.insertCol(2,[3,4])); //insert to the middle
  dt.insertCol(dt.colSize(),[5,6],'last'); //insert to the end
  var c3 = dt.col('last');
  
  deepEqual(c1.getRow(0), 1);
  deepEqual(c1.getRow(1), 2);
  deepEqual(c2.getRow(0), 3);
  deepEqual(c2.getRow(1), 4);
  deepEqual(c3.getRow(0), 5);
  deepEqual(c3.getRow(1), 6);
});

test( "appendRow", function() {
  var dt = setDummyCols();
  deepEqual(dt.rowSize(), 0);
  dt.appendRow(1);
  dt.appendRow([2,3]);
  dt.appendRow([4,5]);
  var c1 = dt.row(0);
  var c2 = dt.row(1);
  var c3 = dt.row(2);
  deepEqual(c1.getCol(0), 1);
  deepEqual(c1.getCol(1), 1);
  deepEqual(c2.getCol(0), 2);
  deepEqual(c2.getCol(1), 3);
  deepEqual(c3.getCol(0), 4);
  deepEqual(c3.getCol(1), 5);
});

test( "prependRow", function() {
  var dt = setDummyCols();
  deepEqual(dt.rowSize(), 0);
  dt.prependRow(1);
  dt.prependRow([2,3]);
  dt.prependRow([4,5]);
  var c1 = dt.row(0);
  var c2 = dt.row(1);
  var c3 = dt.row(2);
  deepEqual(c1.getCol(0), 4);
  deepEqual(c1.getCol(1), 5);
  deepEqual(c2.getCol(0), 2);
  deepEqual(c2.getCol(1), 3);
  deepEqual(c3.getCol(0), 1);
  deepEqual(c3.getCol(1), 1);
});

test( "insertRow", function() {
  var dt = setDummyCols();
  deepEqual(dt.rowSize(), 0);
  dt.appendRow(1);
  dt.appendRow(2);
  dt.insertRow(1,[3,4]);
  var c1 = dt.row(0);
  var c2 = dt.row(1);
  var c3 = dt.row(2);
  deepEqual(c1.getCol(0), 1);
  deepEqual(c1.getCol(1), 1);
  deepEqual(c2.getCol(0), 3);
  deepEqual(c2.getCol(1), 4);
  deepEqual(c3.getCol(0), 2);
  deepEqual(c3.getCol(1), 2);
});

test( "fromArray, toArray", function() {
  var dt = new DataTable();
  var arr = [[11,12,13],[21,22,23],[31,32,33],[41,42,43]];
  dt.fromArray(arr);
  var arr2 = dt.toArray();
  deepEqual(arr.join(), arr2.join());
});

test( "toText(csv, tsv)", function() {
  var dt = new DataTable();
  var arr = [[11,12,13],[21,22,23],[31,32,33],[41,42,43]];
  dt.fromArray(arr);
  dt.setColName(0,'a');
  dt.setColName(1,'b');
  dt.setColName(2,'c');
  deepEqual(dt.toText(DataTextFormat.CSV), '"a","b","c"\n"11","12","13"\n"21","22","23"\n"31","32","33"\n"41","42","43"\n');
  deepEqual(dt.toText(DataTextFormat.TSV), 'a\tb\tc\n11\t12\t13\n21\t22\t23\n31\t32\t33\n41\t42\t43\n');
});

test( "fromText", function() {
  var dt = new DataTable();
  var csvtext1 = 'a,b,c\n11,12,13\n21,22,23\n31,32,33\n41,42,43\n';
  var csvtext2 = '"a","b","c"\n"11","12","13"\n"21","22","23"\n"31","32","33"\n"41","42","43"\n';
  dt.fromText(csvtext1, DataTextParser.CSV);
  deepEqual(dt.toText(DataTextFormat.CSV), csvtext2);
  dt.fromText(csvtext2, DataTextParser.CSV);
  deepEqual(dt.toText(DataTextFormat.CSV), csvtext2);
});
