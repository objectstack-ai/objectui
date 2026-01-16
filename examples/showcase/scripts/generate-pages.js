
const fs = require('fs');
const path = require('path');

const appJsonPath = path.resolve(__dirname, '../app.json');
const pagesDir = path.resolve(__dirname, '../pages');

const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function getTemplate(label, componentType) {
    // Basic template
    const base = {
        type: "page",
        title: `${label} Component`,
        body: [
            {
                type: "div",
                className: "space-y-6",
                children: [
                    {
                        type: "text",
                        value: `${label}`,
                        className: "text-3xl font-bold tracking-tight"
                    },
                    {
                        type: "text",
                        value: `Examples of the ${label} component.`,
                        className: "text-muted-foreground"
                    },
                    {
                        type: "card",
                        className: "p-6",
                        children: [
                            // Placeholder content to be refined
                            { type: "text", value: `TODO: detailed examples for ${componentType}` }
                        ]
                    }
                ]
            }
        ]
    };

    // Refine based on type
    if (label === 'Button') {
        base.body[0].children[2].children = [
            { type: "div", className: "flex gap-4 flex-wrap", children: [
                { type: "button", label: "Default" },
                { type: "button", label: "Secondary", variant: "secondary" },
                { type: "button", label: "Destructive", variant: "destructive" },
                { type: "button", label: "Outline", variant: "outline" },
                { type: "button", label: "Ghost", variant: "ghost" },
                { type: "button", label: "Link", variant: "link" }
            ]}
        ];
    } else if (label === 'Input') {
         base.body[0].children[2].children = [
            { type: "div", className: "space-y-4 max-w-sm", children: [
                { type: "input", placeholder: "Email", type: "email" },
                { type: "input", placeholder: "Password", type: "password" },
                { type: "input", placeholder: "Disabled", disabled: true }
            ]}
        ];
    }
    // Add more specific templates as needed, but this generic one is a good start
    
    return base;
}

function processMenu(menuItem) {
    if (menuItem.children) {
        menuItem.children.forEach(processMenu);
    } else if (menuItem.path && menuItem.path.startsWith('/')) {
        const filePath = path.join(pagesDir, menuItem.path + '.json');
        const dir = path.dirname(filePath);
        ensureDir(dir);

        if (!fs.existsSync(filePath)) {
            console.log(`Creating ${filePath}`);
            const componentType = menuItem.label.toLowerCase().replace(/\s+/g, '-');
            const content = getTemplate(menuItem.label, componentType);
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
        }
    }
}

appConfig.menu.forEach(processMenu);
console.log('Done generating pages.');
