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
            
            li.innerHTML = `
                <div class="task-content">
                    <label class="checkbox-container">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task._id}', ${!task.completed}, '${task.title}')">
                        <span class="checkmark"></span>
                    </label>
                    <div class="task-text">
                        <h3 class="task-title">${escapeHTML(task.title)}</h3>
                        ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteTask('${task._id}')">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            `;
            taskList.appendChild(li);
        });
    };

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
            
            // Clear inputs and refresh list
            taskTitleInput.value = '';
            taskDescInput.value = '';
            fetchTasks();
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task. See console for details.');
        }
    });

    // Toggle task completion
    window.toggleTask = async (id, completed, title) => {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, completed })
            });
            
            if (!response.ok) throw new Error('Failed to update task');
            fetchTasks();
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Failed to update task.');
            fetchTasks(); // revert checkbox visual state
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
