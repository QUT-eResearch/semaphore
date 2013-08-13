#!/bin/bash
# cd manager
forever start -m 7 -l ~/logs/executor.worker.log -o ~/logs/executor.worker.out.log -e ~/logs/executor.worker.err.log -a --killSignal=SIGTERM worker/app.js