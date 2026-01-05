const { ipcRenderer } = require('electron');

class NeptuneEditor {
  constructor() {
    this.data = { tasks: [], completed: [], skipped: [] };
    this.taskList = document.getElementById('task-list');
    this.completedSection = document.getElementById('completed-section');
    this.completedList = document.getElementById('completed-list');
    this.addButton = document.getElementById('add-task-btn');
    this.toggleCompletedBtn = document.getElementById('toggle-completed');
    this.showCompleted = false;
    
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.render();
  }

  async loadData() {
    this.data = await ipcRenderer.invoke('read-todo-file');
  }

  async saveData() {
    await ipcRenderer.invoke('write-todo-file', this.data);
  }

  setupEventListeners() {
    this.addButton.addEventListener('click', () => this.addTask());
    
    this.toggleCompletedBtn.addEventListener('click', () => {
      this.showCompleted = !this.showCompleted;
      this.renderCompleted();
    });
    
    // File drop support
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.showDropZone();
    });
    
    document.addEventListener('dragleave', (e) => {
      if (!document.elementFromPoint(e.clientX, e.clientY)) {
        this.hideDropZone();
      }
    });
    
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      this.hideDropZone();
      this.handleFileDrop(e);
    });

    // Listen for external file changes
    ipcRenderer.on('file-changed', () => {
      this.loadData().then(() => this.render());
    });
  }

  showDropZone() {
    if (!document.querySelector('.drop-zone')) {
      const dropZone = document.createElement('div');
      dropZone.className = 'drop-zone';
      dropZone.innerHTML = '<p>Drop files here to create tasks</p>';
      this.taskList.insertBefore(dropZone, this.taskList.firstChild);
    }
  }

  hideDropZone() {
    const dropZone = document.querySelector('.drop-zone');
    if (dropZone) {
      dropZone.remove();
    }
  }

  handleFileDrop(e) {
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      this.addTask(file.name);
    });
  }

  addTask(text = '') {
    const task = {
      id: Date.now() + Math.random(),
      text: text,
      created: new Date().toISOString(),
      dueDate: null,
      isNew: true
    };
    
    this.data.tasks.unshift(task);
    this.saveData();
    this.render();
    
    // Focus on the new task if it's empty
    if (!text) {
      setTimeout(() => {
        const input = document.querySelector(`[data-task-id="${task.id}"] .task-input`);
        if (input) input.focus();
      }, 100);
    }
  }

  completeTask(taskId) {
    const taskIndex = this.data.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const task = this.data.tasks.splice(taskIndex, 1)[0];
      task.completed = new Date().toISOString();
      this.data.completed.push(task);
      this.saveData();
      this.render();
    }
  }

  skipTask(taskId) {
    const taskIndex = this.data.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const task = this.data.tasks.splice(taskIndex, 1)[0];
      task.skipped = new Date().toISOString();
      this.data.skipped.push(task);
      this.saveData();
      this.render();
    }
  }

  updateTaskText(taskId, text) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      task.text = text;
      this.saveData();
    }
  }

  setTaskDueDate(taskId, dueDate) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      task.dueDate = dueDate;
      this.saveData();
      this.render();
    }
  }

  deleteCompletedTask(taskId) {
    const taskIndex = this.data.completed.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      this.data.completed.splice(taskIndex, 1);
      this.saveData();
      this.render();
    }
  }

  isTaskOverdue(task) {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }

  moveTask(fromIndex, toIndex) {
    const task = this.data.tasks.splice(fromIndex, 1)[0];
    this.data.tasks.splice(toIndex, 0, task);
    this.saveData();
    this.render();
  }

  render() {
    this.taskList.innerHTML = '';
    
    if (this.data.tasks.length === 0) {
      this.renderEmptyState();
    } else {
      this.data.tasks.forEach((task, index) => {
        const taskElement = this.createTaskElement(task, index);
        this.taskList.appendChild(taskElement);
        
        // Add animation for new tasks
        if (task.isNew) {
          taskElement.classList.add('new-task');
          delete task.isNew;
        }
      });
    }

    // Show completed section if there are completed tasks
    if (this.data.completed.length > 0) {
      this.completedSection.style.display = 'block';
      this.renderCompleted();
    } else {
      this.completedSection.style.display = 'none';
    }
  }

  renderEmptyState() {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <h3>No tasks yet</h3>
      <p>Click the + button to add a task<br>or drag files here to create tasks from filenames</p>
    `;
    this.taskList.appendChild(emptyState);
  }

  renderCompleted() {
    this.completedList.innerHTML = '';
    const arrow = this.toggleCompletedBtn.querySelector('i');
    
    if (!this.showCompleted) {
      this.completedList.style.display = 'none';
      arrow.className = 'fas fa-chevron-down';
      return;
    }
    
    this.completedList.style.display = 'block';
    arrow.className = 'fas fa-chevron-up';
    
    this.data.completed.forEach(task => {
      const completedElement = this.createCompletedTaskElement(task);
      this.completedList.appendChild(completedElement);
    });
  }

  createCompletedTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'completed-task';
    
    const completedDate = new Date(task.completed).toLocaleDateString();
    
    taskElement.innerHTML = `
      <input type="checkbox" class="task-checkbox" checked disabled>
      <span class="task-text">${task.text}</span>
      <span class="completed-date">${completedDate}</span>
      <button class="delete-completed-btn" title="Delete permanently">
        <i class="fas fa-trash"></i>
      </button>
    `;
    
    // Add delete functionality
    const deleteBtn = taskElement.querySelector('.delete-completed-btn');
    deleteBtn.addEventListener('click', () => {
      taskElement.classList.add('deleting');
      setTimeout(() => this.deleteCompletedTask(task.id), 300);
    });
    
    return taskElement;
  }

  createTaskElement(task, index) {
    const taskElement = document.createElement('div');
    const overdue = this.isTaskOverdue(task);
    
    taskElement.className = `task-item ${overdue ? 'overdue' : ''}`;
    taskElement.draggable = true;
    taskElement.dataset.taskId = task.id;
    taskElement.dataset.index = index;

    const dueDateDisplay = task.dueDate ? 
      `<span class="due-date">${new Date(task.dueDate).toLocaleDateString()}</span>` : 
      '<span class="due-date-placeholder">No due date</span>';

    taskElement.innerHTML = `
      <input type="checkbox" class="task-checkbox">
      <input type="text" class="task-input" value="${task.text}" placeholder="Enter task...">
      <div class="task-controls">
        ${dueDateDisplay}
        <button class="date-picker-btn" title="Set due date">
          <i class="fas fa-calendar"></i>
        </button>
        <input type="date" class="date-picker" style="display: none;">
        <button class="task-skip">×</button>
      </div>
    `;

    // Event listeners
    const checkbox = taskElement.querySelector('.task-checkbox');
    const input = taskElement.querySelector('.task-input');
    const skipButton = taskElement.querySelector('.task-skip');
    const datePickerBtn = taskElement.querySelector('.date-picker-btn');
    const datePicker = taskElement.querySelector('.date-picker');

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        taskElement.classList.add('completing');
        setTimeout(() => this.completeTask(task.id), 300);
      }
    });

    input.addEventListener('blur', () => {
      this.updateTaskText(task.id, input.value);
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      }
    });

    skipButton.addEventListener('click', () => {
      taskElement.classList.add('skipping');
      setTimeout(() => this.skipTask(task.id), 300);
    });

    datePickerBtn.addEventListener('click', () => {
      datePicker.style.display = 'block';
      datePicker.focus();
      datePicker.click();
    });

    datePicker.addEventListener('change', () => {
      this.setTaskDueDate(task.id, datePicker.value);
      datePicker.style.display = 'none';
    });

    datePicker.addEventListener('blur', () => {
      setTimeout(() => {
        datePicker.style.display = 'none';
      }, 200);
    });

    // Drag and drop
    taskElement.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', index);
      taskElement.classList.add('dragging');
    });

    taskElement.addEventListener('dragend', () => {
      taskElement.classList.remove('dragging');
    });

    taskElement.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    taskElement.addEventListener('drop', (e) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const toIndex = index;
      
      if (fromIndex !== toIndex) {
        this.moveTask(fromIndex, toIndex);
      }
    });

    return taskElement;
  }
}

// Initialize the editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new NeptuneEditor();
});