(function() {
    // Get the single story submission
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
        console.error('Error fetching tags:', error);
    });
})();