document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskTitleInput = document.getElementById('task-title');
    const taskDescInput = document.getElementById('task-desc');
    const taskList = document.getElementById('task-list');
    const taskCount = document.getElementById('task-count');

    // Fetch and display tasks
    const fetchTasks = async () => {
        try {
            const response = await fetch('/api/tasks');
            if (!response.ok) throw new Error('Failed to fetch tasks');
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error('Error:', error);
            taskList.innerHTML = `<li class="error">Failed to load tasks. Please try again later.</li>`;
        }
    };

    // Render tasks to the DOM
    const renderTasks = (tasks) => {
        taskList.innerHTML = '';
        taskCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;

        if (tasks.length === 0) {
            taskList.innerHTML = '<li class="empty-state">No tasks found. Add one above!</li>';
            return;
        }

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task._id;

            li.innerHTML = `
                <div class="task-content">
                    <label class="checkbox-container">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task._id}', ${!task.completed}, '${escapeHTML(task.title)}', '${escapeHTML(task.description || '')}')">
                        <span class="checkmark"></span>
                    </label>
                    <div class="task-text">
                        <h3 class="task-title">${escapeHTML(task.title)}</h3>
                        ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" onclick="openEditMode('${task._id}', '${escapeHTML(task.title)}', '${escapeHTML(task.description || '')}', ${task.completed})" title="Edit task">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="delete-btn" onclick="deleteTask('${task._id}')" title="Delete task">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            `;
            taskList.appendChild(li);
        });
    };

    // Open inline edit mode for a task
    window.openEditMode = (id, title, description, completed) => {
        const li = document.querySelector(`li[data-id="${id}"]`);
        if (!li) return;

        li.classList.add('editing');
        li.innerHTML = `
            <div class="edit-form">
                <input type="text" class="edit-title-input" value="${title}" placeholder="Task title" required />
                <input type="text" class="edit-desc-input" value="${description}" placeholder="Details (optional)" />
                <div class="edit-actions">
                    <button class="btn-save" onclick="saveEdit('${id}', ${completed})">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Save
                    </button>
                    <button class="btn-cancel" onclick="fetchTasks()">Cancel</button>
                </div>
            </div>
        `;

        // Auto-focus and place cursor at end of title
        const titleInput = li.querySelector('.edit-title-input');
        titleInput.focus();
        titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
    };

    // Save edited task
    window.saveEdit = async (id, completed) => {
        const li = document.querySelector(`li[data-id="${id}"]`);
        if (!li) return;

        const newTitle = li.querySelector('.edit-title-input').value.trim();
        const newDesc = li.querySelector('.edit-desc-input').value.trim();

        if (!newTitle) {
            li.querySelector('.edit-title-input').focus();
            return;
        }

        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle, description: newDesc, completed })
            });

            if (!response.ok) throw new Error('Failed to update task');
            fetchTasks();
        } catch (error) {
            console.error('Error saving edit:', error);
            alert('Failed to save changes.');
        }
    };

    // Make fetchTasks globally accessible (for cancel button)
    window.fetchTasks = fetchTasks;

    // Add a new task
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = taskTitleInput.value.trim();
        const description = taskDescInput.value.trim();

        if (!title) return;

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description })
            });

            if (!response.ok) throw new Error('Failed to add task');

            taskTitleInput.value = '';
            taskDescInput.value = '';
            fetchTasks();
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task. See console for details.');
        }
    });

    // Toggle task completion
    window.toggleTask = async (id, completed, title, description) => {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, completed })
            });

            if (!response.ok) throw new Error('Failed to update task');
            fetchTasks();
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Failed to update task.');
            fetchTasks();
        }
    };

    // Delete a task
    window.deleteTask = async (id) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete task');
            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task.');
        }
    };

    // Helper to escape HTML to prevent XSS
    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    // Initial load
    fetchTasks();
});
