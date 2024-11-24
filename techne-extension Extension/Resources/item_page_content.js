(function() {
    // First part - handle the story (keeping existing code)
    const storyElement = document.querySelector('tr.athing.submission');
    if (!storyElement) {
        console.log("No story found on this page");
        return;
    }

    const story_id = Number(storyElement.getAttribute('id'));
    const subtextElement = storyElement.closest('table.fatitem')?.querySelector('.subtext .subline');

    if (!subtextElement) {
        console.log("No subtext element found for story");
        return;
    }

    console.log("Processing story ID:", story_id);

    // Story tags fetch
    fetch("https://techne.app/story-tags/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({story_ids: [story_id]}),
    })
    .then(response => response.json())
    .then(data => {
        if (!data || data.length === 0) {
            console.log("No tags returned from API");
            return;
        }
        
        const story = data[0];
        if (!story.tags || !story.tag_anchors) {
            console.log("Missing tags or tag_anchors in API response");
            return;
        }

        const tags = story.tags;
        const tagAnchors = story.tag_anchors;

        if (tags.length === tagAnchors.length && tags.length > 0) {
            const tagsContainer = document.createElement('span');
            tagsContainer.style.color = 'blue';
            
            const tagCount = Math.min(tags.length, 3);
            for (let i = 0; i < tagCount; i++) {
                const anchorElement = document.createElement('a');
                anchorElement.href = tagAnchors[i];
                anchorElement.textContent = ' | ' + tags[i];
                anchorElement.style.color = 'blue';
                anchorElement.style.textDecoration = 'none';
                tagsContainer.appendChild(anchorElement);
            }
            
            subtextElement.appendChild(tagsContainer);
            console.log(`Added ${tagCount} tags to story`);
        }
    })
    .catch(error => {
        console.error('Error fetching story tags:', error);
    });

    // Comment handling with exact class matching
    const commentElements = document.querySelectorAll('tr[class="athing comtr"]');
    if (commentElements.length === 0) {
        console.log("No comments found on this page");
        return;
    }

    const comment_ids = Array.from(commentElements).map(element => Number(element.getAttribute('id')));
    console.log(`Processing ${comment_ids.length} comments`);
    console.log(comment_ids);


    // Comment tags fetch
    fetch("https://techne.app/comment-tags/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({comment_ids: comment_ids}),
    })
    .then(response => response.json())
    .then(data => {
        data.forEach(comment => {
            const commentId = comment.id;
            const commentElement = document.getElementById(commentId);
            
            if (!commentElement) {
                console.warn(`Comment element not found for ID ${commentId}`);
                return;
            }

            // Find the comhead element where we'll insert the tags
            const comheadElement = commentElement.querySelector('.comhead');
            if (!comheadElement) {
                console.warn(`Comhead not found for comment ${commentId}`);
                return;
            }

            if (!comment.tags || !comment.tag_anchors) {
                console.warn(`Missing tags or tag_anchors for comment ${commentId}`);
                return;
            }

            const tags = comment.tags;
            const tagAnchors = comment.tag_anchors;

            if (tags.length === tagAnchors.length && tags.length > 0) {
                const tagsContainer = document.createElement('span');
                tagsContainer.style.color = 'blue';
                
                const tagCount = Math.min(tags.length, 2); // Showing fewer tags for comments
                for (let i = 0; i < tagCount; i++) {
                    const anchorElement = document.createElement('a');
                    anchorElement.href = tagAnchors[i];
                    anchorElement.textContent = ' | ' + tags[i];
                    anchorElement.style.color = 'blue';
                    anchorElement.style.textDecoration = 'none';
                    tagsContainer.appendChild(anchorElement);
                }
                
                comheadElement.appendChild(tagsContainer);
                console.log(`Added ${tagCount} tags to comment ${commentId}`);
            }
        });
    })
    .catch(error => {
        console.error('Error fetching comment tags:', error);
    });
})();