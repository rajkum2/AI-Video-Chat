#!/bin/bash

sudo npm install
sudo npm install -g pm2
sudo pm2 start src/livesmartai.js
sudo pm2 startup
sudo pm2 save