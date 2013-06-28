#!/bin/bash
# cd manager
forever start -m 999 -l executor.worker.log -o worker.log -e worker.err.log -a worker/app.js
