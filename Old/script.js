// Sample Guide Data (Replace with your actual data or fetch it)
const guideData = {
    title: "How to Replace a Lightbulb",
    links: [
        { url: "https://www.example.com/safety", description: "Safety Precautions" },
        { url: "https://www.example.com/tools", description: "Tools Needed" }
    ],
    steps: [
        { image: "step1.jpg", text: "Step 1: Turn off the power." },
        { image: "step2.jpg", text: "Step 2: Remove the old bulb." },
        // ... more steps
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const titleElement = document.querySelector('h1');
    titleElement.textContent = guideData.title;

    const linkList = document.getElementById('link-list');
    guideData.links.forEach(link => {
        const listItem = document.createElement('li');
        const linkElement = document.createElement('a');
        linkElement.href = link.url;
        linkElement.textContent = link.description;
        listItem.appendChild(linkElement);
        linkList.appendChild(listItem);
    });

    const stepList = document.getElementById('step-list');
    guideData.steps.forEach(step => {
        const listItem = document.createElement('li');
        const imageElement = document.createElement('img');
        imageElement.src = step.image;
        imageElement.alt = `Step ${stepList.children.length + 1}`; // Alt text for accessibility
        imageElement.classList.add('step-image'); // Add class for styling
        const textElement = document.createElement('div');
        textElement.classList.add('step-text'); // Add class for styling
        textElement.textContent = step.text;
        listItem.appendChild(imageElement);
        listItem.appendChild(textElement);
        stepList.appendChild(listItem);
    });
});

// ... (More JavaScript for dynamic steps, translation, etc.)