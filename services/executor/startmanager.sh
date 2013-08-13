#!/bin/bash
# cd manager
forever start -m 7 -l ~/logs/executor.manager.log -o ~/logs/executor.manager.out.log -e ~/logs/executor.manager.err.log -a manager/app.js