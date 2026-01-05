# Neptune Todo Editor

A visual, notebook-style editor for .todo files that works like Jupyter Notebook but for task management.

## Features

- **Single File Focus**: Everything is stored in one .todo file - no auxiliary files or databases
- **Notebook Interface**: Clean, minimal UI that resembles a notebook page
- **Drag & Drop**: Drop any file to create a task from its filename
- **Visual Priority**: Drag tasks up/down to change priority order
- **Instant Actions**: Complete tasks with checkbox, skip with × button
- **Auto-Save**: All changes are immediately saved to the .todo file

## Installation

```bash
npm install -g neptune-todo
```

## Usage

```bash
# Open an existing .todo file
neptune mytasks.todo

# Create and open a new .todo file
neptune newtasks.todo
```

## How It Works

Neptune treats .todo files as the single source of truth. The UI is simply a visual interface for editing these files. When you:

- Add a task: It's immediately written to the .todo file
- Reorder tasks: The new order is saved instantly
- Complete/skip tasks: They're moved to hidden sections but preserved in the file
- Close and reopen: The exact state is restored from the .todo file

## File Format

The .todo file uses JSON internally but you only interact with the visual interface:

```json
{
  "tasks": [
    {"id": 123, "text": "Active task", "created": "2024-01-01T00:00:00Z"}
  ],
  "completed": [
    {"id": 124, "text": "Done task", "completed": "2024-01-01T01:00:00Z"}
  ],
  "skipped": [
    {"id": 125, "text": "Skipped task", "skipped": "2024-01-01T02:00:00Z"}
  ]
}
```

## Development

```bash
npm install
npm start
```