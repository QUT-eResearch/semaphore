#!/bin/bash
# cd manager
forever start -m 999 -l executor.manager.log -o manager.log -e manager.err.log -a manager/app.js
