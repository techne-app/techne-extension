(function() {
    const BASE_URL = "https://techne.app";
    function addTagsToElement(element, tags) {
        if (!element || !tags || tags.length === 0) return;
        
        const comheadElement = element.querySelector('.comhead');
        if (!comheadElement) return;

        const tagsContainer = document.createElement('span');
        tagsContainer.style.color = 'blue';
        const tagText = document.createTextNode(` | ${tags[0]}`);
        tagsContainer.appendChild(tagText);
        comheadElement.appendChild(tagsContainer);
    }

    // Story handling
    const storyElement = document.querySelector('tr.athing.submission');
    if (storyElement) {
        const story_id = Number(storyElement.getAttribute('id'));
        const subtextElement = storyElement.closest('table.fatitem')?.querySelector('.subtext .subline');

        if (subtextElement) {
            fetch(`${BASE_URL}/story-tags/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({story_ids: [story_id]}),
            })
            .then(response => response.json())
            .then(data => {
                const story = data[0];
                if (story?.tags && story?.tag_anchors && story.tags.length === story.tag_anchors.length) {
                    const tagsContainer = document.createElement('span');
                    tagsContainer.style.color = 'blue';
                    
                    const tagCount = Math.min(story.tags.length, 3);
                    for (let i = 0; i < tagCount; i++) {
                        const anchorElement = document.createElement('a');
                        anchorElement.href = story.tag_anchors[i];
                        anchorElement.textContent = ' | ' + story.tags[i];
                        anchorElement.style.color = 'blue';
                        anchorElement.style.textDecoration = 'none';
                        tagsContainer.appendChild(anchorElement);
                    }
                    subtextElement.appendChild(tagsContainer);
                }
            })
            .catch(error => console.error('Error fetching story tags:', error));
        }
    }

    // Comments handling
    const allComments = document.querySelectorAll('tr[class="athing comtr"]');
    const [threadComments, nonThreadComments] = Array.from(allComments).reduce((acc, comment) => {
        const indentElement = comment.querySelector('td.ind img');
        (indentElement?.width === 0 ? acc[0] : acc[1]).push(comment);
        return acc;
    }, [[], []]);

    const threadIds = threadComments.map(el => Number(el.getAttribute('id')));
    const commentIds = nonThreadComments.map(el => Number(el.getAttribute('id')));

    // Fetch thread tags
    if (threadIds.length > 0) {
        fetch(`${BASE_URL}/thread-tags/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({thread_ids: threadIds}),
        })
        .then(response => response.json())
        .then(data => data.forEach(thread => {
            const element = document.getElementById(thread.id);
            addTagsToElement(element, thread.tags);
        }))
        .catch(error => console.error('Error fetching thread tags:', error));
    }

    // Fetch comment tags
    if (commentIds.length > 0) {
        fetch(`${BASE_URL}/comment-tags/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({comment_ids: commentIds}),
        })
        .then(response => response.json())
        .then(data => data.forEach(comment => {
            const element = document.getElementById(comment.id);
            addTagsToElement(element, comment.tags);
        }))
        .catch(error => console.error('Error fetching comment tags:', error));
    }
})();