
const subtextElements = document.querySelectorAll('td.subtext .subline');

//const story_ids = [41247023, 41248104, 41245159];

const athingElements = document.querySelectorAll('tr.athing');
const story_ids = Array.from(athingElements).map(athingElements => Number(athingElements.getAttribute('id')));
const teche_url = "https://techne.app/story-tags/"

console.log(story_ids)


function findValidTagAndAnchor(tags, tagAnchors) {
    for (let i = 0; i < tags.length; i++) {
        if (tags[i].length > 0 && tags[i].length < 20) {
            return {
                tag_to_add: tags[i],
                anchor_to_use: tagAnchors[i]
            };
        }
    }
    
    // If no valid tag is found, return null or a default value
    return null;
}


// Make the POST request with the fixed IDs
fetch(teche_url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({story_ids: story_ids}),
})
.then(response => response.json())
.then(data => {
        
    // Process the response, which contains tags and tagAnchors for each ID
    subtextElements.forEach((subtextElement, index) => {
        // Assuming the response data contains arrays of tags and links corresponding to the IDs
        const tags = data[index].tags;  // Adjust according to API response structure
        const tagAnchors = data[index].tag_anchors;  // New array containing links

        console.log(index);
        console.log(tags);
        console.log(tagAnchors);
        
        if (tags !== null && tagAnchors !== null && tags.length === tagAnchors.length) {
            // Add a new element containing a tag
            const tagsElement = document.createElement('span');
            
            tagsElement.style.color = 'blue';
            tagsElement.textContent = ' | ';
            
            const result = findValidTagAndAnchor(tags, tagAnchors);
            
            if (result) {
                // Create an anchor element for the link
                const anchorElement = document.createElement('a');
                anchorElement.href = result.anchor_to_use;
                anchorElement.textContent = result.tag_to_add;
                anchorElement.style.color = 'blue';
                anchorElement.style.textDecoration = 'none';
                
                // Append the link to the tagsElement
                tagsElement.appendChild(anchorElement);
                
                // Append the new span to the subtextElement
                subtextElement.appendChild(tagsElement);
            }
        }
    });
    
})
.catch(error => {
    console.error('Error fetching tags:', error);

    // Handle the error for each element
    subtextElements.forEach(subtextElement => {
        const tagsElement = document.createElement('span');
        tagsElement.style.color = 'blue';
        tagsElement.textContent = ' | Error fetching tag';
        subtextElement.appendChild(tagsElement);
    });
});


//
//const subtextElements = document.querySelectorAll('td.subtext .subline');
//
//subtextElements.forEach((subtextElement) => {
//    // Add a new element containing a tag
//    const tagsElement = document.createElement('span');
//    tagsElement.style.color = 'blue';
//    tagsElement.textContent = ' |  ';
//    subtextElement.appendChild(tagsElement);
//});
//
