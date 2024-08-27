const athingElements = document.querySelectorAll('tr.athing');
const story_ids = Array.from(athingElements).map(element => Number(element.getAttribute('id')));
const techne_url = "https://techne.app/story-tags/";

console.log("Number of athing elements:", athingElements.length);
console.log("Story IDs:", story_ids);

// Create a map to store the relation between story IDs and their corresponding subtext elements
const storySubtextMap = new Map();

athingElements.forEach((athingElement) => {
    const storyId = Number(athingElement.getAttribute('id'));
    // Find the next sibling that contains the subtext
    let subtextElement = athingElement.nextElementSibling;
    if (subtextElement) {
        const sublineElement = subtextElement.querySelector('.subline');
        if (sublineElement) {
            storySubtextMap.set(storyId, sublineElement);
        } else {
            console.warn(`No .subline found for story ID ${storyId}`);
        }
    } else {
        console.warn(`No sibling element found for story ID ${storyId}`);
    }
});

console.log("Number of matched story-subtext pairs:", storySubtextMap.size);

fetch(techne_url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({story_ids: story_ids}),
})
.then(response => response.json())
.then(data => {
    console.log("API response length:", data.length);

    data.forEach((story) => {
        const storyId = story.id;
        console.log(`Processing story ID ${storyId}`);
        
        const subtextElement = storySubtextMap.get(storyId);
        
        if (!subtextElement) {
            console.warn(`No matching subtext element found for story ID ${storyId}`);
            return;
        }
        
        if (!story.tags || !story.tag_anchors) {
            console.warn(`Missing tags or tag_anchors for story ID ${storyId}`);
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
            console.log(`Added ${tagCount} tags to story ID ${storyId}`);
        } else {
            console.warn(`story ID ${storyId} -- tags.length: ${tags.length}, tagAnchors.length: ${tagAnchors.length}`);
        }
    });
})
.catch(error => {
    console.error('Error fetching tags:', error);
});
