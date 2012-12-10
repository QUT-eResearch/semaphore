# Semaphore Execution Service (REST Web Service wrapper for native model binaries)

This software is a web application that provides RESTful API to execute computational programs on the cloud. 
The computational programs must be able to be executed and controlled using command-line interface. 
The RESTful API allows input and output files to be supplied to and accessed from the programs.
Currently, the focus is in running Soil Organic Matter Model Century/Daycent as part of a scientific workflow.
This software is only a basic prototype, which serves as an early showcase of an ongoing development.
To run the service on a server or local computer you will need to have:
- [Node JS](http://nodejs.org/)
- [Redis](http://redis.io/)
- [Century](http://www.nrel.colostate.edu/projects/century/)
- [Daycent](http://www.nrel.colostate.edu/projects/daycent/)

## Installation

    $ npm install semaphore

## Features

  - Job queue system
  - RESTful JSON API

## Developers Documentation

### Routing
To add a 'controller' that handles a particular path, add a js file or a folder containing js files under the `/routes` folder. 
An `index.js` file is needed in a sub folder to handle the root path relative to that folder.
For example, a file `/routes/jobs.js` that contains:
```js
module.exports = function(rel) {
  rel.get('/', function(req, res){});
  rel.post('/', function(req, res){});
}
```
will handle the get and post request to `http://hostname/jobs/`


## License 

(The GNU  Lesser General Public License)

Copyright (c) 2012-2013 Queensland University of Technology

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
