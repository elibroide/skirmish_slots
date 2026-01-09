const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'cards');

console.log('Migrating cards in:', dir);

fs.readdirSync(dir).forEach(file => {
    if (!file.endsWith('.json')) return;

    // Skip non-card files if any (like index.ts)
    if (file === 'index.ts' || file === 'index.js') return;

    const filePath = path.join(dir, file);
    try
    {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const slug = path.basename(file, '.json');

        let changed = false;

        // 1. Update ID to slug
        if (content.id !== slug)
        {
            content.id = slug;
            changed = true;
        }

        // 2. Move cardType to data
        if (content.cardType)
        {
            content.data.cardType = content.cardType;
            delete content.cardType;
            changed = true;
        }

        // 3. Move unitType to data
        if (content.unitType)
        {
            content.data.unitType = content.unitType;
            delete content.unitType;
            changed = true;
        }

        if (changed)
        {
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
            console.log('Migrated:', file);
        } else
        {
            console.log('No changes needed:', file);
        }
    } catch (e)
    {
        console.error('Error processing', file, e.message);
    }
});
