(function() {

function DataTable() {
  Object.defineProperty(this, '_columnsMap', {value : {}});
  Object.defineProperty(this, '_columns', {value : []});
  Object.defineProperty(this, '_data', {value : []});
}

//====================== Private functions
//========================================
function validateIndex(tableObj, row, col) {
  validateRowIndex(tableObj, row);
  validateColIndex(tableObj, col);
}

function validateColIndex(tableObj, index) {
  if (index < 0 || index >= tableObj.colSize()) throw new RangeError("The specified column index is out of bounds.");
}

function validateRowIndex(tableObj, index) {
  if (index < 0 || index >= tableObj.rowSize()) throw new RangeError("The specified row index is out of bounds.");
}

function setValues(setfn, len, values) {
  if (Array.isArray(values)) {
    if (len > values.length) len = values.length;
    for (var i = 0; i < len; ++i) {
      setfn(i, values[i]);
    }
  } else {
    for (var i = 0; i < len; ++i) {
      setfn(i, values);
    }
  }
}

function setColValues(tableObj, colIndex, values) {
  setValues( function(i, v){ tableObj._data[i][colIndex] = v; }, tableObj.rowSize(), values );
}

function setRowValues(tableObj, rowIndex, values) {
  setValues( function(i, v){ tableObj._data[rowIndex][i] = v; }, tableObj.colSize(), values );
}

function findColIndex(tableObj, indexOrName) {
  var index = indexOrName;
  if (typeof indexOrName === 'string') {
    index = tableObj.getColIndex(indexOrName);
  }
  return index;
}

//====================== Public functions  
//=======================================
DataTable.prototype.getColIndex = function(colName) {
  return this._columnsMap[colName];
};

DataTable.prototype.getColName = function(colIndex) {
  return this._columns[colIndex];
};

DataTable.prototype.setColName = function(colIndex, name) {
  var currentName = this._columns[colIndex];
  if (currentName) delete this._columnsMap[currentName];
  this._columnsMap[name] = colIndex;
  this._columns[colIndex] = name;
};

DataTable.prototype.colSize = function () {
  return this._columns.length;
};

DataTable.prototype.rowSize = function () {
  return this._data.length;
};

DataTable.prototype.get = function(row, col) {
  validateIndex(this, row, col);
  return this._data[row][col];
};

DataTable.prototype.set = function(row, col, val) {
  validateIndex(this, row, col);
  this._data[row][col] = val;
};

DataTable.prototype.addCol = function(index, name) {
  if (typeof index === 'string' && typeof name === 'undefined') name = index;
  var colSize = this._columns.length;
  if (typeof index !== 'number' || index > colSize) index = colSize;
  if (index < 0) index += colSize;
  if (typeof name === 'string' && name.length > 0) {
    if (name in this._columnsMap) throw new Error("Column name exists: " + name);
    this._columnsMap[name] = index;
  } else {
    name = '';
  }
  if (index == colSize) {
    this._columns.push(name);
  } else {
    this._columns.splice(index, 0, name);
    for (var i = index + 1; i < this._columns.length; ++i) {
      if (this._columns[i]) this._columnsMap[this._columns[i]] = i;
    }
  }
  if (this._data.length > 0) {
    if (index >= this._columns.length) {
      this._data.forEach(function(row) { row.push(undefined); });
    } else {
      this._data.forEach(function(row) { row.splice(index, 0, undefined); });
    }
  }
  return index;
};

DataTable.prototype.addRow = function(index) {
  if (typeof index !== 'number' || index >= this._data.length) {
    //append
    this._data.push(new Array(this._columns.length));
    return this._data.length - 1;
  } else if (index < this._data.length) {
    //prepend or insert
    this._data.splice(index, 0, new Array(this._columns.length));
    if (index < 0) index += this._data.length;
    return index;
  }
};

DataTable.prototype.resizeCol = function(newSize) {
  for (var i = 0; i < this._data.length; ++i) {
    this._data[i].length = newSize;
  }
  this._columns.length = newSize;
};

DataTable.prototype.resizeRow = function(newSize) {
  var delta = newSize - this._data.length;
  if (delta == 0) {
    return;
  } else if (delta > 0) {
    while (delta--) {
      this._data.push(new Array(this._columns.length))
    }
  } else {
    this._data.length = newSize;
  }
};

DataTable.prototype.resize = function(rowSize, colSize) {
  this.resizeCol(colSize);
  this.resizeRow(rowSize);
}

DataTable.prototype.appendCol = function(values, name) {
  var ci = this.addCol(name);
  setColValues(this, ci, values);
  return ci;
}

DataTable.prototype.prependCol = function(values, name) {
  var ci = this.addCol(0, name);
  setColValues(this, ci, values);
  return ci;
}

DataTable.prototype.insertCol = function(colIndex, values, name) {
  var ci = this.addCol(colIndex, name);
  setColValues(this, ci, values);
  return ci;
}

DataTable.prototype.appendRow = function(values) {
  var ri = this.addRow();
  setRowValues(this, ri, values);
  return ri;
}

DataTable.prototype.prependRow = function(values) {
  var ri = this.addRow(0);
  setRowValues(this, ri, values);
  return ri;
}

DataTable.prototype.insertRow = function(rowIndex, values) {
  var ri = this.addRow(rowIndex);
  setRowValues(this, ri, values);
  return ri;
}

function DataTableList(table, index) {
  this.getTable = function() { return table; };
  this.getIndex = function() { return index; };
}
DataTableList.prototype.forEach = function(callback) { 
  for (var i=0; i<this.size(); ++i) {
    callback(this.get(i), i);
  }
};
DataTableList.prototype.toString = function() {
  var str = '[';
  var delimiter = '';
  this.forEach( function(cellVal) {
    str += (delimiter + cellVal);
    delimiter = ', ';
  });
  str += ']';
  return str;
}

function DataTableColumn(table, colIndex) {
  DataTableList(table, colIndex);
  this.get = this.getRow = function(rowIndex) {
    return table.get(rowIndex, colIndex);
  };
  this.set = this.setRow = function(rowIndex, val) {
    table.set(rowIndex, colIndex, val);
  };
  this.size = function() {
    return table.rowSize();
  }
}
DataTableColumn.prototype = DataTableList.prototype; 
DataTableColumn.prototype.getName = function() { return this.getTable().getColName(this.getIndex()); }
DataTableColumn.prototype.setName = function(name) { return this.getTable().setColName(this.getIndex(), name); }

function DataTableRow(table, rowIndex) {
  DataTableList(table, rowIndex);
  this.get = this.getCol = function(colIndexOrName) {
    return table.get(rowIndex, findColIndex(table, colIndexOrName));
  };
  this.set = this.setCol = function(colIndexOrName, val) {
    table.set(rowIndex, findColIndex(table, colIndexOrName), val);
  };
  this.size = function() {
    return table.colSize();
  }
}
DataTableRow.prototype = DataTableList.prototype; 

DataTable.prototype.col = function(indexOrName){
  var colIndex = findColIndex(this, indexOrName)
  return new DataTableColumn(this, colIndex);
}

DataTable.prototype.row = function(index){
  return new DataTableRow(this, index);
}

DataTable.prototype.forEachCol = function(callback){
  for (var i=0; i<this.colSize(); ++i) {
    callback(this.col(i), i);
  }
}

DataTable.prototype.forEachRow = function(callback){
  for (var i=0; i<this.rowSize(); ++i) {
    callback(this.row(i), i);
  }
}

DataTable.prototype.reset = function() {
  for (prop in this._columnsMap) { 
    if (this._columnsMap.hasOwnProperty(prop)) delete this._columnsMap[prop]; 
  }
  this._columns.length = 0;
  this._data.length = 0;
}

DataTable.prototype.fromArray = function(dataArray, columnFirst) {
  if (dataArray.length === 0 || dataArray[0].length === 0) return;
  var rlen, clen, getfn;
  if (columnFirst) {
    rlen = dataArray[0].length;
    clen = dataArray.length;
    getfn = function(r,c) { return dataArray[c][r]; };
  } else {
    rlen = dataArray.length;
    clen = dataArray[0].length;
    getfn = function(r,c) { return dataArray[r][c]; };
  }
  this.resize(rlen, clen);
  for (var r=0; r<rlen; ++r) {
    for (var c=0; c<clen; ++c) {
      this._data[r][c] = getfn(r,c);
    }
  }
}

/// @param columnFirst if true, the first order of the array represents the column of the table
DataTable.prototype.toArray = function(columnFirst) {
  if (columnFirst) {
    var arr = new Array(this.colSize());
    for (var c=0; c<this.colSize(); ++c) {
      arr[c] = new Array(this.rowSize());
      for (var r=0; r<this.rowSize(); ++r) {
        arr[c][r] = this._data[r][c];
      }
    }
    return arr;
  } else {
    return this._data.slice();
  }
}

DataTable.prototype.fromText = function(text, parser, omitHeader) {
  this.reset();
  var firstRecord = true;
  var record = [];
  var that = this;
  function nextRecord() {
    if (record.length > 0) {
      if (record.length > 1 || record[0].length > 0) {
        if (firstRecord) {
          if (omitHeader) {
            that.resizeCol(record.length);
            that.appendRow(record);
          } else {
            record.forEach(function(name){ that.addCol(name); });
          }
          firstRecord = false;
        } else {
          that.appendRow(record);
        }
      }
      record = [];
    }
  }  
  function nextToken(token) {
    record.push(token.trim());
  }
  parser(text, nextRecord, nextToken);
  nextRecord();
}

DataTable.prototype.toText = function(formatter, omitHeader) {
  var text = formatter(this._data);
  if (omitHeader) return text;
  else return formatter([this._columns]) + text;
}

if (typeof module === 'undefined') module = {};
if (typeof module.exports === 'undefined') this['DataTable'] = DataTable;
else module.exports = DataTable;
})();

DataTextFormat = {};
DataTextFormat.DSV = function(dataAsArray, delimiter, wrapper) {
  if (!Array.isArray(dataAsArray)) throw new Error("The argument dataAsArray must be specified and must be an array.");
  if (!delimiter) throw new Error("The argument delimiter must be specified.");
  if (!wrapper) wrapper = '';
  var s = '';
  for (var i = 0; i < dataAsArray.length; ++i) {
    var row = dataAsArray[i];
    var line = '';
    if (Array.isArray(row)) {
      var d = '';
      for (var j = 0; j < row.length; ++j) {
        var val = row[j];
        if (typeof val === 'undefined') val = '';
        line += (d + wrapper + val + wrapper);
        d = delimiter;
      }
    } else {
      line = row;
    }
    s += (line + '\n');
  }
  return s;
}

DataTextFormat.CSV = function(dataAsArray) {
  return DataTextFormat.DSV(dataAsArray, ',', '"');
}

DataTextFormat.TSV = function(dataAsArray) {
  return DataTextFormat.DSV(dataAsArray, '\t');
}

DataTextParser = {};
DataTextParser.DSV = function(dataAsString, delimiter, wrapper, nextRecord, nextToken) {
  delimiter = (delimiter || ',');
  var quotedFieldPattern = wrapper ? ('?:' + wrapper + '([^\"]*(?:\"\"[^\"]*)*)' + wrapper + '|') : '';
  var objPattern = new RegExp(('(\\' + delimiter + '|\\r?\\n|\\r|^)(' + quotedFieldPattern + '([^\"\\' + delimiter + '\\r\\n]*))'), "gi");
  var arrMatches = null;
  if (dataAsString.slice(0, delimiter.length) == delimiter) nextToken('');
  while (arrMatches = objPattern.exec( dataAsString )){
    var strMatchedDelimiter = arrMatches[1];
    if (strMatchedDelimiter.length &&	(strMatchedDelimiter != delimiter)){
      nextRecord();
    }
    if (arrMatches[2]){
      var strMatchedValue = arrMatches[ 2 ].replace( new RegExp( "\"\"", "g" ), "\"");
    } else {
      var strMatchedValue = arrMatches[ 3 ];
    }
    nextToken(strMatchedValue);
  }
}
DataTextParser.CSV = function(dataAsString, nextRecord, nextToken) {
  return DataTextParser.DSV(dataAsString, ',', '"', nextRecord, nextToken);
}
DataTextParser.TSV = function(dataAsString, nextRecord, nextToken) {
  return DataTextParser.DSV(dataAsString, '\t', '', nextRecord, nextToken);
}