#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const todoFile = process.argv[2];

if (!todoFile) {
  console.log('Usage: neptune <file.todo>');
  process.exit(1);
}

const electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
const mainScript = path.join(__dirname, '..', 'src', 'index.js');

const child = spawn(electronPath, [mainScript, todoFile], {
  stdio: 'inherit'
});

child.on('close', (code) => {
  process.exit(code);
});